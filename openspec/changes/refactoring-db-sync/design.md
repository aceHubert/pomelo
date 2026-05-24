## Context

当前项目里数据库初始化和认证部署边界混在一起：

- `identity-server` 旧初始化流程启动后调用 `syncDB()` 建表，再通过 `initDatas()` 插入 identity resources 和默认 clients，并用 `db.lock` 记录是否初始化过。
- `infrastructure-service` 启动时只做部分结构初始化，用户初始化账号时仍承担数据库生成状态判断。
- `db.lock` 是文件状态，不是数据库状态；在容器、多实例、清空数据库、挂载目录变化时会和真实数据库状态脱节。
- Web 认证方式由 `VUE_APP_AUTH_TYPE` 在构建期决定，导致 Local / OIDC 需要不同构建命令。
- `identity-server` 的账号读取默认依赖 `infrastructure-service` 微服务，OIDC 独立部署时仍需要额外服务。
- 当前 OIDC 镜像通过 `ecosystem.oidc.config.js` 和 PM2 管理多个应用，不符合“镜像只管理一个应用”的目标。

本次变更把结构升级、初始化数据、账号读取、Web 认证配置和 OIDC 镜像打包拆成独立边界。

## Goals / Non-Goals

**Goals:**

- 两个服务统一使用 Umzug 管理数据库结构初始化和升级。
- 删除 `db.lock` 方案，所有结构状态以数据库 migration meta 表为准。
- 用 `--sync` 显式控制启动时是否应用 pending migrations。
- 未带 `--sync` 且存在 pending migrations 时只输出 warning，不阻断启动。
- Docker / 容器环境默认带 `--sync`，本地和非容器环境允许手动加。
- `identity-server` 启动时不再自动插入默认 clients 和 identity resources。
- 默认初始化数据全部沉淀为人工执行 SQL 文件，账号表结构 SQL 已由人工处理，review 时不再执行 `po_users.sql` 和 `po_usermeta.sql`。
- `account-provider` 默认通过 `IDENTITY_DATABASE_CONNECTION` 直连数据库读取 `users` / `usermeta`，微服务模式保留为扩展方案。
- Web 通过所有用户可读取的 `options.auth-oidc` 在运行时决定 Local / OIDC。
- OIDC 镜像使用 `Dockerfile.oidc` 直接启动 `identity-server`，不再使用 PM2。
- Review 阶段支持在本地直接删除相关表，验证 `--sync` 重建结构，通过 Web 初始化 `admin` / `Aa123456` 并验证通过后，再人工 SQL 恢复现有数据。

**Non-Goals:**

- 不在 migration 中自动 seed 默认业务数据。
- 不自动导出现有数据库数据；用户已确认 SQL 已导出。
- 不设计生产环境自动删表或自动清库流程。
- 不改变现有密码摘要算法。
- 不支持 direct-db 模式下任意自定义用户表结构；自定义结构走微服务模式。
- 不重构 OIDC 管理后台的完整功能，只保证受影响配置仍可使用。

## Decisions

### 1. Umzug 只管理结构，不管理初始化数据

两个服务各自提供 migration service，使用 `Umzug + SequelizeStorage` 记录 migration 历史。meta 表建议按服务隔离，例如：

```text
identity_sequelize_meta
infrastructure_sequelize_meta
```

原因：

- 结构升级应由数据库内的 migration 历史决定，不能依赖本地文件。
- 两个服务可能连接同库或不同库，meta 表隔离可以避免 migration 名称冲突。
- 默认业务数据需要人工审阅和部署定制，不适合启动时静默写入。

替代方案：继续用 `syncDB({ alter })` 或 `db.lock`。这个方案不能表达真实升级历史，也不能可靠处理多实例和容器场景。

### 2. `--sync` 是唯一自动执行 migration 的开关

启动时统一检查 pending migrations：

```text
服务启动
  │
  ▼
加载 Umzug migrations
  │
  ├── 有 --sync
  │     └── 执行 pending migrations
  │
  └── 无 --sync
        ├── 无 pending → 正常启动
        └── 有 pending → warning 后继续启动
```

容器入口默认传 `--sync`。非容器环境由开发或部署人员显式传参。

原因：

- 本地开发可以看到 warning，避免不知情地改变数据库。
- 容器部署默认自动升级，减少首次启动失败。
- 用户已明确要求无 `--sync` 不阻断启动。
- pending 检查必须保持只读；meta 表不存在时不得因为检查 pending 而隐式创建 meta 表。

### 3. 初始化 SQL 由人工执行

`identity-server` 默认初始化数据改为 SQL 文件保存，包括：

- identity resources 和 claims。
- 现有默认 clients。
- client scopes、grant types、redirect URIs、post logout redirect URIs、CORS origins。
- client secrets 的摘要值。
- `users` / `usermeta` 账号表结构已由人工处理；review 执行恢复 SQL 时必须跳过 `po_users.sql` 和 `po_usermeta.sql`。

client secret 明文不从数据库恢复。`client_secrets.value` 存储的是 `HMAC-SHA256(secret, key='')` 的摘要。现有注释中的明文 secret 与当前算法不匹配，不能作为可靠凭据来源。

原因：

- 默认数据常包含 URL、client secret、部署域名等环境相关内容，应由部署人员确认。
- SQL 文件便于人工 review、审计和按环境调整。

### 4. `infrastructure-service` 初始化账号只插入数据

站点初始化流程不再判断 `db.lock` 的 `PENDING` 状态，也不负责生成数据库结构。结构由服务启动 `--sync` 完成。

初始化状态应从数据库业务数据判断，例如是否已有管理员账号或关键初始化 option，而不是从文件锁判断。

### 5. `account-provider` 默认直连数据库

`identity-server` 通过环境变量 `ACCOUNT_PROVIDER` 选择 account provider，默认值为 `direct-db`。默认 direct-db 模式通过 `IDENTITY_DATABASE_CONNECTION` 连接到包含 `infrastructure-service` 用户数据的数据库，读取已人工处理并符合默认约定的 `users` 和 `usermeta` 表结构。

实现命名约束：

- `AccountDBReadService`：direct-db provider，负责数据库直读用户、用户元数据、密码校验和 claims 组装。
- `AccountGrcpService`：microservice provider，承接当前 `AccountConfigService` 通过 `infrastructure-service` 微服务读取账号的职责。
- `AccountConfigService` 不再作为账号 provider 实现类名保留。

模块注入约束：

- `AccountProviderModule` 必须根据 `ACCOUNT_PROVIDER` 配置选择 imports 和 provider，不应同时注入 direct-db 和 microservice 两套依赖。
- `ACCOUNT_PROVIDER` 未配置时等同于 `direct-db`。
- `ACCOUNT_PROVIDER=direct-db` 时注入 `UserDatasourceModule` 和 `AccountDBReadService`。
- `ACCOUNT_PROVIDER=microservice` 时注入 `ClientsModule` 和 `AccountGrcpService`。
- `ClientsModule` 不应继续在 `AppModule` 中作为全局依赖注册，避免 direct-db 模式仍要求 `INFRASTRUCTURE_SERVICE_PORT`。

本地 review 配置示例使用 `po_template` 数据库，连接串应通过环境变量注入：

```text
ACCOUNT_PROVIDER=direct-db
IDENTITY_DATABASE_CONNECTION=mysql://hubert:<password>@127.0.0.1:3306/po_template
```

其中 `<password>` 在本地环境中使用实际密码，不写入仓库文档。

```text
identity-server
  ├── direct-db provider（默认）
  │     ├── imports: UserDatasourceModule
  │     └── provider: AccountDBReadService
  │
  └── microservice provider（可选）
        ├── imports: ClientsModule
        └── provider: AccountGrcpService
```

direct-db 模式严格绑定 SQL 文件中的表结构和字段命名。需要自定义用户表、密码逻辑、claims 组装或远程账号服务时，配置为微服务模式。

原因：

- OIDC 独立镜像可以只依赖数据库，不强依赖 `infrastructure-service`。
- 通过 `IDENTITY_DATABASE_CONNECTION` 显式指向 `infrastructure-service` 用户数据所在库，避免 direct-db provider 误读其它数据库。
- 依赖按 provider 模式注入，direct-db 启动不会因为 `ClientsModule` 提前初始化而要求微服务端口。
- 严格 SQL 结构能减少 direct-db 的适配复杂度。

### 6. Web 认证改为运行时 options 决定

删除 `build:web:oidc` 和 `VUE_APP_AUTH_TYPE`。Web 启动前读取所有用户可获取的 `options.auth-oidc`：

```text
读取 auth-oidc
  ├── 不存在 → Local
  └── 存在   → OIDC
```

`auth-oidc` 支持字符串和对象：

- 字符串：authority 或 `.well-known/openid-configuration` 地址。
- 对象：authority 加 endpoints / metadata 配置。

`vue.config.js` 固定构建所有认证相关页面，不再按认证类型区分。

原因：

- 同一 Web 构建产物可在不同环境切换认证方式。
- OIDC callback 页面始终可用，避免重新构建。

### 7. OIDC 镜像只管理 `identity-server`

新增 `Dockerfile.oidc` 专门构建和运行 `identity-server`：

```text
Dockerfile.oidc
  └── node identity-server/dist/main.js --sync
```

移除 OIDC 镜像对 `ecosystem.oidc.config.js` 和 PM2 的依赖。

GitHub deploy workflow 同时构建主应用镜像和 OIDC 专用镜像：

```text
Dockerfile       -> pomelo:<tag>
Dockerfile.oidc  -> pomelo-oidc:<tag>
```

Compose 部署时主应用由 `pomelo-server` 运行内置 nginx、BFF、infrastructure-service；
`identity-server` 使用 `pomelo-oidc:<tag>` 独立容器。

原因：

- 镜像职责单一，健康检查、日志和生命周期更直接。
- 默认 `--sync` 符合容器自动处理数据库结构的要求。

### 8. `identity-server` 配置边界独立

`identity-server` 使用服务内本地 configuration，只保留当前启动必需配置：

- `debug`。
- `contentPath`。
- `server.host` / `server.port` / `server.globalPrefixUri` / `server.cors`。
- `swagger.debug` / `swagger.path`。
- `graphql.debug` / `graphql.path`。

不再从 shared configuration 继承 infrastructure-only 配置，例如 `configPath`、`server.origin`、`tcpHost`、`tcpPort`、upload 配置和 GraphQL subscription path。

根 `.env.sample` 只保留主应用 / infrastructure 样例配置；OIDC 独立部署配置迁移到 `.env.oidc.sample`，包括 `IDENTITY_DATABASE_CONNECTION`、`ACCOUNT_PROVIDER`、`OIDC_*`、`JWT_*` 和 microservice provider 的可选连接项。

`ORIGIN` 和 `WEB_URL` 不作为应用服务运行时必需配置注入容器。当前 example 中的 `ORIGIN` 只用于 APISIX 模板渲染外部访问域名；OIDC client 初始化 SQL 中的 redirect URI 和 CORS origin 由部署人员按实际 Web 访问地址人工确认。

原因：

- `identity-server` 和 `infrastructure-service` 的运行配置边界清晰，便于独立镜像部署。
- 避免 `identity-server` 被 shared configuration 中的 infrastructure 旧配置项隐式耦合。
- `.env` 样例按部署单元拆分，降低误配风险。

### 9. 主镜像内置 nginx 静态入口

主 `Dockerfile` 保留 PM2 管理 Node 服务进程，同时移除 PM2 对 Web 和 content 的静态 `serve` 进程，改为由内置 nginx 处理：

```text
pomelo
  ├── pm2
  │   ├── infrastructure-service --sync  -> 3000/http, 3001/tcp
  │   ├── infrastructure-bff             -> 3002/http
  │   └── nginx
  └── nginx
      ├── :80 /                   -> /app/web，SPA fallback
      ├── /admin、/login、/initialize -> 对应 html 入口
      └── /uploads|languages|themes|plugins -> /app/content
```

主镜像内置 nginx 不代理 `/action/` 或 `/connect/`。BFF、infrastructure-service 和 OIDC 由部署层或运行时 options 使用独立地址访问。
nginx 模板和启动脚本复用 `example/nginx` 与 `example/scripts`，Compose 不再声明独立 nginx 服务。

原因：

- 保留 PM2 的进程重启和生命周期管理能力，避免自写多进程 entrypoint。
- nginx 只负责当前镜像内的 Web 和静态内容出口，解决 SPA 刷新路由的 `try_files` 问题。
- Compose 不再需要额外 nginx 服务，宿主机可直接指向 `pomelo-server` 的 Web 端口。

### 10. 镜像端口约定

主 `pomelo` 镜像内部端口固定为：

- `80`：Web 静态入口。
- `3000`：`infrastructure-service` HTTP。
- `3001`：`infrastructure-service` TCP。
- `3002`：`infrastructure-bff` HTTP。

`pomelo-oidc` 镜像内部端口固定为 `3000`，只运行 `identity-server`。

Compose 默认宿主机端口不直接使用 `3000-3002`，避免本地开发常见端口冲突：

- `8080 -> 80`。
- `13000 -> 3000`。
- `13001 -> 3001`。
- `13002 -> 3002`。

需要固定暴露为 `3000-3002` 时，可通过 `POMERO_*_HOST_PORT` 显式覆盖。

## Risks / Trade-offs

- [Risk] `--sync` 自动执行结构升级可能在容器多副本同时启动时竞争。
  → Mitigation：依赖 Umzug meta 表和数据库约束保证幂等；必要时在部署层控制首个副本先执行。

- [Risk] 已有数据库没有 migration meta 表，直接执行 create table migration 可能和现有表冲突。
  → Mitigation：实现 baseline 策略；已有表但无 meta 时应能标记基线或使用幂等建表逻辑。

- [Risk] 初始化数据改人工 SQL 后，缺少 SQL 会导致 OIDC client 不存在。
  → Mitigation：启动只负责结构；文档和 review 任务必须验证人工执行 SQL 后 OIDC 流程可用。

- [Risk] `client_secrets.value` 只有摘要，无法从 SQL 得到明文。
  → Mitigation：SQL 文件保留摘要；需要实际凭据的部署项必须由部署人员重新生成明文和摘要。

- [Risk] direct-db 模式绑定表结构，用户自定义扩展可能失效。
  → Mitigation：明确 direct-db 只支持默认 SQL 结构；自定义扩展切换到 microservice provider。

- [Risk] Web 启动前读取 options 失败会影响认证模式判断。
  → Mitigation：定义清晰降级策略；建议请求失败时按 Local 模式启动并输出 warning，后台仍可修复 options。

- [Risk] `auth-oidc` 对所有用户可读，错误放入 secret 会泄露。
  → Mitigation：option 定义为 public-read / admin-write，并明确禁止存储 client secret、私钥、token。

## Migration Plan

1. 新增 Umzug migration 基础设施和两个服务的结构 migration。
2. 移除 `db.lock` 读取、写入和 `PENDING` 判断。
3. 将 `identity-server` 现有初始化数据转成 SQL 文件；已导出的本地 SQL 不再由实现过程重复导出。
4. 将 `infrastructure-service` 初始化账号流程改为只插入数据。
5. 增加 direct-db account provider，并保留 microservice provider 配置。
6. 新增 `auth-oidc` option 定义，允许所有用户读取，管理员写入。
7. 调整 Web 初始化顺序和构建配置，移除构建期认证类型分支。
8. 新增 `Dockerfile.oidc`，移除 OIDC 镜像对 `ecosystem.oidc.config.js` 和 PM2 的依赖。
9. Review 时在本地删除相关表和 migration meta 表，使用 `--sync` 验证结构重建。
10. Review 时通过 Web 初始化 `infrastructure-service` 数据，创建账号 `admin`、密码 `Aa123456`，并验证账号可用。
11. Web 初始化账号验证通过后，再人工执行已导出的 SQL 恢复现有数据，并验证恢复后的业务数据可用。

Rollback 策略：

- 代码层回滚到旧启动流程前，不应删除已生成的 migration meta 表。
- 数据层不做自动回滚；如 migration 涉及不可逆结构变更，必须在对应 migration 说明中标注。
- Review 删除表仅限本地数据库，不适用于生产回滚。

## Open Questions

- `auth-oidc` options 对象是否允许覆盖 `client_id`、`scope`、redirect URI，还是只允许配置 authority / endpoints。
- baseline 策略采用自动检测已有表并标记，还是提供一次性人工 baseline 命令。
