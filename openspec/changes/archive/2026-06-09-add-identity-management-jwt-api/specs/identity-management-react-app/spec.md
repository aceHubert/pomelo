## ADDED Requirements

### Requirement: 提供独立 React 管理端
The system SHALL provide a standalone React management application under `clients/identity-server-management` for identity-server configuration management.

#### Scenario: React 管理端位于独立目录
- **WHEN** 实现 identity-server management 前端
- **THEN** 前端代码位于 `clients/identity-server-management`，而不是继续扩展 `clients/web`

#### Scenario: 保留现有 web 管理代码
- **WHEN** 实现 React 管理端迁移
- **THEN** 系统不得删除 `clients/web` 中现有 OIDC 管理页面、路由、菜单、GraphQL 封装或相关代码

#### Scenario: React 管理端可独立运行
- **WHEN** identity-server 托管 `management.html`
- **THEN** 用户可以不依赖 `clients/web` 主站访问管理端

### Requirement: 迁移现有 OIDC 管理功能
The React management application MUST preserve the existing Vue OIDC management feature set for Clients, API Resources, and Identity Resources.

#### Scenario: Clients 菜单功能完整
- **WHEN** 用户进入 React 管理端 Clients 区域
- **THEN** 系统提供 client 列表、详情、grant types、scopes、claims、CORS origins、redirect URIs、post logout redirect URIs、secrets 和 properties 管理功能

#### Scenario: API Resources 菜单功能完整
- **WHEN** 用户进入 React 管理端 API Resources 区域
- **THEN** 系统提供 API Resource 列表、详情、claims、scopes、scope claims、secrets 和 properties 管理功能

#### Scenario: Identity Resources 菜单功能完整
- **WHEN** 用户进入 React 管理端 Identity Resources 区域
- **THEN** 系统提供 Identity Resource 列表、详情、claims 和 properties 管理功能

### Requirement: 管理端使用 GraphQL managementLogin 登录
The React management application SHALL authenticate through the GraphQL `managementLogin` mutation and store the returned JWT in localStorage.

#### Scenario: 通过 GraphQL 登录成功保存 JWT
- **WHEN** 超级管理员在 React 管理端登录成功
- **THEN** 系统通过 GraphQL `managementLogin` 获取 Bearer JWT 并保存到 localStorage

#### Scenario: 非超级管理员不能进入管理端
- **WHEN** 非超级管理员尝试登录 React 管理端
- **THEN** 系统显示登录失败状态且不保存 JWT

#### Scenario: 认证失效跳转登录页
- **WHEN** GraphQL 或 OpenAPI 请求返回未认证或无权限响应
- **THEN** React 管理端清理本地 token 并跳转到独立登录页

### Requirement: GraphQL 使用 Apollo React Hooks
The React management application MUST use Apollo Client React official hooks for GraphQL access.

#### Scenario: 列表数据通过 useQuery 加载
- **WHEN** 页面加载 Clients、API Resources 或 Identity Resources 列表
- **THEN** 页面通过 Apollo `useQuery` 执行对应 GraphQL query

#### Scenario: 写操作通过 useMutation 执行
- **WHEN** 用户创建、更新或删除管理资源
- **THEN** 页面通过 Apollo `useMutation` 执行对应 GraphQL mutation

#### Scenario: 请求注入 Bearer JWT
- **WHEN** React 管理端执行 GraphQL 请求
- **THEN** Apollo link 从 localStorage 读取 JWT 并注入 `Authorization: Bearer <token>`

### Requirement: 构建单文件 management.html
The React management application SHALL build to a single static `management.html` file that identity-server can serve independently.

#### Scenario: 构建生成单文件
- **WHEN** 执行 React 管理端生产构建
- **THEN** 构建结果包含单个内联 JS/CSS 的 `management.html`

#### Scenario: management.html 输出到 identity-server
- **WHEN** 执行 identity-server 或管理端构建流程
- **THEN** `management.html` 被放置到 identity-server 可托管的静态目录或 dist 输出中

#### Scenario: 页面刷新不依赖多文件资源
- **WHEN** 用户直接打开或刷新 `management.html`
- **THEN** 页面不依赖额外 chunk 文件即可加载应用
