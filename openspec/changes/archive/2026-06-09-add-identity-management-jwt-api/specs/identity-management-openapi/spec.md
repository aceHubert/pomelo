## ADDED Requirements

### Requirement: Clients 管理支持 OpenAPI
identity-server SHALL provide REST/OpenAPI endpoints under `/v0/management` for existing Clients management operations that currently exist as GraphQL resolver operations.

#### Scenario: 查询客户端列表
- **WHEN** 请求方携带有效管理 Bearer JWT 调用 `/v0/management/clients` 列表 OpenAPI
- **THEN** 系统返回分页客户端列表和总数

#### Scenario: 管理客户端详情
- **WHEN** 请求方携带有效管理 Bearer JWT 创建、查询或更新 client
- **THEN** 系统复用现有 Client datasource 规则处理请求

#### Scenario: 管理客户端子资源
- **WHEN** 请求方携带有效管理 Bearer JWT 管理 client scopes、claims、grant types、CORS origins、redirect URIs、post logout redirect URIs、secrets 或 properties
- **THEN** 系统执行与现有 GraphQL 管理能力一致的创建、查询和删除行为

### Requirement: API Resources 管理支持 OpenAPI
identity-server SHALL provide REST/OpenAPI endpoints under `/v0/management` for existing API Resources management operations that currently exist as GraphQL resolver operations.

#### Scenario: 查询 API Resource 列表
- **WHEN** 请求方携带有效管理 Bearer JWT 调用 `/v0/management/api-resources` 列表 OpenAPI
- **THEN** 系统返回分页 API Resource 列表和总数

#### Scenario: 管理 API Resource 详情
- **WHEN** 请求方携带有效管理 Bearer JWT 创建、查询、更新或删除 API Resource
- **THEN** 系统复用现有 ApiResource datasource 规则处理请求

#### Scenario: 管理 API Resource 子资源
- **WHEN** 请求方携带有效管理 Bearer JWT 管理 API Resource claims、scopes、scope claims、secrets 或 properties
- **THEN** 系统执行与现有 GraphQL 管理能力一致的行为

### Requirement: Identity Resources 管理支持 OpenAPI
identity-server SHALL provide REST/OpenAPI endpoints under `/v0/management` for existing Identity Resources management operations that currently exist as GraphQL resolver operations.

#### Scenario: 查询 Identity Resource 列表
- **WHEN** 请求方携带有效管理 Bearer JWT 调用 `/v0/management/identity-resources` 列表 OpenAPI
- **THEN** 系统返回分页 Identity Resource 列表和总数

### Requirement: 管理 OpenAPI 路径统一版本化
identity-server MUST define every new management REST/OpenAPI route with the `/v0/management` prefix.

#### Scenario: 管理 REST 路径使用统一前缀
- **WHEN** 新增 management auth、Clients、API Resources 或 Identity Resources 的 REST controller route
- **THEN** route path 以 `/v0/management` 开头

#### Scenario: GraphQL 不使用 REST 前缀
- **WHEN** 请求方调用 management login GraphQL mutation 或其他 GraphQL operation
- **THEN** 系统继续通过现有 GraphQL endpoint 暴露 operation，而不是要求 GraphQL operation 路径包含 `/v0/management`

#### Scenario: 管理 Identity Resource 详情
- **WHEN** 请求方携带有效管理 Bearer JWT 创建、查询、更新或删除 Identity Resource
- **THEN** 系统复用现有 IdentityResource datasource 规则处理请求

#### Scenario: 管理 Identity Resource 子资源
- **WHEN** 请求方携带有效管理 Bearer JWT 管理 Identity Resource claims 或 properties
- **THEN** 系统执行与现有 GraphQL 管理能力一致的行为

### Requirement: OpenAPI 管理接口使用现有授权模型
identity-server MUST protect management OpenAPI endpoints with Bearer JWT authentication and the same RAM action authorization model used by GraphQL management resolvers.

#### Scenario: 未认证请求被拒绝
- **WHEN** 请求方不携带 Bearer JWT 调用受保护管理 OpenAPI
- **THEN** 系统拒绝请求

#### Scenario: 缺少 RAM 权限的请求被拒绝
- **WHEN** 请求方携带有效 JWT 但缺少对应 RAM action 策略调用管理 OpenAPI
- **THEN** 系统拒绝请求

#### Scenario: Swagger 声明 Bearer 授权
- **WHEN** Swagger/OpenAPI 文档生成
- **THEN** 管理资源接口声明 Bearer JWT 授权，management login 接口不要求 Bearer 授权
