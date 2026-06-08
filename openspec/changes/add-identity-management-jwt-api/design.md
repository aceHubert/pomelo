## Context

identity-server 当前已经提供 OIDC provider、GraphQL 管理 resolver、JWT Bearer 验证中间件和 RAM action 授权。现有 web 管理端通过 OIDC 获取 token，再调用 identity GraphQL；独立 management 页面只面向本站超级管理员，不需要完整 OIDC 授权码、回跳、consent 流程。

当前 OIDC signing key 由 `JWT_PRIVATE_KEY` 经 `getJWKS()` 转为 provider `jwks`。`AuthorizationModule` 当前主要配置验证能力；若要由本站登录签发管理 JWT，需要在 identity-server 配置层传入 `signingKey` 与管理 token 过期时间。公共 `AuthorizationService` 保持原逻辑，不为了 management 场景修改包级行为。

## Goals / Non-Goals

**Goals:**

- 为 identity-server 增加 GraphQL 和 OpenAPI 都可用的管理登录入口，代码目录固定为 `servers/identity-server/src/apis/auth`。
- 管理登录只允许超级管理员，登录成功后签发本站 JWT。
- 本站 JWT 使用现有 Bearer middleware、`@Authorized()`、`@RamAuthorized()` 链路。
- 本站 JWT 携带完整 RAM allow 策略，使现有 Clients、API Resources、Identity Resources 管理 action 可用。
- 为现有 resolver-only 管理能力补充 REST/OpenAPI controller，所有 REST API 路径统一以 `/v0/management` 为前缀，行为与 GraphQL 管理能力保持一致。
- 新增 `clients/identity-server-management` React 应用，等价迁移现有 Vue TSX 管理页面，并构建为 identity-server 可独立托管的单文件 `management.html`。
- 保留现有 OIDC 流程和 token 签发逻辑，不改变 OIDC client 行为。

**Non-Goals:**

- 不移除或重构现有 Vue 管理端。
- 不删除 `clients/web` 中现有 OIDC 管理页面、路由、菜单、GraphQL 封装或相关代码；React 管理端是新增独立实现。
- 不改变 `AuthorizationService`、`RamAuthorizationModule` 等公共包的默认行为。
- 不引入 cookie session；管理 JWT 由前端保存在 localStorage 并通过 Bearer header 使用。
- 不新增数据库表；超级管理员判断复用现有 usermeta。
- 不要求 React 管理端复用现有 Vue 组件库或 `@ace-fetch/graphql-vue` 封装。

## Decisions

1. **管理登录同时提供 GraphQL 和 OpenAPI**

   选择在 `servers/identity-server/src/apis/auth` 下新增 `managementLogin` GraphQL mutation 与 `POST /v0/management/auth/login` REST 接口。两者共享同一登录服务，避免认证规则分叉。登录入口使用 `@Anonymous()`，由业务逻辑自行校验账号密码和超级管理员资格。

   备选方案是只提供 REST 登录，再让前端用 REST 换取 token。该方案无法满足“management/auth/login 也支持 OpenAPI/GraphQL”的要求。

2. **JWT 签发配置放在 identity-server 配置层**

   `AuthorizationModule` 增加 `signingKey: privateKey` 和 `jwtExpiresIn: MANAGEMENT_JWT_EXPIRES_IN`。如果 `JWT_PRIVATE_KEY` 未配置，继续依赖包内现有默认私钥 warning 机制，不额外修改公共包或重复 warning。

   备选方案是修改 `AuthorizationService` 让缺省 signingKey 时也可签发；该方案会扩大公共包行为变化，因此不采用。

3. **本站登录 JWT 携带完整 RAM 策略**

   管理 JWT payload 必须包含 `role: administrator` 与 `ram` claim。RAM 策略使用服务名 `identity` 下的全量 allow，例如 action `identity:*`、resource `*`，让现有 `@RamAuthorized()` action 级校验自然通过。

   备选方案是仅依赖 `role: administrator`。这只能满足 `@Authorized()` 的角色层校验，无法满足 RAM 默认 `allowWhenNoPolicies: false` 的 action 级校验。

4. **Controller 复用现有 DataSource 与 action 常量**

   REST/OpenAPI controller 直接调用 `ClientDataSource`、`ApiResourceDataSource`、`IdentityResourceDataSource`，并使用现有 `ClientAction`、`ApiResourceAction`、`IdentityResourceAction`。这样 GraphQL 和 REST 共享同一业务约束、默认值、密钥生成和数据校验。

   备选方案是让 REST controller 调用 resolver 方法。resolver 方法依赖 GraphQL 字段选择树，不适合直接复用。

5. **REST API 统一使用 `/v0/management` 前缀**

   新增管理 REST controller 的所有 API 路径必须定义在 `/v0/management` 下，例如 `POST /v0/management/auth/login`、`GET /v0/management/clients`、`GET /v0/management/api-resources`、`GET /v0/management/identity-resources`。该前缀只用于 REST/OpenAPI；GraphQL 继续使用现有 GraphQL endpoint 和 operation 名称。

   备选方案是沿用 `/management` 或各资源裸路径。该方案会让管理 API 边界不够清晰，也不满足版本化前缀要求。

6. **OpenAPI 授权声明使用 Bearer**

   Swagger 全局已配置 `.addBearerAuth()`，新增 controller 方法需要标注 `@ApiBearerAuth()` 或项目封装的 Bearer 装饰器。登录接口不要求 Bearer；受保护管理接口要求 Bearer。

7. **React 管理端独立于现有 Vue web**

   在 `clients/identity-server-management` 下新增 React + TypeScript 管理端，不直接复用 `clients/web` 的 Vue TSX 页面。页面能力按现有 `clients/web/src/admin/router/routes/oidc.ts`、`clients/web/src/admin/configs/menu.config.ts`、`clients/web/src/admin/fetch/*.ts` 等行为迁移，确保 Clients、API Resources、Identity Resources 和子资源管理功能不丢失。

   备选方案是在 `clients/web` 内新增页面。该方案会继续耦合 Vue 2、OIDC web 管理端和主站构建，不满足 identity-server 独立运行目标。

8. **React 端 GraphQL 使用 Apollo 官方 Hooks**

   React 管理端使用 `@apollo/client` 的 `useQuery`、`useMutation` 管理 GraphQL 数据请求，不使用 `@ace-fetch/graphql-vue`。独立登录页通过 GraphQL `managementLogin` 获取 management JWT；Apollo link 从 localStorage 读取 management JWT，并注入 `Authorization: Bearer <token>`；401/403 时跳转独立登录页。

   备选方案是使用 REST/OpenAPI 驱动登录和全部页面。REST 作为 OpenAPI 对等能力保留，但 React 管理端固定通过 GraphQL `managementLogin` 获取 JWT，并优先保持现有 GraphQL 管理行为等价。

9. **构建为单文件 `management.html`**

   React 管理端使用 Vite 单文件构建模式，参考 `Cli-Proxy-API-Management-Center` 的 `vite-plugin-singlefile` 思路，将 JS/CSS 内联到单个 HTML。构建产物命名为 `management.html`，并复制到 identity-server 静态目录或 dist 输出，使 identity-server 可独立托管该管理页。

   备选方案是常规多文件 SPA 构建。该方案会增加静态资源路径、缓存和部署耦合，不符合单文件管理页目标。

## Risks / Trade-offs

- [Risk] localStorage token 存在 XSS 泄露风险 → 管理端 UI 后续必须避免动态 HTML 注入，并限制 token 生命周期。
- [Risk] RAM action 通配符与实际 action 命名不匹配会导致 403 → 以 `identity:*` 作为策略，并在测试中覆盖 Clients、API Resources、Identity Resources 的代表性操作。
- [Risk] REST/OpenAPI 与 GraphQL 行为漂移 → REST controller 复用现有 datasource 和 action 常量，避免复制业务规则。
- [Risk] 默认私钥被误用于生产 → 保留包内 warning，部署文档和环境示例应强调生产必须配置 `JWT_PRIVATE_KEY`。
- [Risk] 登录接口匿名暴露会增加暴力破解面 → 登录接口必须只返回泛化错误，并可在后续加入限流或审计。
- [Risk] Vue 到 React 等价迁移遗漏子页面或隐藏路由 → 以现有 OIDC 路由和菜单清单作为迁移 checklist，并为核心页面补 smoke test。
- [Risk] 单文件构建引入过大 HTML → 优先只迁移 identity 管理必需依赖，避免把现有主站编辑器、Formily、CKEditor 等无关依赖带入管理端。
- [Risk] localStorage JWT 与页面 XSS 风险 → React 页面避免 `dangerouslySetInnerHTML`，表格和错误提示默认转义，token 过期时间保持短周期。

## Migration Plan

1. 在 identity-server 配置层为 `AuthorizationModule` 补充 `signingKey` 与管理 JWT 过期时间。
2. 在 `servers/identity-server/src/apis/auth` 新增 management auth 服务、GraphQL resolver、REST controller 和登录 DTO/模型。
3. 新增 Clients、API Resources、Identity Resources REST controller，并统一挂载到 `/v0/management` 路径前缀。
4. 新增 `clients/identity-server-management` React 应用，迁移登录页、路由、菜单和管理页面。
5. 配置 React 管理端单文件构建，并将 `management.html` 纳入 identity-server 静态托管/构建输出。
6. 为新增接口和 React 管理端补 Swagger 标注、测试与构建验证。
7. 验证 OIDC 原流程、GraphQL 管理接口、REST 管理接口和 `management.html` 均可用。

回滚时删除新增 management auth、REST controller、`clients/identity-server-management` 与 `management.html` 构建接入，并移除 `AuthorizationModule` 的 `signingKey`/管理过期时间配置即可；现有 OIDC 和 GraphQL resolver 不需要迁移数据。
