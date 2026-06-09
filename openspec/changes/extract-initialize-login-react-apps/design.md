## Context

`clients/web` 当前通过 Vue CLI 多页面配置同时构建主站、管理页、初始化页、登录页和 OIDC 回调页。`initialize` 与 `login` 目录虽然业务边界独立，但仍依赖 Web 主站的 Vue 2、Vue Router、Pinia、`@ace-fetch/graphql-vue`、全局 i18n、全局主题和 webpack 多页面配置。

`clients/identity-server-management` 已经提供了独立 React 应用范式：Vite 构建、React 18、Ant Design 5、Apollo Client、Tailwind base config、局部 i18n/theme service，以及单独 workspace/package 脚本。本次拆分沿用这套范式，避免为认证入口再维护一套特殊架构。

本次变更还会调整登录生产路径：Web 主站通过 `VUE_APP_AUTH_BASE_URL=/auth` 跳转登录应用，通过 `VUE_APP_INITIALIZE_BASE_URL=/initialize` 跳转初始化应用。新的 `pomelo-login` 以 `/auth` 作为生产 canonical base URL，应用内固定路由为 `/login` 和 `/password/*`，同时保留 `/login` 作为旧入口 alias。

## Goals / Non-Goals

**Goals:**

- 将初始化页迁移为 `clients/pomelo-initialize` 独立 React 应用。
- 将本地登录、忘记密码、修改密码迁移为 `clients/pomelo-login` 独立 React 应用。
- `pomelo-initialize` 不引入 router，仅保留一个页面。
- `pomelo-login` 引入 router，支持登录和密码相关页面。
- Web 主站登录入口通过 `VUE_APP_AUTH_BASE_URL` 配置，默认 `/auth`。
- Web 主站初始化入口通过 `VUE_APP_INITIALIZE_BASE_URL` 配置，默认 `/initialize`。
- `pomelo-login` 生产 canonical base URL 固定为 `/auth`，应用内固定路由为 `/login` 和 `/password/*`，并兼容 `/login` alias。
- 新应用使用 Apollo Client 访问现有 BFF GraphQL endpoint。
- 登录 token 存储格式保持与 `clients/web/src/auth/local/helper.ts` 兼容。
- 新应用视觉风格对齐 `identity-server-management` 的液态玻璃、全局背景色和 primary button 样式。
- 从 `clients/web` 移除初始化和本地登录页面入口，降低 Web 主站构建耦合。

**Non-Goals:**

- 不重写后端 GraphQL resolver 或改变现有 mutation/query 名称。
- 不实现忘记密码 TODO 的后端能力，只做等价迁移。
- 不改变 OIDC 登录、signin、signin-silent、signout 回调页的职责。
- 不修改 `identity-server` 服务、identity-server 镜像或 `Dockerfile.oidc`。
- 不修改合工大相关代码或配置。

## Decisions

1. **新应用使用独立 workspace，而不是继续放在 `clients/web/src`**

   `pomelo-initialize` 与 `pomelo-login` 都放在 `clients/` 下，作为 Yarn workspace 自动纳入 monorepo。这样可以使用独立 `package.json`、Vite 配置和构建脚本，避免继续依赖 Vue CLI 多页面构建。

   备选方案是在 `clients/web` 下保留 React 子入口。该方案会让 Vue CLI、React、Apollo 与旧 Web 插件继续混在同一构建图里，无法真正移除耦合。

2. **前端架构对齐 `identity-server-management`**

   两个新应用使用 React 18、Vite、Ant Design 5、Apollo Client、GraphQL `gql` 文档、Tailwind base config、局部 i18n/theme service。公共模式可从 `identity-server-management` 拆出轻量复制，但不引入 Vue 运行时、`@ace-fetch/graphql-vue` 或 Web 全局 store。

   备选方案是继续迁移到 Vue 2 或 Vue 3。该方案不能满足“React 架构按 `identity-server-management` 一致”的约束。

3. **视觉风格对齐 `identity-server-management`**

   两个新应用复用或等价迁移 `identity-server-management` 的 `LiquidGlass` 视觉组件、`styles/global.less`、`styles/variables.less` 中的背景与主题 token，以及 Ant Design primary button 的主题配置。登录页、修改密码页、忘记密码页和初始化页的主要表单容器都应使用液态玻璃面板或同等视觉层级，页面背景使用相同的全局背景色体系，primary button 使用同一 `colorPrimary`、圆角和 hover/active 语义。

   备选方案是只复用 Ant Design 默认样式。该方案会让认证入口与 `identity-server-management` 的品牌体验割裂，也不满足“样式参考液态玻璃及全局背景色 + primary button”的要求。

4. **`pomelo-initialize` 不使用 router**

   初始化只有一个页面。`redirect` 通过 `window.location.search` 和 `URLSearchParams` 读取，初始化检查失败、无需初始化、初始化成功的跳转都在页面组件内完成。

   备选方案是引入 React Router 只为了 query 读取和单页承载。该方案增加依赖和心智负担，没有实际收益。

5. **Web 跳转入口使用显式环境变量**

   Web 主站不再通过 `process.env.BASE_URL + 'login'` 或 `process.env.BASE_URL + 'initialize'` 推导认证/初始化入口，而是通过固定环境变量读取入口：`VUE_APP_AUTH_BASE_URL` 默认 `/auth`，`VUE_APP_INITIALIZE_BASE_URL` 默认 `/initialize`。本地测试如需使用不同端口或 dev server，可通过这两个变量覆盖。

   迁移出去的 Vite 项目需要在 `.env.development` 中显式声明 `DEV_HOST` 和 `DEV_PORT`，Vite config 读取这些值配置 `server.host` 和 `server.port`。Web 主站开发环境需要在 `VUE_APP_AUTH_BASE_URL` 和 `VUE_APP_INITIALIZE_BASE_URL` 中直接配置带 origin 的完整入口，例如 `http://localhost:5014/auth` 与 `http://localhost:5013/initialize`，避免跨 dev server 跳转时依赖浏览器当前 origin。

   备选方案是继续依赖 `BASE_URL`。该方案无法表达“Web 主站 base”和“认证应用 base”是两个独立入口，也会让本地测试继续受旧单体多页面结构约束。

6. **`pomelo-login` 使用 Browser Router，并使用固定业务路由**

   `pomelo-login` 需要 `/login`、`/password/modify`、`/password/forgot` 等页面流，使用 React Router 的 history 路由模式（`BrowserRouter`），不使用 hash 路由。生产主入口为 `/auth`，因此 canonical 路径为 `/auth/login`、`/auth/password/modify` 和 `/auth/password/forgot`。`/login` 作为旧入口 alias 继续可访问登录页，但应用内部不把 `/login` 当作动态 basename。

   这样登录页和密码页都有固定业务地址：`/login` 与 `/password/*`。Web 主站生成新跳转时应使用 `VUE_APP_AUTH_BASE_URL` 加固定业务路由，例如 `/auth/login` 和 `/auth/password/modify`。

   备选方案是沿用旧的根路由 `/` 作为登录页。该方案会让 `/auth` 同时承担应用 base 和业务页语义，不符合固定 `/login` 地址的要求。

7. **生产 Vite base 使用 `/auth/`**

   `pomelo-login` 的生产构建 `base` 设置为 `/auth/`。如果产物继续采用单文件 HTML，base 对 chunk 影响较小，但它仍会影响 `import.meta.env.BASE_URL` 和未来可能新增的静态资源引用。开发环境可以使用 `/` 或显式 dev base，避免本地调试被生产路径绑定。

8. **GraphQL endpoint 按旧登录/初始化链路使用 BFF basic GraphQL**

   旧 `initialize` 和 `login` 默认走 `basicGraphqlBase`，生产路径是 `/action/basic/graphql`，开发路径常用 `http://localhost:5002/graphql`。新应用应提供 `VITE_GRAPHQL_URI` 或 `VITE_BASIC_GRAPHQL_URI`，默认值保持 `/action/basic/graphql`，不要误用 `identity-server-management` 的 identity-server `/graphql` 默认值。

9. **登录 token 存储保持旧 Web 兼容**

   登录成功后继续写入 `access-token`，值为 JSON 对象 `{ token, type }`。勾选“记住我”写 localStorage，否则写 sessionStorage。登录页挂载时清除旧 token；修改密码页不能在进入时清除 token，因为它需要当前 token 获取用户和授权调用 `updateUserPassword`。

10. **Web 主站只保留跳转，不再保留页面实现**

   `clients/web` 需要移除 `src/initialize`、`src/login` 入口及 Vue CLI pages/chunks/CDN 注入配置，但 Web 中触发初始化、登录、退出、改密的逻辑仍要跳转到新入口。生产环境登录入口读取 `VUE_APP_AUTH_BASE_URL` 并拼接固定业务路由，初始化入口读取 `VUE_APP_INITIALIZE_BASE_URL`。

## Risks / Trade-offs

- **路径切换导致旧链接失效** → nginx/静态托管同时支持 `/auth/*` 和 `/login`，新跳转统一使用 `VUE_APP_AUTH_BASE_URL` 与固定业务路由。
- **本地多 Vite dev server origin 不一致** → Web 主站开发环境必须在 `VUE_APP_AUTH_BASE_URL`、`VUE_APP_INITIALIZE_BASE_URL` 中直接配置带 origin 的完整入口。
- **GraphQL endpoint 误配到 identity-server** → 新应用默认 GraphQL URI 明确为 `/action/basic/graphql`，开发环境通过 `.env.development` 覆盖。
- **token 格式不兼容导致登录后 Web 仍未登录** → 单独封装 local auth token service，并按旧 `access-token` JSON 格式写入 localStorage/sessionStorage。
- **视觉组件复制后与管理端风格漂移** → 优先复用同名 token、变量和 `LiquidGlass` 组件结构，验证时对照 `identity-server-management` 登录页视觉。
- **Web 构建配置残留导致重复入口** → 任务中明确移除 Vue CLI `initialize`、`login` pages、别名和 CDN 注入列表。
- **忘记密码页面迁移后被误认为已实现** → 页面保持当前 TODO 行为，不新增后端契约。

## Migration Plan

1. 新增 `pomelo-initialize` 和 `pomelo-login` workspace，先保证本地 build 通过。
2. 迁移 GraphQL 文档、token 存储、i18n/theme、页面和样式。
3. 调整 Web 跳转逻辑读取 `VUE_APP_AUTH_BASE_URL=/auth` 和 `VUE_APP_INITIALIZE_BASE_URL=/initialize`，保留 `/login` alias。
4. 从 Web 多页面配置移除旧 `initialize` 和 `login`。
5. 调整 Dockerfile/example nginx，将新产物复制并托管到 `/initialize`、`/auth` 和 `/login` alias，不修改 `identity-server` 或 `Dockerfile.oidc`。
6. 执行新应用 build、Web build、必要的 smoke test。

回滚时恢复 Web 旧 `initialize` 和 `login` 多页面入口，移除新应用构建脚本和静态托管规则，并将 Web 跳转恢复到 `/login` 与 `/initialize` 旧入口。

## Open Questions

- `pomelo-initialize` 生产访问路径是否继续固定为 `/initialize`，当前设计按保持旧路径处理。
- `/login` alias 最终采用静态 rewrite 还是 302 到 `/auth/login`，当前设计优先采用 rewrite 以保留旧入口可用。
