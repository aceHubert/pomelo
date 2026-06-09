## ADDED Requirements

### Requirement: 管理登录支持 GraphQL 和 OpenAPI
identity-server SHALL provide a management login operation through both GraphQL and OpenAPI. The implementation SHALL live under `servers/identity-server/src/apis/auth`. The GraphQL operation SHALL be a mutation, and the OpenAPI operation SHALL be available at `POST /v0/management/auth/login`.

#### Scenario: 超级管理员通过 OpenAPI 登录
- **WHEN** 请求方使用超级管理员账号密码调用 `POST /v0/management/auth/login`
- **THEN** 系统返回 Bearer JWT、token 类型和过期信息

#### Scenario: 管理登录代码位于 auth API 目录
- **WHEN** 实现 management login 的 controller、resolver、service、DTO 或模型
- **THEN** 相关文件位于 `servers/identity-server/src/apis/auth` 目录下

#### Scenario: 超级管理员通过 GraphQL 登录
- **WHEN** 请求方使用超级管理员账号密码调用 management login GraphQL mutation
- **THEN** 系统返回与 OpenAPI 登录一致的 Bearer JWT 响应结构

#### Scenario: 登录接口允许匿名访问
- **WHEN** 未携带 Authorization header 的请求调用 management login
- **THEN** 系统执行账号密码校验而不是返回未认证错误

### Requirement: 管理登录仅允许超级管理员
identity-server MUST only issue management JWTs to accounts that pass password verification and are marked as super administrators.

#### Scenario: 普通管理员不能登录管理入口
- **WHEN** 已启用但不具备 `super_administrator = 1` 的账号调用 management login
- **THEN** 系统拒绝签发 JWT

#### Scenario: 非管理员角色不能登录管理入口
- **WHEN** 账号不具备 `capabilities = administrator` 时调用 management login
- **THEN** 系统拒绝签发 JWT

#### Scenario: 密码错误不能登录管理入口
- **WHEN** 请求方使用错误密码调用 management login
- **THEN** 系统拒绝签发 JWT 并返回认证失败响应

### Requirement: 管理 JWT 支持现有授权链路
identity-server SHALL sign management JWTs with the configured `AuthorizationModule` signing key and SHALL make those JWTs usable by the existing Bearer middleware, `@Authorized()`, and `@RamAuthorized()` guards.

#### Scenario: 管理 JWT 可访问 GraphQL 管理接口
- **WHEN** 请求方携带 management login 返回的 Bearer JWT 调用受保护的 Clients GraphQL query
- **THEN** 系统通过身份校验和 RAM action 校验

#### Scenario: 管理 JWT 携带完整 RAM 策略
- **WHEN** 系统签发 management JWT
- **THEN** JWT payload 包含允许 identity-server 管理 action 的 `ram` claim

#### Scenario: 缺少 RAM 策略的 JWT 不能绕过 action 校验
- **WHEN** 请求方携带不含管理 RAM 策略的 JWT 调用 `@RamAuthorized()` 保护的管理接口
- **THEN** 系统拒绝该请求

### Requirement: 管理 JWT 配置不改变 OIDC 流程
identity-server MUST keep the existing OIDC authorization, token, userinfo, introspection, and revocation flows unchanged while adding management JWT login.

#### Scenario: OIDC token 签发保持原行为
- **WHEN** 现有 OIDC client 按授权码流程请求 token
- **THEN** 系统继续使用现有 OIDC provider 配置签发 token

#### Scenario: 默认私钥 warning 由现有包逻辑处理
- **WHEN** 运行环境未配置 `JWT_PRIVATE_KEY`
- **THEN** 系统使用现有 authorization key helper 的默认私钥 warning 机制，不新增公共包行为变更
