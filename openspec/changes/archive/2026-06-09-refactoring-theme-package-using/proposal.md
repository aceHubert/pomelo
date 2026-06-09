## Why

当前 `pomelo-theme` 同时承担主题 token、全局 reset、颜色工具类、Less mixin 和服务端页面样式依赖，导致主题包职责过宽，Web 端和 `identity-server` 之间也存在不必要的构建耦合。

这次变更将主题能力按运行场景拆开：Web 端暂时保留 `pomelo-theme` 的 token 能力并引入 Tailwind 承接非 token 样式迁移，`identity-server` 则移除 `pomelo-theme` 依赖，使用 Bootstrap 和本地黑白主题样式。

## What Changes

- Web 端引入 Tailwind 作为新增样式和可迁移样式的主要承载方式。
- Web 端暂时保留 `pomelo-theme` 中的主题 token 能力，用于兼容现有 Less 变量、CSS 变量、Ant Design Vue 和 Vant 样式链路。
- Web 端逐步停止依赖 `pomelo-theme` 的 reset、mixin 和通用颜色工具类；迁移后的样式优先使用 Tailwind 或 Web 本地样式层。
- `identity-server` 移除对 `@ace-pomelo/theme` 的 Less import 和启动前主题包构建依赖。
- `identity-server` 保留 Bootstrap，继续使用 Bootstrap 的栅格、表单、按钮、Toast 和 Popover 能力。
- `identity-server` 在当前服务内维护本地白色/黑色主题 token、语义工具类和 Bootstrap 主题覆盖。
- 保留现有动态主色能力，继续通过 CSS 变量注入 `--theme-primary` 与 `--theme-primary-*` 系列变量。
- 不在本次变更中删除 `packages/pomelo-theme` workspace 包；该包仍服务于 Web token 兼容链路。

## Capabilities

### New Capabilities

- `web-theme-token-tailwind`: 约束 Web 端保留 `pomelo-theme` token 能力，同时使用 Tailwind 替换非 token 样式职责。
- `identity-server-local-theme`: 约束 `identity-server` 从 `pomelo-theme` 解耦，使用 Bootstrap 和本地黑白主题样式运行。

### Modified Capabilities

- 无。

## Impact

- 影响 Web 构建链路：`clients/web/vue.config.js`、Web 样式入口、Tailwind/PostCSS 配置、`clients/web/package.json`。
- 影响 Web 样式代码：新增样式优先 Tailwind，旧 Less 中的 mixin/reset/工具类依赖需要分批迁移。
- 影响 `identity-server` 构建链路：根 `package.json` 中 `start:identity-server` 不再需要预构建 `@ace-pomelo/theme`。
- 影响 `identity-server` 样式：`servers/identity-server/public/style/*.less` 需要本地化主题 token 和语义类。
- 影响 `identity-server` 页面行为边界：继续保留 Bootstrap CDN 与 `bootstrap.Toast`、`bootstrap.Popover` 的运行时依赖。
- 不改变登录、密码、授权确认、退出确认、错误页等现有业务流程和接口协议。
