## ADDED Requirements

### Requirement: Web 保留主题 token 兼容层
Web 端 MUST 保留 `pomelo-theme` 中服务于主题 token 的能力，确保现有 Less 变量、CSS 变量、Ant Design Vue 变量覆盖和 Vant 变量覆盖继续可用。

#### Scenario: 旧 Less 变量继续可构建
- **WHEN** Web 样式仍引用 `@var-primary`、`@text-color`、`@component-background` 等主题变量
- **THEN** Web 构建 MUST 成功，并且这些变量 MUST 继续解析为有效样式值

#### Scenario: 运行时主题变量继续生效
- **WHEN** Web 端切换主题或更新主色
- **THEN** 页面 MUST 继续更新 `--theme-primary`、`--theme-primary-*`、`--text-*` 等 CSS 变量

### Requirement: Web 使用 Tailwind 承接非 token 样式
Web 端新增样式和已迁移的非 token 样式 MUST 优先使用 Tailwind 或 Web 本地样式层实现，不再扩展 `pomelo-theme` 的 reset、mixin 或工具类职责。

#### Scenario: 新增样式不扩展 pomelo-theme
- **WHEN** Web 端新增布局、间距、文本或状态样式
- **THEN** 实现 MUST 使用 Tailwind 工具类或 Web 本地样式，不得向 `packages/pomelo-theme` 新增 reset、mixin 或通用工具类

#### Scenario: 迁移旧 mixin 用法
- **WHEN** 某个 Web 样式文件完成 Tailwind 迁移
- **THEN** 该文件 MUST 移除不再需要的 `@ace-pomelo/theme/lib/mixins` import

### Requirement: Tailwind 接入不得破坏历史组件样式
Web 端 Tailwind 接入 MUST 避免破坏 Ant Design Vue、Vant、CSS Modules 和历史全局样式的行为。

#### Scenario: Tailwind 初始接入
- **WHEN** Tailwind 被接入 Web 构建链路
- **THEN** Tailwind 配置 MUST 禁用 preflight，并 SHOULD 使用前缀避免生成与历史类名冲突的全局类

#### Scenario: 组件库样式保持稳定
- **WHEN** Web 应用加载 Ant Design Vue 或 Vant 组件
- **THEN** 组件默认布局、表单、弹层和交互样式 MUST 不因 Tailwind reset 或全局类覆盖而回归

### Requirement: Tailwind 主题值映射到现有 CSS 变量
Web 端 Tailwind 主题配置 MUST 优先映射到现有主题 CSS 变量，避免并行维护另一套品牌色 token。

#### Scenario: 使用主题主色工具类
- **WHEN** Web 端使用 Tailwind 表达主色相关样式
- **THEN** 生成的样式 MUST 引用现有 `--theme-primary` 或 `--theme-primary-*` 变量，而不是硬编码一套新的主色常量

#### Scenario: 主题切换后 Tailwind 样式同步变化
- **WHEN** 用户切换 Web 主题或主色
- **THEN** 依赖主题变量的 Tailwind 样式 MUST 随 CSS 变量同步变化
