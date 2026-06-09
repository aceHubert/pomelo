## Context

当前仓库中 `pomelo-theme` 是一个 workspace 包，Web 端、`antdv-layout-pro` 和 `identity-server` 都间接或直接依赖它。它同时提供 Less 主题变量、CSS 变量、reset、mixin、颜色工具类和主题产物构建，职责已经超过“主题 token provider”。

Web 端是 Vue 2 + Vue CLI/Webpack + Less 的历史结构，Ant Design Vue 1.x、Vant、`antdv-layout-pro` 和大量 `.module.less` 仍依赖 `@var-*`、`@text-color`、`@component-background` 等 Less 变量。这里不能一次性移除 `pomelo-theme`，否则会影响组件库变量覆盖和现有页面样式。

`identity-server` 是 NestJS + EJS + 静态资源页面，页面结构主要依赖 Bootstrap 5 的栅格、表单、按钮、校验反馈、Toast 和 Popover。它不需要 Web 端完整主题包，只需要本地黑白主题 token、主色 CSS 变量和少量语义工具类。

## Goals / Non-Goals

**Goals:**

- 将 `pomelo-theme` 在 Web 端的职责收窄为主题 token 兼容层。
- Web 端引入 Tailwind，承接新增样式和逐步迁移的非 token 样式。
- `identity-server` 从 `@ace-pomelo/theme` Less import 和预构建流程中解耦。
- `identity-server` 使用 Bootstrap + 本地样式维护白色/黑色主题、动态主色和语义类。
- 保持现有页面业务流程、接口、动态主色能力和主题切换行为不变。

**Non-Goals:**

- 不在本次变更中删除 `packages/pomelo-theme`。
- 不在本次变更中彻底迁移 Web 所有 Less 文件到 Tailwind。
- 不在本次变更中移除 Bootstrap 或重写 `identity-server` 的 Toast/Popover 行为。
- 不升级 Vue、Ant Design Vue、Vant、Webpack 或 Node 版本。
- 不改变登录、密码、OIDC 授权确认、退出确认和错误页的业务逻辑。

## Decisions

### 1. Web 端保留 `pomelo-theme` token，停止扩展非 token 职责

Web 端继续从 `pomelo-theme` 获得现有 Less 变量和 CSS 变量，例如 `@var-primary`、`@text-color`、`@component-background`、`--theme-primary`、`--text-primary`。这样 Ant Design Vue 1.x、Vant 和历史 Less 文件可以继续构建。

迁移时不再把新的 reset、mixin 或通用工具类加入 `pomelo-theme`。已迁移代码优先使用 Tailwind 或 Web 本地样式层表达布局、间距、文本、颜色和状态。

替代方案是一次性删除 `pomelo-theme` 并复制全部 token 到 Web 本地。该方案会同时触碰 `clients/web`、`antdv-layout-pro` 和大量 Less 文件，风险过高，不适合作为第一阶段。

### 2. Tailwind 使用 v3，并以低侵入方式接入 Web

Tailwind 推荐使用 v3.x 接入当前 Vue CLI/PostCSS 体系，避免引入对 Node 20+ 或 CSS-first 构建模式的要求。Web 端应复用现有 PostCSS 管线，并将 Tailwind content 扫描范围限定在 Web 源码和确需扫描的本地包。

为降低与 Ant Design Vue、Vant、历史全局类名和 CSS Modules 的冲突，Tailwind 初始配置应禁用 preflight，并建议使用 `tw-` 前缀。迁移后的模板和样式可以显式使用 `tw-flex`、`tw-gap-*` 等工具类，避免 Tailwind 生成 `.container`、`.fixed` 等潜在冲突类。

替代方案是启用默认 preflight 且不加前缀。该方案开发体验更接近标准 Tailwind，但在当前历史样式较多的仓库中容易造成不可见的样式回归。

### 3. `identity-server` 不引入 Tailwind

`identity-server` 页面数量少，现有 HTML 结构大量使用 Bootstrap 类和 Bootstrap JS 行为。Tailwind 只能替代 CSS 工具类，不能替代 `bootstrap.Toast` 和 `bootstrap.Popover`。因此本阶段保留 Bootstrap，避免同时重写页面结构和交互行为。

`identity-server` 的样式重构重点是本地化主题 token：移除 `@ace-pomelo/theme` import，在 `public/style` 内提供白色/黑色主题变量、CSS 变量、语义文字类、颜色背景类和 Bootstrap 主题覆盖。

替代方案是彻底用 Tailwind 替换 Bootstrap。该方案需要重写 Controller 字符串模板、EJS 模板、表单校验样式、Toast 和 Popover 行为，范围明显超过本次主题包解耦目标。

### 4. 保持动态主色 CSS 变量协议

现有 Web 和 `identity-server` 都依赖 `--theme-primary` 与 `--theme-primary-1..10` 表达动态主色。`identity-server` 继续通过 `renderPrimaryStyle` 输出这些变量，Web 继续通过 ConfigProvider 生成主题变量。

本次变更不强制抽取一个新的跨端 token 包。跨端抽取可以作为后续优化，当前优先保持变量协议一致，降低迁移成本。

### 5. 分阶段迁移并保持可回滚

第一阶段只做解耦和基础接入：Web 加 Tailwind 配置但不强行迁移所有样式，`identity-server` 移除 `pomelo-theme` import 并补齐本地主题。

后续阶段按页面或模块迁移 Web 非 token 样式。每迁移一处，都应删除对应的 `pomelo-theme` mixin/reset/工具类依赖，并通过构建或页面验证确认无回归。

## Risks / Trade-offs

- [Risk] Tailwind 生成的全局工具类与历史类名冲突 → Mitigation: 初始禁用 preflight，使用 `tw-` 前缀，content 扫描范围保持最小。
- [Risk] Web 端同时存在 Less token 和 Tailwind token，短期内主题来源不完全统一 → Mitigation: Tailwind 颜色配置优先映射到现有 CSS 变量，不另造一套品牌色常量。
- [Risk] `identity-server` 本地主题复制了部分 `pomelo-theme` token，后续可能与 Web token 演进不同步 → Mitigation: 仅复制身份页必需的最小 token，并保留 `--theme-primary-*` 变量协议。
- [Risk] 移除 `identity-server` 的主题包构建依赖后，已有本地改动可能掩盖样式缺口 → Mitigation: 实施前检查工作区状态，基于最新文件读取后修改，并逐页验证登录、密码、授权和退出页面。
- [Risk] Bootstrap 继续保留，Web 和 identity-server 的技术栈不完全一致 → Mitigation: 这是刻意的边界选择，identity-server 页面轻量且依赖 Bootstrap JS，保留 Bootstrap 能降低风险。

## Migration Plan

1. 在 Web 端增加 Tailwind v3 配置和依赖，接入现有 PostCSS/Vue CLI 构建链路。
2. 将 Web Tailwind 主题配置映射到现有 CSS 变量，并禁用 preflight、启用 `tw-` 前缀。
3. 明确 `pomelo-theme` 在 Web 端仅作为 token provider 使用，避免新增非 token 能力。
4. 在 `identity-server/public/style` 内补齐本地白色/黑色主题变量和语义工具类。
5. 移除 `identity-server` 样式文件中对 `@ace-pomelo/theme` 的 import。
6. 移除根启动脚本中 `identity-server` 对 `@ace-pomelo/theme` build 的前置依赖。
7. 分别运行 Web 构建、`identity-server` 构建和相关单元测试；必要时对身份页做浏览器人工验证。

Rollback 策略：如果 `identity-server` 样式回归明显，可以临时恢复 `@ace-pomelo/theme` import 和启动前构建依赖；Web Tailwind 接入可通过移除 Tailwind import/config 恢复，不影响 token 兼容层。

## Open Questions

- Web 首批迁移哪些非 token 样式文件需要在实施前按风险排序。
- `pomelo-theme` 后续是否重命名为更明确的 token 包，需要另起变更讨论。
- 是否要在后续阶段抽取 Web 与 `identity-server` 共用的主色生成工具，需要在当前解耦完成后评估。
