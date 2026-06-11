## ADDED Requirements

### Requirement: 认证能力必须同时提供 OpenAPI 和 GraphQL 入口
`infrastructure-bff` SHALL 为注册和第三方登录能力同时提供 OpenAPI REST controller 与 GraphQL resolver。两种入口 MUST 委托同一应用服务，并复用等价的 input、response 和错误语义。

#### Scenario: 注册能力双入口
- **WHEN** 客户端需要发送注册邮箱验证码或提交注册
- **THEN** `infrastructure-bff` SHALL 提供对应的 OpenAPI REST endpoint
- **AND** `infrastructure-bff` SHALL 提供对应的 GraphQL mutation
- **AND** 两种入口 SHALL 执行相同的注册开关、邮箱后缀、邮箱发送配置、验证码和用户唯一性校验

#### Scenario: 第三方登录能力双入口
- **WHEN** 客户端需要发起第三方登录或完成第三方回调
- **THEN** `infrastructure-bff` SHALL 提供对应的 OpenAPI REST endpoint
- **AND** `infrastructure-bff` SHALL 提供对应的 GraphQL mutation
- **AND** 两种入口 SHALL 执行相同的 provider enable、provider 配置、state、PKCE 和用户绑定校验

### Requirement: OpenAPI 和 GraphQL 文档必须暴露认证入口
新增认证入口 SHALL 能被现有 infrastructure API 文档能力发现。

#### Scenario: Swagger/OpenAPI 文档包含认证 REST 入口
- **WHEN** `swagger.debug` 启用并访问 infrastructure Swagger/OpenAPI 文档
- **THEN** 文档 SHALL 包含注册验证码发送、注册提交、第三方登录 start 和第三方登录 complete 的 REST endpoint

#### Scenario: GraphQL schema 包含认证 mutation
- **WHEN** GraphQL schema 生成或调试入口启用
- **THEN** schema SHALL 包含注册验证码发送、注册提交、第三方登录 start 和第三方登录 complete mutation

### Requirement: OpenAPI 和 GraphQL 入口返回结构必须一致
同一认证动作通过 OpenAPI REST 和 GraphQL 调用时，系统 SHALL 返回等价业务结构，避免客户端因入口不同而处理不同语义。

#### Scenario: 注册提交返回 token
- **WHEN** 同一有效注册请求分别通过 OpenAPI REST 和 GraphQL 调用
- **THEN** 两种入口 SHALL 返回与 `signIn` 兼容的 token 结果

#### Scenario: 第三方登录 start 返回授权地址
- **WHEN** 同一 provider start 请求分别通过 OpenAPI REST 和 GraphQL 调用
- **THEN** 两种入口 SHALL 返回等价的授权跳转地址和必要元信息

#### Scenario: 入口错误语义一致
- **WHEN** 注册关闭、provider 未启用、配置缺失或 state 无效
- **THEN** OpenAPI REST 和 GraphQL 入口 SHALL 返回等价的业务错误语义
