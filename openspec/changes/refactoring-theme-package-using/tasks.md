## 1. 前置盘点

- [x] 1.1 检查 `git status --short`，确认已有用户改动范围，实施时不得覆盖无关改动。
- [x] 1.2 重新扫描仓库中 `@ace-pomelo/theme`、`pomelo-theme`、`@var-*`、`.set*()`、`.textOverflow*()` 的引用，区分 token 依赖和非 token 样式依赖。
- [x] 1.3 明确 Web 端允许继续使用的 `pomelo-theme` token 入口，并记录禁止继续扩展的 reset、mixin、工具类入口。
- [x] 1.4 重新确认 `identity-server` 中 Bootstrap CSS、Bootstrap JS、Toast、Popover、表单校验和 EJS 模板的实际依赖面。

## 2. Web Tailwind 接入

- [x] 2.1 在 Web 工作区添加 Tailwind v3 相关依赖和配置，保持与当前 Vue CLI、Webpack、PostCSS、Node 16.20.2 兼容。
- [x] 2.2 配置 Tailwind content 扫描范围，覆盖 `clients/web` 源码和必要的本地包，避免扫描无关构建产物。
- [x] 2.3 配置 Tailwind 禁用 preflight，并使用 `tw-` 前缀降低与历史全局类、CSS Modules、Ant Design Vue、Vant 的冲突风险。
- [x] 2.4 将 Tailwind 主题颜色、文本色、背景色和边框色映射到现有 `--theme-*`、`--text-*`、`--component-background`、`--body-background` CSS 变量。
- [x] 2.5 在 Web 样式入口接入 Tailwind layers，确保不破坏现有 Less token、Ant Design Vue 变量覆盖和 Vant 变量覆盖。

## 3. Web 非 token 样式迁移

- [x] 3.1 移除 Web 新增样式对 `pomelo-theme` reset、mixin 和颜色工具类的新增依赖，改用 Tailwind 或 Web 本地样式。
- [x] 3.2 将低风险的 Web mixin 使用点迁移为 Tailwind 工具类或本地 CSS，例如文本省略、细边框、布局间距和文本颜色。
- [x] 3.3 将已迁移文件中的 `@ace-pomelo/theme/lib/mixins` import 删除，只保留必要 token import。
- [x] 3.4 将 Web 中对完整 `@ace-pomelo/theme/lib/index` 的依赖收窄为 token 相关入口，避免继续引入 reset 和全量工具类。
- [x] 3.5 验证 Web 主题切换和主色切换后，旧 Less 样式与 Tailwind 样式都能跟随 CSS 变量变化。

## 4. identity-server 本地主题

- [x] 4.1 在修改前读取 `servers/identity-server/public/style`、相关 EJS 模板和 Controller 当前内容，基于最新文件处理已有改动。
- [x] 4.2 重写 `identity-server` 本地 `_variables.less`，提供浅色主题、深色主题、主色、色阶、文本、背景、边框、阴影和语义状态变量。
- [x] 4.3 重写 `identity-server` 本地 `index.less`，输出 `:root`、`prefers-color-scheme: dark`、文本语义类、状态色类、滚动条和基础 reset。
- [x] 4.4 更新 `bootstrap-theme.less`，让 Bootstrap 按钮、表单焦点、checkbox/radio 等状态读取本地主题 CSS 变量。
- [x] 4.5 更新 `container.less`、`login.less`、`password.less`、`_wrapper.less`、`_form.less` 中的变量引用，确保不再依赖 `@ace-pomelo/theme`。
- [x] 4.6 保留 Bootstrap CDN 和 `bootstrap.Toast`、`bootstrap.Popover` 调用，不引入 Tailwind 到 `identity-server`。
- [x] 4.7 移除根 `start:identity-server` 中 `yarn workspace @ace-pomelo/theme run build` 的前置依赖。
- [x] 4.8 扫描 `identity-server`，确认不再存在 `@ace-pomelo/theme` 或 `packages/pomelo-theme` 引用。

## 5. 验证

- [x] 5.1 运行 Web 构建或至少运行 Web 样式相关构建检查，确认 Tailwind、Less、Ant Design Vue、Vant 可以共同编译。
- [x] 5.2 运行 `identity-server` 样式构建和 NestJS 构建，确认无需 `pomelo-theme` 预构建即可成功。
- [x] 5.3 对登录、授权确认、选择账号、忘记密码、验证码校验、重置密码、修改密码、退出确认和错误页做浅色/深色主题视觉验证。
- [x] 5.4 验证配置 `primaryColor` 的 OIDC 客户端页面会输出并应用 `--theme-primary` 与 `--theme-primary-*`。
- [x] 5.5 验证 `showToast` 和 `showPopover` 仍可正常显示、隐藏和触发回调。
- [x] 5.6 运行相关单元测试或最小回归测试，后台执行单元测试时设置最大 60s 超时。
- [x] 5.7 运行最终引用扫描，确认 Web 端只保留预期 token 依赖，`identity-server` 无 `pomelo-theme` 依赖。
