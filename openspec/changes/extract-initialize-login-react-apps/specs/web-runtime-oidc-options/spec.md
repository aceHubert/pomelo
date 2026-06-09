## MODIFIED Requirements

### Requirement: Web 构建不得依赖认证类型环境变量
Web 构建 MUST 移除 `build:web:oidc` 和 `VUE_APP_AUTH_TYPE`，并固定构建 OIDC 回调页；本地登录页和初始化页 MUST 由独立 React 应用承载。

#### Scenario: 单一 Web 构建产物
- **WHEN** 执行 Web 构建
- **THEN** 构建产物必须包含 `signin.html`、`signin-silent.html` 和 `signout.html`
- **AND** Web 构建产物不得继续包含由 `clients/web/src/login` 生成的 `login.html`
- **AND** Web 构建产物不得继续包含由 `clients/web/src/initialize` 生成的 `initialize.html`

#### Scenario: 运行时切换认证模式
- **WHEN** 同一 Web 构建产物部署到不同环境
- **THEN** Web 必须能通过 `auth-oidc` 是否存在切换 Local / OIDC 认证模式
- **AND** Local 模式必须跳转到独立 `pomelo-login` 入口

#### Scenario: 初始化入口独立承载
- **WHEN** Web 运行时检测到站点需要初始化
- **THEN** Web 必须跳转到独立 `pomelo-initialize` 入口
