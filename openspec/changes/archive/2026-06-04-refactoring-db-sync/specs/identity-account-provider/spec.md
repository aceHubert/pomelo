## ADDED Requirements

### Requirement: Account provider 默认必须直连数据库
`identity-server` 的 account provider 默认 MUST 通过数据库直接读取用户和用户元数据，使 `identity-server` 可以不依赖 `infrastructure-service` 独立运行。

#### Scenario: 默认 direct-db 读取账号
- **WHEN** 未显式配置 account provider 模式
- **THEN** `identity-server` 必须使用 direct-db provider 读取账号数据

#### Scenario: ACCOUNT_PROVIDER 默认值
- **WHEN** 环境变量 `ACCOUNT_PROVIDER` 未配置
- **THEN** `identity-server` 必须按 `ACCOUNT_PROVIDER=direct-db` 处理

#### Scenario: ACCOUNT_PROVIDER 选择 direct-db
- **WHEN** 环境变量 `ACCOUNT_PROVIDER` 配置为 `direct-db`
- **THEN** `AccountProviderModule` 必须启用 `AccountDBReadService`

#### Scenario: 独立运行不连接 infrastructure-service
- **WHEN** `identity-server` 使用 direct-db provider 启动
- **THEN** 系统不得要求配置 `INFRASTRUCTURE_SERVICE_PORT` 才能完成账号读取能力初始化

#### Scenario: 使用 IDENTITY_DATABASE_CONNECTION 读取用户库
- **WHEN** direct-db provider 启动且 `IDENTITY_DATABASE_CONNECTION` 指向 `infrastructure-service` 用户数据所在数据库
- **THEN** `identity-server` 必须通过该连接读取用户和用户元数据

#### Scenario: 本地 po_template 数据库读取
- **WHEN** `IDENTITY_DATABASE_CONNECTION` 指向本地 `po_template` 数据库
- **THEN** direct-db provider 必须从该库读取 `users` 和 `usermeta` 默认表结构中的账号数据

#### Scenario: Direct-db 服务命名
- **WHEN** 实现 direct-db account provider
- **THEN** 系统必须使用 `AccountDBReadService` 作为数据库直读账号 provider 的服务类名

#### Scenario: Direct-db 模式注入 UserDatasourceModule
- **WHEN** account provider 模式为 direct-db
- **THEN** `AccountProviderModule` 必须注入 `UserDatasourceModule` 和 `AccountDBReadService`

#### Scenario: Direct-db 模式不注入 ClientsModule
- **WHEN** account provider 模式为 direct-db
- **THEN** `AccountProviderModule` 不得注入 `ClientsModule` 或要求 `INFRASTRUCTURE_SERVICE_PORT`

### Requirement: Direct-db 必须严格使用默认 SQL 表结构
direct-db provider MUST 严格按照已人工处理的 `users` 和 `usermeta` 默认表结构读取账号、claims 和密码数据，不得尝试兼容任意自定义表结构。

#### Scenario: 默认表结构读取 claims
- **WHEN** `users` 和 `usermeta` 表符合默认 SQL 结构
- **THEN** direct-db provider 必须能读取账号基础信息和用户元数据并生成 OIDC claims

#### Scenario: 自定义表结构不走 direct-db
- **WHEN** 部署方需要自定义用户表字段、密码校验或 claims 逻辑
- **THEN** 部署方必须配置 account provider 为 microservice 模式

### Requirement: Microservice provider 必须保留为可选模式
`identity-server` MUST 保留通过 `infrastructure-service` 获取账号、元数据、密码校验和密码更新能力的 provider 模式。

#### Scenario: 显式启用 microservice provider
- **WHEN** 环境变量 `ACCOUNT_PROVIDER` 配置为 `microservice`
- **THEN** `identity-server` 必须通过 `infrastructure-service` 微服务接口处理账号相关能力

#### Scenario: Microservice 模式要求基础服务配置
- **WHEN** account provider 模式为 microservice
- **THEN** 系统必须要求提供可用的 `infrastructure-service` 连接配置

#### Scenario: Microservice 服务重命名
- **WHEN** 保留当前通过 `infrastructure-service` 微服务读取账号的 provider 实现
- **THEN** 系统必须将 `AccountConfigService` 重命名为 `AccountGrcpService`

#### Scenario: Microservice 模式注入 ClientsModule
- **WHEN** account provider 模式为 microservice
- **THEN** `AccountProviderModule` 必须注入 `ClientsModule` 和 `AccountGrcpService`
