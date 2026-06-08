## 1. JWT 签发配置

- [x] 1.1 在 identity-server 的 `AuthorizationModule` 配置中传入 `signingKey`，来源保持为 `JWT_PRIVATE_KEY`
- [x] 1.2 在 identity-server 配置中加入管理 JWT 过期时间，默认读取 `MANAGEMENT_JWT_EXPIRES_IN`
- [x] 1.3 确认未配置 `JWT_PRIVATE_KEY` 时继续使用包内现有默认私钥 warning 机制，不修改 `AuthorizationService`

## 2. 管理登录能力

- [x] 2.1 在 `servers/identity-server/src/apis/auth` 新增 management auth 输入模型和 token 响应模型，供 GraphQL 与 OpenAPI 共用
- [x] 2.2 在 `servers/identity-server/src/apis/auth` 新增 management auth 服务，复用 `AccountProviderService.verifyAccount()` 校验账号密码
- [x] 2.3 在 management auth 服务中读取用户 meta，并校验 `super_administrator = 1` 与 `capabilities = administrator`
- [x] 2.4 在 management auth 服务中使用 `AuthorizationService.createToken()` 签发 Bearer JWT
- [x] 2.5 在 management JWT payload 中加入 `role: administrator`、`super_administrator: true` 和允许 `identity:*` 的 `ram` 策略
- [x] 2.6 在 `servers/identity-server/src/apis/auth` 新增匿名 GraphQL mutation `managementLogin`
- [x] 2.7 在 `servers/identity-server/src/apis/auth` 新增匿名 OpenAPI 接口 `POST /v0/management/auth/login`
- [x] 2.8 为登录失败返回统一认证失败响应，避免暴露账号存在性或角色细节

## 3. Clients OpenAPI 管理接口

- [x] 3.1 新增 Clients REST controller，所有 API 路径以 `/v0/management` 为前缀，并使用 Bearer JWT、`@Authorized()` 与对应 `ClientAction`
- [x] 3.2 实现 client 列表、详情、创建和更新接口
- [x] 3.3 实现 client claims 的查询、创建和删除接口
- [x] 3.4 实现 client CORS origins 的查询、创建和删除接口
- [x] 3.5 实现 client grant types 的查询、创建和删除接口
- [x] 3.6 实现 client scopes 的查询、创建和删除接口
- [x] 3.7 实现 client redirect URIs 与 post logout redirect URIs 的查询、创建和删除接口
- [x] 3.8 实现 client secrets 的查询、创建和删除接口，并保持 secret 原文只在创建响应中返回
- [x] 3.9 实现 client properties 的查询、创建和删除接口

## 4. API Resources OpenAPI 管理接口

- [x] 4.1 新增 API Resources REST controller，所有 API 路径以 `/v0/management` 为前缀，并使用 Bearer JWT、`@Authorized()` 与对应 `ApiResourceAction`
- [x] 4.2 实现 API Resource 列表、详情、创建、更新和删除接口
- [x] 4.3 实现 API Resource claims 的查询、创建和删除接口
- [x] 4.4 实现 API scopes 的列表、详情、创建、更新和删除接口
- [x] 4.5 实现 API scope claims 的查询、创建和删除接口
- [x] 4.6 实现 API Resource secrets 的查询、创建和删除接口，并保持 secret 原文只在创建响应中返回
- [x] 4.7 实现 API Resource properties 的查询、创建和删除接口

## 5. Identity Resources OpenAPI 管理接口

- [x] 5.1 新增 Identity Resources REST controller，所有 API 路径以 `/v0/management` 为前缀，并使用 Bearer JWT、`@Authorized()` 与对应 `IdentityResourceAction`
- [x] 5.2 实现 Identity Resource 列表、详情、创建、更新和删除接口
- [x] 5.3 实现 Identity Resource claims 的查询、创建和删除接口
- [x] 5.4 实现 Identity Resource properties 的查询、创建和删除接口

## 6. React 管理端迁移

- [x] 6.1 新建 `clients/identity-server-management` React + TypeScript 应用，并接入 workspace/package 构建脚本
- [x] 6.2 确认迁移过程中不删除 `clients/web` 中现有 OIDC 管理页面、路由、菜单、GraphQL 封装或相关代码
- [x] 6.3 配置 Vite 单文件构建，生产产物输出为 `management.html`
- [x] 6.4 接入 identity-server 静态资源或构建流程，使 `management.html` 可由 identity-server 独立托管
- [x] 6.5 实现独立登录页，调用 GraphQL `managementLogin` 获取 JWT
- [x] 6.6 实现 localStorage token 管理、Apollo Client 初始化和 Bearer header 注入
- [x] 6.7 实现认证失败处理，401/403 时清理 token 并跳转登录页
- [x] 6.8 迁移 Clients 路由、菜单和页面，覆盖列表、详情、grant types、scopes、claims、CORS origins、redirect URIs、post logout redirect URIs、secrets、properties
- [x] 6.9 迁移 API Resources 路由、菜单和页面，覆盖列表、详情、claims、scopes、scope claims、secrets、properties
- [x] 6.10 迁移 Identity Resources 路由、菜单和页面，覆盖列表、详情、claims、properties
- [x] 6.11 将现有 GraphQL 文档迁移为 Apollo React `useQuery`/`useMutation` hooks
- [x] 6.12 确认 React 管理端不引入 `@ace-fetch/graphql-vue` 或 Vue 运行时依赖

## 7. OpenAPI 文档与验证

- [x] 7.1 为新增 REST controller 和 management auth controller 补充 Swagger 标签、请求体和响应模型
- [x] 7.2 确认受保护管理接口声明 Bearer 授权，management login 不要求 Bearer 授权
- [x] 7.3 确认 Swagger/OpenAPI 文档中的新增管理 REST 路径全部以 `/v0/management` 开头
- [x] 7.4 增加 management login 单元或 e2e 测试，覆盖超级管理员成功、非超级管理员失败、密码错误失败
- [x] 7.5 增加 GraphQL management login 测试，确认返回结构与 OpenAPI 登录一致
- [x] 7.6 增加 REST 管理接口代表性授权测试，覆盖有效管理 JWT、缺少 JWT、缺少 RAM 策略三类场景
- [x] 7.7 回归现有 OIDC 登录和 token 签发流程，确认新增管理登录不改变 OIDC 行为
- [x] 7.8 增加 React 管理端构建验证，确认 build 能正确生成 `management.html` 文件
- [x] 7.9 使用 `.env.development.local` 启动 identity-server 本地端口并连接测试数据，使用 web dev 启动测试页面 smoke test，覆盖登录、Clients 列表、API Resources 列表、Identity Resources 列表
