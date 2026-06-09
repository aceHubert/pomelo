## ADDED Requirements

### Requirement: 提供独立 React 初始化应用
系统 SHALL 提供独立 `pomelo-initialize` React 应用，用于承载站点初始化流程。

#### Scenario: 初始化应用位于独立目录
- **WHEN** 实现站点初始化前端
- **THEN** 前端代码位于 `clients/pomelo-initialize`
- **AND** 不继续扩展 `clients/web/src/initialize`

#### Scenario: 初始化应用不依赖 Vue
- **WHEN** 构建 `pomelo-initialize`
- **THEN** 应用不得引入 Vue、Vue Router、Pinia、`@ace-fetch/graphql-vue` 或 `ant-design-vue`

### Requirement: 初始化应用不得使用 router
`pomelo-initialize` MUST 不使用前端 router 能力，因为它只有一个页面。

#### Scenario: 单页初始化
- **WHEN** 用户访问初始化入口
- **THEN** 应用直接渲染初始化页面
- **AND** 不创建 React Router 或其他路由实例

#### Scenario: redirect 参数读取
- **WHEN** 初始化页面需要读取回跳地址
- **THEN** 应用通过当前 URL query 中的 `redirect` 参数读取
- **AND** 未提供 `redirect` 时默认跳转到 `/admin`

### Requirement: 初始化应用使用 Apollo GraphQL 调用现有初始化接口
`pomelo-initialize` SHALL 使用 Apollo Client 调用现有 BFF GraphQL 初始化接口。

#### Scenario: 检查是否需要初始化
- **WHEN** 初始化应用加载
- **THEN** 应用调用 `checkSiteInitialRequired`
- **AND** 返回不需要初始化时跳转到 `redirect` 或 `/admin`

#### Scenario: 提交初始化
- **WHEN** 用户提交站点标题、管理员密码、管理员邮箱、主页地址和默认语言
- **THEN** 应用调用 `startSiteInitial`
- **AND** 请求变量类型保持为 `SiteInitArgsInput`

#### Scenario: 密码哈希兼容
- **WHEN** 初始化应用提交管理员密码
- **THEN** 应用必须在前端继续对密码执行 SHA-256 后再提交

### Requirement: 初始化应用独立构建和托管
`pomelo-initialize` SHALL 独立构建，并由运行时静态入口托管。

#### Scenario: 独立构建
- **WHEN** 执行初始化应用构建
- **THEN** 构建不依赖 `clients/web` 的 Vue CLI 多页面配置
- **AND** 生产构建入口文件名必须为 `index.html`

#### Scenario: 初始化入口保持兼容
- **WHEN** 用户访问 `/initialize` 或 `/initialize/*`
- **THEN** 运行时静态入口返回 `pomelo-initialize` 目录下的 `index.html` 产物

### Requirement: Web 初始化入口必须可配置
Web 主站 SHALL 使用 `VUE_APP_INITIALIZE_BASE_URL` 配置独立初始化应用入口。

#### Scenario: 默认初始化入口
- **WHEN** 未显式配置初始化入口
- **THEN** `VUE_APP_INITIALIZE_BASE_URL` 的默认值必须为 `/initialize`

#### Scenario: 本地测试覆盖初始化入口
- **WHEN** 本地测试需要使用独立初始化 dev server 或代理路径
- **THEN** Web 主站必须允许通过 `VUE_APP_INITIALIZE_BASE_URL` 覆盖初始化应用入口

### Requirement: 初始化应用开发环境必须指定端口
`pomelo-initialize` SHALL 在 `.env.development` 中显式声明本地 Vite dev server host 和 port，并由 Vite config 使用。

#### Scenario: 初始化应用声明 dev host 和 port
- **WHEN** 配置 `pomelo-initialize` 开发环境
- **THEN** `.env.development` 必须包含 `DEV_HOST` 和 `DEV_PORT`
- **AND** `DEV_PORT` 必须为 `5013`

#### Scenario: 初始化应用 Vite 使用 dev host 和 port
- **WHEN** 启动 `pomelo-initialize` dev server
- **THEN** Vite config 必须使用 `DEV_HOST` 配置 `server.host`
- **AND** 使用 `DEV_PORT` 配置 `server.port`

#### Scenario: Web 本地初始化入口使用完整 origin
- **WHEN** Web 主站本地测试跳转到独立初始化 dev server
- **THEN** `VUE_APP_INITIALIZE_BASE_URL` 必须配置为 `http://localhost:5013/initialize`

### Requirement: 初始化应用视觉风格对齐 identity-server-management
`pomelo-initialize` SHALL 参考 `identity-server-management` 的液态玻璃、全局背景色和 primary button 风格。

#### Scenario: 初始化页面使用液态玻璃表单层
- **WHEN** 用户访问初始化页面
- **THEN** 初始化表单必须展示在液态玻璃面板或等价视觉容器中

#### Scenario: 初始化页面使用统一背景
- **WHEN** 初始化应用渲染页面背景
- **THEN** 页面必须使用与 `identity-server-management` 一致的全局背景色和主题 token 语义

#### Scenario: 初始化提交按钮使用统一 primary 风格
- **WHEN** 初始化页面展示提交按钮
- **THEN** 按钮必须使用与 `identity-server-management` 一致的 Ant Design primary button 主题风格
