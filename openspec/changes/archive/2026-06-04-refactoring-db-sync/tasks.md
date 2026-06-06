## 1. Migration 基础设施

- [x] 1.1 在工作区依赖中加入或启用 `umzug`，确认两个服务构建后可加载 migration 文件
- [x] 1.2 为 `identity-server` 设计 migration service，使用服务隔离的 Umzug meta 表记录执行历史
- [x] 1.3 为 `infrastructure-service` 设计 migration service，使用服务隔离的 Umzug meta 表记录执行历史
- [x] 1.4 增加启动参数解析，统一识别 `--sync`
- [x] 1.5 实现未带 `--sync` 时 pending migrations warning，不自动执行、不阻断启动
- [x] 1.6 配置 Nest build / Docker build，确保 migration 文件进入运行产物

## 2. Identity 数据库迁移

- [x] 2.1 将 `identity-server` 现有 Sequelize 表结构整理为 Umzug migrations
- [x] 2.2 设计已有数据库 baseline 处理，避免已有表但无 meta 时重复建表失败
- [x] 2.3 移除 `identity-server` 对 `db.lock`、`FileEnv` 和 `initDatas()` 自动插入数据的依赖
- [x] 2.4 保留 OIDC provider 启动时对缺失表的可诊断日志，避免静默失败
- [x] 2.5 验证 `identity-server --sync` 可在空库中创建完整结构

## 3. Infrastructure 数据库迁移与初始化拆分

- [x] 3.1 将 `infrastructure-service` 现有 Sequelize 表结构整理为 Umzug migrations
- [x] 3.2 移除 `infrastructure-service` 对 `db.lock` 和 `PENDING` 状态的依赖
- [x] 3.3 调整站点初始化状态判断，改为基于管理员账号或关键业务数据判断
- [x] 3.4 调整管理员初始化账号流程，只插入业务数据，不执行建表或 schema sync
- [x] 3.5 验证 `infrastructure-service --sync` 可在空库中创建完整结构

## 4. Identity 初始化 SQL

- [x] 4.1 新增 `identity-server` 人工初始化 SQL，覆盖现有 identity resources、claims、默认 clients 和关联数据
- [x] 4.2 在 SQL 中保留现有 `client_secrets.value` 摘要值，并说明明文 secret 需由部署人员单独管理
- [x] 4.3 为 SQL 文件添加执行前提说明，包括 redirect URI、CORS origin、secret 摘要替换规则，以及 review 时不得执行 `po_users.sql` / `po_usermeta.sql`
- [x] 4.4 确认 SQL 文件不会被 Umzug 自动执行

## 5. Account Provider 重构

- [x] 5.1 增加 `ACCOUNT_PROVIDER` 环境变量配置，默认值为 `direct-db`，允许值为 `direct-db` / `microservice`
- [x] 5.2 调整 `AccountProviderModule`，根据 `ACCOUNT_PROVIDER` 二选一注入 `UserDatasourceModule` 或 `ClientsModule`
- [x] 5.3 将现有 `AccountConfigService` 重命名为 `AccountGrcpService`，作为 microservice provider 实现
- [x] 5.4 新增 `AccountDBReadService`，作为 direct-db provider 实现
- [x] 5.5 配置 `AccountDBReadService` 使用 `IDENTITY_DATABASE_CONNECTION` 连接到 `infrastructure-service` 用户数据所在数据库
- [x] 5.6 在 `AccountDBReadService` 中实现用户读取、用户元数据读取和 claims 组装
- [x] 5.7 在 `AccountDBReadService` 中实现密码校验，保持现有密码摘要兼容
- [x] 5.8 处理 direct-db 下默认手机号区域等原先来自 options 的配置来源
- [x] 5.9 保留 `AccountGrcpService`，并在显式配置 microservice 模式时继续使用 `infrastructure-service`
- [x] 5.10 从 `AppModule` 移除全局 `ClientsModule` 注册，避免 direct-db 模式要求 `INFRASTRUCTURE_SERVICE_PORT`
- [x] 5.11 验证 direct-db 模式下 `identity-server` 不要求 `INFRASTRUCTURE_SERVICE_PORT`
- [x] 5.12 使用本地 `po_template` 数据库连接配置验证 direct-db provider 能读取 `infrastructure-service` 用户数据

## 6. Web 运行时 OIDC 配置

- [x] 6.1 在 shared option key 中新增 `auth-oidc`
- [x] 6.2 在 `infrastructure-bff` option definition 中将 `auth-oidc` 配置为所有用户可读、管理员可写
- [x] 6.3 调整 Web 启动顺序，在初始化认证、fetch、graphql、router 前读取 autoload options
- [x] 6.4 支持 `auth-oidc` 字符串形式 authority / `.well-known` 地址
- [x] 6.5 支持 `auth-oidc` 对象形式 authority + endpoints / metadata
- [x] 6.6 移除 `VUE_APP_AUTH_TYPE` 读取和 `build:web:oidc` 命令
- [x] 6.7 调整 `vue.config.js`，固定构建 `login.html`、`signin.html`、`signin-silent.html`、`signout.html`
- [x] 6.8 验证同一 Web 构建产物在无 `auth-oidc` 时使用 Local，在有 `auth-oidc` 时使用 OIDC

## 7. OIDC 镜像打包

- [x] 7.1 新增 `Dockerfile.oidc`，只构建和运行 `identity-server`
- [x] 7.2 将 OIDC 镜像默认启动命令改为直接执行 `node ... --sync`
- [x] 7.3 移除 OIDC 镜像对 PM2 和 `ecosystem.oidc.config.js` 的依赖
- [x] 7.4 更新 Docker / Compose / 部署文档中 OIDC 镜像相关命令和环境变量
- [x] 7.5 验证 OIDC 镜像运行时只管理一个应用
- [x] 7.6 调整 GitHub deploy workflow，使用 `Dockerfile.oidc` 独立构建和部署 OIDC 镜像
- [x] 7.7 将主 `pomelo` 镜像改为 PM2 管理 nginx、BFF、infrastructure-service
- [x] 7.8 移除主镜像中的 PM2 Web/static `serve` 进程，并用内置 nginx 处理 SPA fallback 和 content 静态文件
- [x] 7.9 从 Compose 部署中移除独立 nginx 服务，改为暴露 `pomelo-server` 的 Web 和 Node 服务端口
- [x] 7.10 将 `identity-server` 的 configuration 拆到服务内，只保留当前必需配置
- [x] 7.11 将根 `.env.sample` 与 OIDC 独立部署 `.env.oidc.sample` 分离

## 8. Review 验证

- [x] 8.1 在本地开发库确认初始化 SQL 已由用户导出，不在实现中重复导出
- [x] 8.2 Review 时列出将删除的本地相关表和 migration meta 表，确认只作用于本地数据库
- [x] 8.3 删除本地相关表后，分别用 `--sync` 验证 `identity-server` 和 `infrastructure-service` 重建结构
- [x] 8.4 通过 Web 初始化 `infrastructure-service` 数据，创建账号 `admin`、密码 `Aa123456`
- [x] 8.5 验证 `admin` / `Aa123456` 可完成登录或初始化校验
- [x] 8.6 Web 初始化账号验证通过后，人工执行已导出的 SQL 恢复现有数据
- [x] 8.7 人工执行 identity 初始化 SQL，验证默认 OIDC resources 和 clients 可用
- [x] 8.8 恢复 SQL 时明确跳过 `po_users.sql` 和 `po_usermeta.sql`，并验证 direct-db account provider 可基于已存在账号表读取用户并完成登录
- [x] 8.9 设置 `IDENTITY_DATABASE_CONNECTION` 指向本地 `po_template` 数据库，验证 direct-db account provider 读取的是 `infrastructure-service` 用户数据
- [x] 8.10 执行相关 lint、test、build 和服务启动验证
- [x] 8.11 验证未带 `--sync` 且存在 pending migrations 时只输出 warning
