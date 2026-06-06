## ADDED Requirements

### Requirement: Web 必须通过 `auth-oidc` option 运行时决定认证模式
Web 应用 MUST 在启动时读取所有用户可访问的 `options.auth-oidc`。不存在该 option 时使用 Local 认证；存在该 option 时使用 OIDC 认证。

#### Scenario: 无 auth-oidc 使用 Local
- **WHEN** Web 启动时未读取到 `auth-oidc`
- **THEN** Web 必须初始化为 Local 认证模式

#### Scenario: 有 auth-oidc 使用 OIDC
- **WHEN** Web 启动时读取到有效的 `auth-oidc`
- **THEN** Web 必须初始化为 OIDC 认证模式并创建 OIDC user manager

### Requirement: `auth-oidc` 必须所有用户可读取
`auth-oidc` option MUST 允许未登录用户、普通用户和管理员读取，并且只允许管理员修改。

#### Scenario: 未登录用户读取 auth-oidc
- **WHEN** 未登录用户访问 options autoload 接口
- **THEN** 系统必须返回可公开读取的 `auth-oidc` 配置

#### Scenario: 普通用户不能修改 auth-oidc
- **WHEN** 非管理员用户尝试修改 `auth-oidc`
- **THEN** 系统必须拒绝修改

### Requirement: `auth-oidc` 必须支持字符串和 endpoints 对象
`auth-oidc` MUST 支持字符串形式的 authority 或 `.well-known/openid-configuration` 地址，也必须支持包含 authority 和 endpoints / metadata 的对象形式。

#### Scenario: 字符串配置 authority
- **WHEN** `auth-oidc` 是 authority 字符串
- **THEN** Web 必须基于该 authority 生成 OIDC settings

#### Scenario: 字符串配置 well-known 地址
- **WHEN** `auth-oidc` 是 `.well-known/openid-configuration` 地址
- **THEN** Web 必须基于该 discovery 地址生成 OIDC settings

#### Scenario: 对象配置 endpoints
- **WHEN** `auth-oidc` 是包含 endpoints 的对象
- **THEN** Web 必须基于对象中的 endpoint 信息生成 OIDC settings

### Requirement: Web 构建不得依赖认证类型环境变量
Web 构建 MUST 移除 `build:web:oidc` 和 `VUE_APP_AUTH_TYPE`，并固定构建 Local 登录页和 OIDC 回调页。

#### Scenario: 单一 Web 构建产物
- **WHEN** 执行 Web 构建
- **THEN** 构建产物必须同时包含 `login.html`、`signin.html`、`signin-silent.html` 和 `signout.html`

#### Scenario: 运行时切换认证模式
- **WHEN** 同一 Web 构建产物部署到不同环境
- **THEN** Web 必须能通过 `auth-oidc` 是否存在切换 Local / OIDC 认证模式
