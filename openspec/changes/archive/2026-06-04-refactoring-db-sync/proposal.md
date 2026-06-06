## Why

当前 `identity-server` 和 `infrastructure-service` 的数据库初始化依赖启动时 `syncDB`、`db.lock` 和部分业务流程触发，状态来源分散，容器、多实例和本地升级场景容易失真。

本次变更将数据库结构升级、初始化数据、认证模式和 OIDC 镜像打包边界拆开，使服务启动、人工初始化和 review 验证流程更清晰、可重复。

## What Changes

- **BREAKING** 移除 `db.lock` 初始化状态方案，数据库结构状态改由 Umzug migration 记录表管理。
- **BREAKING** `identity-server` 和 `infrastructure-service` 启动时不再自动插入业务初始化数据。
- 两个服务统一使用 Umzug 管理数据库建表和升级。
- 启动参数增加 `--sync` 语义：带 `--sync` 时执行 pending migrations；未带 `--sync` 但存在 pending migrations 时只输出 warning。
- Docker / 容器启动默认带 `--sync`，非容器环境允许手动传入 `--sync`。
- `infrastructure-service` 的管理员初始化账号流程只插入业务数据，不再负责生成数据库结构。
- `identity-server` 初始化数据改为人工执行 SQL 文件，包括 identity resources、clients、scopes、redirect URIs、CORS origins、client secrets 摘要等现有初始化数据。
- `identity-server` 的 direct-db 账号读取基于已人工处理的 `users` / `usermeta` 表结构，review 执行 SQL 时不得执行 `po_users.sql` 和 `po_usermeta.sql`。
- `account-provider` 默认改为直连数据库读取用户与用户元数据，使 `identity-server` 可不依赖 `infrastructure-service` 独立运行。
- 新增环境变量 `ACCOUNT_PROVIDER` 用于选择账号提供方，默认值为 `direct-db`。
- direct-db account-provider 使用 `IDENTITY_DATABASE_CONNECTION` 连接到 `infrastructure-service` 用户数据所在数据库，例如本地 `po_template` 库。
- 现有微服务账号提供方实现从 `AccountConfigService` 重命名为 `AccountGrcpService`，direct-db 账号读取实现命名为 `AccountDBReadService`。
- `AccountProviderModule` 根据 `ACCOUNT_PROVIDER` 配置二选一注入依赖：`direct-db` 注入 `UserDatasourceModule`，`microservice` 注入 `ClientsModule`。
- `account-provider` 保留微服务模式；只有自定义扩展或不满足默认 SQL 结构约束时才配置为微服务模式。
- `identity-server` 拆出本地 configuration，只保留自身启动、CORS、Swagger、GraphQL、content path 等必要配置，不再依赖 shared configuration 中的 infrastructure 配置项。
- 根 `.env.sample` 保留主应用 / infrastructure 配置，新增 `.env.oidc.sample` 作为 `identity-server` / `pomelo-oidc` 独立部署配置样例。
- `web` 移除 `build:web:oidc` 和 `VUE_APP_AUTH_TYPE`，改为运行时读取所有用户可访问的 `options.auth-oidc` 决定 Local / OIDC。
- `vue.config.js` 固定构建 `login.html`、`signin.html`、`signin-silent.html`、`signout.html`，不再按认证类型分支。
- 增加 `Dockerfile.oidc` 专门打包 `identity-server`，移除 OIDC 镜像对 `ecosystem.oidc.config.js` 和 PM2 的依赖。
- Review 阶段允许在本地数据库直接删除相关表，验证 `--sync` 重建结构，再人工执行已导出的 SQL 验证初始化数据恢复。
- Review 阶段 `infrastructure-service` 必须先通过 Web 初始化账号 `admin` / `Aa123456` 并验证通过，再执行 SQL 恢复现有数据。

## Capabilities

### New Capabilities

- `database-migration-sync`: 定义服务启动时基于 Umzug 和 `--sync` 的数据库结构初始化、升级、pending warning 和 review 验证行为。
- `identity-bootstrap-sql`: 定义 `identity-server` 初始化数据通过人工 SQL 文件管理的行为，并约束 review 阶段跳过账号表结构 SQL。
- `identity-account-provider`: 定义 `identity-server` 默认直连数据库读取账号数据，并可切换微服务账号提供方的行为。
- `web-runtime-oidc-options`: 定义 Web 运行时通过 `options.auth-oidc` 决定认证模式和 OIDC settings 的行为。
- `identity-oidc-image`: 定义 `identity-server` 独立 OIDC 镜像打包和启动方式。

### Modified Capabilities

- 无。

## Impact

- 影响 `servers/identity-server` 的数据库同步、OIDC 初始化数据、account-provider 模块依赖注入、Docker 打包和启动参数。
- 影响 `servers/identity-server` 的配置入口，使其不再复用 shared configuration。
- 影响 `servers/infrastructure-service` 的数据库同步、站点初始化判断和管理员初始化账号流程。
- 影响 `servers/infrastructure-bff` 和 shared option 定义，使 `auth-oidc` 支持所有用户读取、管理员写入。
- 影响 `clients/web` 的认证初始化、OIDC callback 页面构建、运行时 options 读取和相关构建命令。
- 影响根 `package.json`、`.env.sample` / `.env.oidc.sample`、Dockerfile / Compose / 部署脚本、Nest CLI 构建资源复制和 review 验证流程。
- 需要新增或启用 `umzug` 依赖，并为两个服务配置 migrations 构建 / 复制策略。
