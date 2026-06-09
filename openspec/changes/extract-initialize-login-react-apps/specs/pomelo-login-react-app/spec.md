## ADDED Requirements

### Requirement: 提供独立 React 登录应用
系统 SHALL 提供独立 `pomelo-login` React 应用，用于承载本地登录和密码相关流程。

#### Scenario: 登录应用位于独立目录
- **WHEN** 实现本地登录前端
- **THEN** 前端代码位于 `clients/pomelo-login`
- **AND** 不继续扩展 `clients/web/src/login`

#### Scenario: 登录应用不依赖 Vue
- **WHEN** 构建 `pomelo-login`
- **THEN** 应用不得引入 Vue、Vue Router、Pinia、`@ace-fetch/graphql-vue` 或 `ant-design-vue`

### Requirement: 登录应用必须使用 router
`pomelo-login` MUST 使用 React Router history 路由模式承载登录、修改密码和忘记密码页面，不得使用 hash 路由。

#### Scenario: 登录路由
- **WHEN** 用户访问登录应用 `/login` 路由
- **THEN** 系统展示登录页面
- **AND** 地址栏不得包含 hash 路由片段

#### Scenario: 修改密码路由
- **WHEN** 用户访问 `/password/modify`
- **THEN** 系统展示修改密码页面

#### Scenario: 忘记密码路由
- **WHEN** 用户访问 `/password/forgot`
- **THEN** 系统展示忘记密码页面

### Requirement: 登录应用生产 base 使用 auth
`pomelo-login` SHALL 在生产环境使用 `/auth` 作为 canonical base URL。

#### Scenario: 生产主入口
- **WHEN** 生产环境托管 `pomelo-login`
- **THEN** 用户可以通过 `/auth/login` 访问登录页
- **AND** 用户可以通过 `/auth/password/modify` 和 `/auth/password/forgot` 访问密码相关页面

#### Scenario: 生产构建 base
- **WHEN** 执行 `pomelo-login` 生产构建
- **THEN** Vite base URL 必须使用 `/auth/`
- **AND** 生产构建入口文件名必须为 `index.html`

### Requirement: 登录应用必须兼容 login alias
`pomelo-login` MUST 支持 `/login` 作为 `/auth/login` 的兼容 alias。

#### Scenario: 旧登录入口
- **WHEN** 用户访问 `/login`
- **THEN** 系统展示 `pomelo-login` 登录页面

### Requirement: 登录应用固定业务路由
`pomelo-login` MUST 使用固定业务路由 `/login` 和 `/password/*`，不得把旧 `/login` alias 当作动态 basename。

#### Scenario: 固定登录地址
- **WHEN** Web 主站需要跳转到登录页
- **THEN** 跳转地址必须由 `VUE_APP_AUTH_BASE_URL` 与固定路由 `/login` 拼接得到
- **AND** 默认结果为 `/auth/login`

#### Scenario: 固定修改密码地址
- **WHEN** Web 主站需要跳转到修改密码页
- **THEN** 跳转地址必须由 `VUE_APP_AUTH_BASE_URL` 与固定路由 `/password/modify` 拼接得到
- **AND** 默认结果为 `/auth/password/modify`

#### Scenario: 固定忘记密码地址
- **WHEN** 登录应用需要跳转到忘记密码页
- **THEN** 跳转地址必须使用固定路由 `/password/forgot`

### Requirement: 登录应用使用 Apollo GraphQL 调用现有登录接口
`pomelo-login` SHALL 使用 Apollo Client 调用现有 BFF GraphQL 登录和修改密码接口。

#### Scenario: 本地登录
- **WHEN** 用户提交用户名和密码
- **THEN** 应用调用 `signIn`
- **AND** 请求变量类型保持为 `SignInInput`

#### Scenario: 修改密码
- **WHEN** 用户提交用户名、旧密码和新密码
- **THEN** 应用调用 `updateUserPassword`
- **AND** 请求变量类型保持为 `UpdateUserPasswordInput`

#### Scenario: GraphQL endpoint
- **WHEN** 登录应用发起 GraphQL 请求
- **THEN** 默认使用 BFF basic GraphQL endpoint `/action/basic/graphql`

### Requirement: Web 登录入口必须可配置
Web 主站 SHALL 使用 `VUE_APP_AUTH_BASE_URL` 配置独立登录应用入口。

#### Scenario: 默认认证入口
- **WHEN** 未显式配置认证入口
- **THEN** `VUE_APP_AUTH_BASE_URL` 的默认值必须为 `/auth`

#### Scenario: 本地测试覆盖认证入口
- **WHEN** 本地测试需要使用独立登录 dev server 或代理路径
- **THEN** Web 主站必须允许通过 `VUE_APP_AUTH_BASE_URL` 覆盖登录应用入口

### Requirement: 登录应用开发环境必须指定端口
`pomelo-login` SHALL 在 `.env.development` 中显式声明本地 Vite dev server host 和 port，并由 Vite config 使用。

#### Scenario: 登录应用声明 dev host 和 port
- **WHEN** 配置 `pomelo-login` 开发环境
- **THEN** `.env.development` 必须包含 `DEV_HOST` 和 `DEV_PORT`
- **AND** `DEV_PORT` 必须为 `5014`

#### Scenario: 登录应用 Vite 使用 dev host 和 port
- **WHEN** 启动 `pomelo-login` dev server
- **THEN** Vite config 必须使用 `DEV_HOST` 配置 `server.host`
- **AND** 使用 `DEV_PORT` 配置 `server.port`

#### Scenario: Web 本地认证入口使用完整 origin
- **WHEN** Web 主站本地测试跳转到独立登录 dev server
- **THEN** `VUE_APP_AUTH_BASE_URL` 必须配置为 `http://localhost:5014/auth`

### Requirement: 登录应用必须兼容 Web 本地 token
`pomelo-login` MUST 保持与 Web 本地认证 token 存储格式兼容。

#### Scenario: 登录成功写入 token
- **WHEN** `signIn` 返回成功结果
- **THEN** 应用将 token 写入 `access-token`
- **AND** 存储值为包含 `token` 和 `type` 的 JSON 对象

#### Scenario: 记住我
- **WHEN** 用户选择记住我后登录成功
- **THEN** 应用将 `access-token` 写入 localStorage

#### Scenario: 非记住我
- **WHEN** 用户未选择记住我后登录成功
- **THEN** 应用将 `access-token` 写入 sessionStorage

#### Scenario: 登录页清理旧 token
- **WHEN** 用户进入登录页
- **THEN** 应用清理 localStorage 和 sessionStorage 中的旧 `access-token`

#### Scenario: 修改密码页保留 token
- **WHEN** 用户进入修改密码页
- **THEN** 应用不得提前清理 `access-token`
- **AND** GraphQL 请求必须携带当前 Bearer token

### Requirement: 登录应用保持现有密码处理行为
`pomelo-login` MUST 保持现有登录和修改密码的前端密码处理行为。

#### Scenario: 登录密码哈希
- **WHEN** 用户提交登录密码
- **THEN** 应用必须在前端继续对密码执行 SHA-256 后再提交

#### Scenario: 修改密码哈希
- **WHEN** 用户提交旧密码和新密码
- **THEN** 应用必须在前端继续分别对旧密码和新密码执行 SHA-256 后再提交

### Requirement: 登录应用视觉风格对齐 identity-server-management
`pomelo-login` SHALL 参考 `identity-server-management` 的液态玻璃、全局背景色和 primary button 风格。

#### Scenario: 登录页使用液态玻璃面板
- **WHEN** 用户访问登录页
- **THEN** 登录表单必须展示在液态玻璃面板或等价视觉容器中

#### Scenario: 密码页面使用一致视觉层级
- **WHEN** 用户访问修改密码页或忘记密码页
- **THEN** 页面表单必须使用与登录页一致的液态玻璃面板或等价视觉容器

#### Scenario: 登录应用使用统一背景
- **WHEN** 登录应用渲染任意页面背景
- **THEN** 页面必须使用与 `identity-server-management` 一致的全局背景色和主题 token 语义

#### Scenario: 登录应用 primary 按钮风格一致
- **WHEN** 登录应用展示登录、提交或下一步主按钮
- **THEN** 按钮必须使用与 `identity-server-management` 一致的 Ant Design primary button 主题风格
