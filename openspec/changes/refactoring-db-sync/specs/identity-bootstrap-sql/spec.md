## ADDED Requirements

### Requirement: Identity 初始化数据必须通过人工 SQL 管理
`identity-server` 默认初始化数据 MUST 写入 SQL 文件并由人工执行，服务启动和 Umzug migrations 不得自动插入这些业务初始化数据。

#### Scenario: 启动不自动插入初始化数据
- **WHEN** `identity-server` 以 `--sync` 启动并完成结构 migration
- **THEN** 系统不得自动插入 identity resources、clients、client scopes、redirect URIs 或 client secrets

#### Scenario: 人工 SQL 恢复初始化数据
- **WHEN** 部署人员人工执行初始化 SQL 文件
- **THEN** 数据库必须写入现有初始化所需的 identity resources、clients 及其关联数据

### Requirement: SQL 必须覆盖现有默认 OIDC 数据
初始化 SQL MUST 覆盖旧初始化流程中默认插入的 OIDC 初始化数据，包括 identity resources、claims、默认 clients、scopes、grant types、redirect URIs、post logout redirect URIs、CORS origins 和 client secrets 摘要。

#### Scenario: 默认 Web client 可用
- **WHEN** 初始化 SQL 已执行且 Web 使用默认 OIDC client id 请求登录
- **THEN** `identity-server` 必须能找到 `Pomelo Client Web App` client 及其授权码流程配置

#### Scenario: APISIX client 数据保留
- **WHEN** 初始化 SQL 已执行且 APISIX 使用默认 client id 请求 OIDC discovery 或 token 相关流程
- **THEN** `identity-server` 必须能找到 `Pomelo ApiSix Gateway` client 配置

### Requirement: Client secrets 必须以摘要形式存储
初始化 SQL 中的 `client_secrets.value` MUST 使用 `identity-server` 当前 secret 校验算法需要的摘要值，不得要求从数据库反推出明文 secret。

#### Scenario: SQL 保留摘要值
- **WHEN** 初始化 SQL 写入 client secret
- **THEN** `client_secrets.value` 必须是摘要值而不是明文 secret

#### Scenario: 明文 secret 由部署人员管理
- **WHEN** 某个部署组件需要实际 `client_secret`
- **THEN** 部署人员必须单独保存明文 secret，并确保数据库摘要与该明文匹配

### Requirement: Review 恢复 SQL 必须跳过账号表结构 SQL
Review 阶段恢复数据时 MUST 跳过 `po_users.sql` 和 `po_usermeta.sql`，因为账号表结构已经由人工执行处理，服务启动和 migration 也不得自动执行这些 SQL。

#### Scenario: 跳过 po_users
- **WHEN** review 人员执行已导出的 SQL 恢复数据
- **THEN** review 流程必须明确不得执行 `po_users.sql`

#### Scenario: 跳过 po_usermeta
- **WHEN** review 人员执行已导出的 SQL 恢复数据
- **THEN** review 流程必须明确不得执行 `po_usermeta.sql`
