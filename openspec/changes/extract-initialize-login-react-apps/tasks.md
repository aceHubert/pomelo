## 1. 项目骨架与共享约定

- [x] 1.1 新建 `clients/pomelo-initialize` workspace，包含 React 18、Vite、TypeScript、Apollo Client、Ant Design 5 和 Tailwind 配置
- [x] 1.2 新建 `clients/pomelo-login` workspace，包含 React 18、Vite、TypeScript、Apollo Client、Ant Design 5、React Router 和 Tailwind 配置
- [x] 1.3 参考 `identity-server-management` 复制并调整主题、i18n、全局样式和 Ant Design ConfigProvider 结构
- [x] 1.4 为两个新应用配置 GraphQL URI 解析，生产默认指向 `/action/basic/graphql`，开发环境支持 `.env.development` 覆盖
- [x] 1.5 为两个新应用 `.env.development` 增加 `DEV_HOST`、`DEV_PORT`，并在 Vite config 中配置 `server.host`、`server.port`
- [x] 1.6 为 Web 主站增加 `VUE_APP_AUTH_BASE_URL` 和 `VUE_APP_INITIALIZE_BASE_URL` 入口配置，默认分别为 `/auth` 和 `/initialize`，本地配置为带 origin 的独立 dev server 入口
- [x] 1.7 在根 `package.json` 增加统一 `build:web`，通过 `@ace-pomelo/web-*` 构建主站、初始化应用和登录应用
- [x] 1.8 复用或等价迁移 `identity-server-management` 的 `LiquidGlass`、全局背景色变量、主题 token 和 primary button 配置

## 2. pomelo-initialize 迁移

- [x] 2.1 将现有初始化页面表单字段、校验规则、加载状态、错误状态和成功提示迁移为 React 组件
- [x] 2.2 用 Apollo `gql`/`useQuery` 或等价调用实现 `checkSiteInitialRequired`
- [x] 2.3 用 Apollo `gql`/`useMutation` 实现 `startSiteInitial`
- [x] 2.4 保持管理员密码提交前 SHA-256 处理
- [x] 2.5 移除初始化应用 router 依赖，使用 `URLSearchParams` 读取 `redirect`
- [x] 2.6 配置初始化应用生产构建产物，并确认 `/initialize` 和 `/initialize/*` 可返回该入口
- [x] 2.7 将初始化表单放入液态玻璃面板，并应用统一全局背景与 primary button 样式

## 3. pomelo-login 迁移

- [x] 3.1 将登录页迁移为 React 组件，保留用户名、密码、记住我、忘记密码入口和提交反馈
- [x] 3.2 将修改密码页迁移为 React 组件，保留用户名、旧密码、新密码、取消和提交流程
- [x] 3.3 将忘记密码页迁移为 React 组件，保持当前 TODO 行为，不新增后端契约
- [x] 3.4 使用 React Router history 模式配置固定业务路由 `/login`、`/password/modify`、`/password/forgot`
- [x] 3.5 实现生产 base `/auth`，并让 canonical 地址为 `/auth/login` 与 `/auth/password/*`
- [x] 3.6 配置 `pomelo-login` 生产 Vite base 为 `/auth/`
- [x] 3.7 将登录、修改密码和忘记密码页面统一为液态玻璃表单面板，并应用统一全局背景与 primary button 样式

## 4. 登录 GraphQL 与 token 兼容

- [x] 4.1 用 Apollo `gql`/`useMutation` 实现 `signIn`
- [x] 4.2 用 Apollo `gql`/`useMutation` 实现 `updateUserPassword`
- [x] 4.3 保持登录、旧密码和新密码提交前 SHA-256 处理
- [x] 4.4 实现 `access-token` 兼容存储，值为 `{ token, type }` JSON 对象
- [x] 4.5 实现“记住我”写 localStorage，非“记住我”写 sessionStorage
- [x] 4.6 登录页进入时清理旧 token，修改密码页进入时保留 token 并携带 Bearer header
- [x] 4.7 登录成功后优先跳转 `returnUrl`，没有 `returnUrl` 时跳转首页或配置的 Home 地址

## 5. 从 Web 移除旧入口

- [x] 5.1 从 `clients/web/vue.config.js` 移除 `initialize` 和 `login` pages 配置
- [x] 5.2 移除 Web 构建中针对 `initialize.html`、`login.html` 的 CDN 注入和 pxtorem 排除项
- [x] 5.3 移除 `clients/web` 中旧 `src/initialize` 和 `src/login` 页面代码，保留必要跳转逻辑
- [x] 5.4 调整 Web 初始化检测跳转使用 `VUE_APP_INITIALIZE_BASE_URL`
- [x] 5.5 调整 Web 本地登录、退出和改密跳转使用 `VUE_APP_AUTH_BASE_URL` 拼接固定 `/login`、`/password/*` 路由
- [x] 5.6 保留 OIDC `signin.html`、`signin-silent.html` 和 `signout.html` 构建行为

## 6. 部署与静态入口

- [x] 6.1 调整 Dockerfile，将 `pomelo-initialize` 与 `pomelo-login` 构建产物复制到运行时静态目录
- [x] 6.2 调整 example nginx 配置，使 `/initialize/*` 返回初始化入口
- [x] 6.3 调整 example nginx 配置，使 `/auth/*` 返回 `pomelo-login` 入口
- [x] 6.4 调整 example nginx 配置，使 `/login` 作为 `/auth/login` alias 返回同一入口
- [x] 6.5 确认本次不修改 `identity-server`、`Dockerfile.oidc` 或合工大相关代码配置

## 7. 验证

- [x] 7.1 执行 `yarn workspace @ace-pomelo/web-initialize run build`，确认初始化应用构建成功
- [x] 7.2 执行 `yarn workspace @ace-pomelo/web-login run build`，确认登录应用构建成功且生产 base 为 `/auth/`
- [x] 7.3 执行 `yarn build:web`，确认 Web 不再产出旧 `login.html` 和 `initialize.html`
- [x] 7.4 执行相关 lint/typecheck，确认新增 React 应用和 Web 调整无静态错误
- [x] 7.5 本地 smoke test `/initialize` 初始化入口加载和提交流程
- [x] 7.6 本地 smoke test `/auth/login`、`/auth/password/modify`、`/auth/password/forgot`
- [x] 7.7 本地 smoke test `/login` alias
- [x] 7.8 登录成功后返回 Web 主站，确认 Web 能读取 `access-token` 并识别登录状态
- [x] 7.9 对照 `identity-server-management` 登录页检查液态玻璃、全局背景色和 primary button 视觉一致性
