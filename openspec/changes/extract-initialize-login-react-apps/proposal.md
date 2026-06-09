## Why

当前 `initialize` 和 `login` 仍作为 `clients/web` 的 Vue 多页面入口存在，依赖 Web 主应用的全局 Vue、router、fetch、store 和构建配置。它们属于认证与站点初始化边界，继续放在 Web 主站内会让认证入口、初始化入口和业务前台构建互相耦合。

`identity-server-management` 已经建立了独立 React + GraphQL + Tailwind 的前端架构范式。本次变更将 `initialize` 与 `login` 从 `clients/web` 中拆出为独立项目，统一独立构建、独立托管和独立演进，同时保留现有访问兼容性。

## What Changes

- 新增 `clients/pomelo-initialize` React 应用，迁移现有站点初始化页面。
- `pomelo-initialize` 只有一个页面，不引入 router 能力，通过 URL query 读取 `redirect`。
- 新增 `clients/pomelo-login` React 应用，迁移现有本地登录、忘记密码和修改密码页面。
- `pomelo-login` 使用 router 能力承载登录和密码相关页面。
- Web 主站通过 `VUE_APP_AUTH_BASE_URL=/auth` 跳转登录应用，通过 `VUE_APP_INITIALIZE_BASE_URL=/initialize` 跳转初始化应用。
- `pomelo-login` 生产环境 canonical base URL 使用 `/auth`，登录应用内固定路由为 `/login` 和 `/password/*`。
- `pomelo-login` 增加 `/login` alias，兼容旧登录入口。
- 两个新应用的 React 架构、GraphQL/Apollo、Tailwind 配置、主题与构建方式按 `identity-server-management` 的模式保持一致。
- 两个新应用的视觉风格参考 `identity-server-management`，包含液态玻璃面板、全局背景色、主题 token 和 primary button 等关键样式。
- 从 `clients/web` 移除 `initialize` 和 `login` 的页面入口、路由和多页面构建配置，但保留 Web 运行时对初始化、登录和改密入口的跳转能力。
- 不修改合工大相关代码或配置。

## Capabilities

### New Capabilities

- `pomelo-initialize-react-app`: 定义独立 React 初始化应用的页面、GraphQL、构建和托管行为。
- `pomelo-login-react-app`: 定义独立 React 登录应用的路由、GraphQL、token 兼容、`VUE_APP_AUTH_BASE_URL`、`/auth` base、固定 `/login`/`/password/*` 路由和 `/login` alias 行为。

### Modified Capabilities

- `deploy-runtime-image`: 主镜像 nginx/静态入口需要托管新的初始化与登录产物，并将 `/auth/*` 作为登录主入口，同时保留 `/login/*` alias。
- `web-runtime-oidc-options`: Web 主应用不再内置本地登录页与初始化页，Local/OIDC 运行时模式仍需跳转到正确的独立入口。

## Impact

- 影响前端目录：`clients/web`、`clients/pomelo-initialize`、`clients/pomelo-login`、`clients/identity-server-management` 参考结构。
- 影响构建脚本：根 `package.json` workspace 脚本、各新应用 `package.json`、Vite 构建配置。
- 影响部署产物：`Dockerfile`、example nginx 配置和主镜像静态入口；本次不修改 `identity-server` 或 `Dockerfile.oidc`。
- 影响运行时跳转：Web 初始化检查、未登录跳转、本地登录退出、修改密码入口。
- 影响 GraphQL 客户端：初始化和登录应用需要使用 Apollo Client 访问现有 BFF GraphQL endpoint。
