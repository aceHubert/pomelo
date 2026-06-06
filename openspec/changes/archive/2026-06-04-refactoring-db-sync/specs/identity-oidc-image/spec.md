## ADDED Requirements

### Requirement: OIDC 镜像必须只运行 identity-server
OIDC 专用镜像 MUST 通过 `Dockerfile.oidc` 构建，并且运行时只管理 `identity-server` 一个应用。

#### Scenario: OIDC 镜像启动单应用
- **WHEN** 使用 OIDC 专用镜像启动容器
- **THEN** 容器必须直接启动 `identity-server`，不得通过 PM2 启动多个应用

#### Scenario: OIDC 镜像内部端口
- **WHEN** 使用 OIDC 专用镜像启动容器
- **THEN** `identity-server` 必须监听 `3000`
- **AND** OIDC 专用镜像必须暴露 `3000`

#### Scenario: 镜像不依赖 ecosystem.oidc.config.js
- **WHEN** 构建或运行 OIDC 专用镜像
- **THEN** 系统不得要求存在 `ecosystem.oidc.config.js`

#### Scenario: Deploy workflow 使用专用 Dockerfile
- **WHEN** GitHub deploy workflow 构建 OIDC 镜像
- **THEN** workflow 必须使用 `Dockerfile.oidc`，不得通过根 `Dockerfile` 和 PM2 配置打包 OIDC 镜像
- **AND** 镜像仓库名必须使用 `pomelo-oidc`

### Requirement: OIDC 镜像必须默认同步数据库结构
OIDC 专用镜像启动 `identity-server` 时 MUST 默认传入 `--sync`，以便容器环境自动处理数据库结构 migration。

#### Scenario: 容器启动自动 sync
- **WHEN** OIDC 专用镜像以默认命令启动
- **THEN** `identity-server` 必须以包含 `--sync` 的启动参数运行

#### Scenario: 初始化数据仍需人工 SQL
- **WHEN** OIDC 专用镜像完成 `--sync` 启动
- **THEN** 系统只能保证数据库结构已同步，不得自动插入 OIDC 初始化数据

### Requirement: identity-server 配置必须独立于 shared configuration
`identity-server` MUST 使用服务内本地 configuration，只保留当前启动必需配置，不得依赖 shared configuration 中的 infrastructure-only 配置。

#### Scenario: identity-server 不导入 shared configuration
- **WHEN** `identity-server` 启动 Nest `ConfigModule`
- **THEN** 必须加载服务内本地 configuration
- **AND** 不得从 `@ace-pomelo/shared/server` 导入 `configuration`

#### Scenario: OIDC env 样例独立
- **WHEN** 部署人员需要配置 `pomelo-oidc`
- **THEN** 仓库必须提供 `.env.oidc.sample`
- **AND** `IDENTITY_DATABASE_CONNECTION`、`ACCOUNT_PROVIDER`、`OIDC_*`、`JWT_*` 必须放在 OIDC 样例中

#### Scenario: 根 env 样例不包含 OIDC 私有配置
- **WHEN** 部署人员查看根 `.env.sample`
- **THEN** 该样例不得包含 `IDENTITY_DATABASE_CONNECTION`、`ACCOUNT_PROVIDER`、`OIDC_*` 或 `JWT_*`

#### Scenario: 应用容器不注入 ORIGIN
- **WHEN** 使用 example Compose 启动主应用或 OIDC 应用容器
- **THEN** Compose 不得向 `pomelo-server` 或 `pomelo-identity-server` 注入 `ORIGIN`
- **AND** APISIX 模板可以继续使用 `ORIGIN` 表示外部访问域名
