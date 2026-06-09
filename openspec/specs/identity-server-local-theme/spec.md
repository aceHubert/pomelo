## Purpose

定义 identity-server 身份页本地主题能力，移除对 `pomelo-theme` 构建产物的样式依赖，同时保持 Bootstrap 交互和业务流程稳定。

## Requirements

### Requirement: identity-server 移除 pomelo-theme 构建依赖
`identity-server` MUST 不再依赖 `@ace-pomelo/theme` 的 Less import 或启动前构建产物。

#### Scenario: 启动 identity-server
- **WHEN** 执行 `start:identity-server`
- **THEN** 命令 MUST 不需要先执行 `yarn workspace @ace-pomelo/theme run build`

#### Scenario: 编译 identity-server 样式
- **WHEN** 编译 `servers/identity-server/public/style/*.less`
- **THEN** 样式文件 MUST 不引用 `@ace-pomelo/theme` 或其 `lib` 路径

### Requirement: identity-server 使用本地黑白主题
`identity-server` MUST 在自身 `public/style` 范围内提供白色和黑色主题变量，覆盖身份页所需文本、背景、边框、阴影、主色和语义状态色。

#### Scenario: 系统浅色主题
- **WHEN** 浏览器使用浅色系统主题访问登录、密码、授权确认或退出页面
- **THEN** 页面 MUST 使用本地浅色 token 渲染文本、背景、边框、按钮和链接

#### Scenario: 系统深色主题
- **WHEN** 浏览器使用深色系统主题访问登录、密码、授权确认或退出页面
- **THEN** 页面 MUST 使用本地深色 token 渲染文本、背景、边框、按钮和链接

### Requirement: identity-server 保留 Bootstrap 能力
`identity-server` MUST 保留 Bootstrap 作为身份页基础 UI 和交互能力来源，不引入 Tailwind 作为身份页样式依赖。

#### Scenario: 表单页面渲染
- **WHEN** 登录、忘记密码、修改密码或重置密码页面渲染表单
- **THEN** 页面 MUST 继续支持 Bootstrap 的栅格、表单控件、按钮和校验反馈样式

#### Scenario: Toast 和 Popover 交互
- **WHEN** 身份页脚本调用 `showToast` 或 `showPopover`
- **THEN** 交互 MUST 继续通过 Bootstrap Toast 和 Popover 正常显示、隐藏和触发回调

### Requirement: identity-server 保留动态主色协议
`identity-server` MUST 继续支持客户端配置的 `primaryColor`，并通过 CSS 变量注入主色及其色阶。

#### Scenario: 客户端配置 primaryColor
- **WHEN** OIDC 客户端配置了 `primaryColor`
- **THEN** 身份页 MUST 输出 `--theme-primary` 和 `--theme-primary-*` 变量，并将按钮、链接、焦点和选中态渲染为该主色体系

#### Scenario: 客户端未配置 primaryColor
- **WHEN** OIDC 客户端未配置 `primaryColor`
- **THEN** 身份页 MUST 使用本地默认主色，并保持浅色和深色主题下的可读性

### Requirement: identity-server 业务行为保持不变
`identity-server` 样式解耦 MUST 不改变登录、密码、授权确认、退出确认和错误页的业务流程与接口协议。

#### Scenario: 登录流程
- **WHEN** 用户提交登录表单
- **THEN** 表单提交、校验、成功跳转和错误提示行为 MUST 与变更前保持一致

#### Scenario: 密码流程
- **WHEN** 用户执行忘记密码、验证码校验、重置密码或修改密码流程
- **THEN** 请求参数、校验规则、提示方式和跳转行为 MUST 与变更前保持一致
