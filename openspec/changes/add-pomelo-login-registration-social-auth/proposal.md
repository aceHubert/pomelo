## Why

`pomelo-login` 当前只支持本地账号登录和密码相关流程，缺少公开注册入口和第三方登录入口。为了让登录应用独立承载完整认证入口，需要补齐邮箱验证码注册、可配置邮箱后缀限制、Google/GitHub/Linux.do 第三方登录，以及对应的 options 默认配置升级。

## What Changes

- 在 `pomelo-login` 中新增注册入口和 `/register` 页面，并通过 `auth-register-enable` 控制入口展示、页面可访问性和后端注册接口可用性。
- 注册流程使用邮箱接收验证码，BFF 负责发送、缓存和校验验证码；发送前必须检查邮箱发送配置，缺失时提示联系管理员配置，并按 `auth-register-email-suffixes` 限制允许注册的邮箱后缀。
- BFF 增加按 `scene` 区分场景的邮件发送接口，注册验证码使用注册邮件模板发送。
- `infrastructure-bff` 为注册和第三方登录能力同时提供 OpenAPI REST controller 与 GraphQL resolver，两种入口复用同一服务实现和返回模型。
- 在登录按钮下方增加 `-- or --` 分隔线和 Google、GitHub、Linux.do 第三方登录按钮；分隔线和按钮展示由 `autoloadOptions` 中的 `auth-*-enable` 控制。
- 新增第三方登录 start/callback 流程，点击按钮时由 BFF 生成第三方授权跳转地址，回调固定到 `pomelo-login` 的 `/oauth/:provider/callback` 路由。
- BFF 使用 Redis 支持验证码、OAuth state、PKCE 和一次性登录 ticket 等短期状态；未配置 Redis 时沿用现有 BFF cache 的内存实现用于开发环境。
- 第三方登录成功后，系统自动创建或查找本地用户；自动创建用户使用平台前缀登录名、空字符串密码，并通过用户元数据保存平台身份绑定。
- 在 `options` 表中通过 migration 增加注册、邮箱后缀、注册邮件模板和第三方登录相关默认值，并在站点初始化默认数据中写入同一批 option。
- 扩展 `OptionPresetKeys`、BFF option 白名单和访问级别，使 `auth-*-enable` 可匿名读取且管理员可写，`auth-*` 平台 JSON 配置可由管理员写入但不能公开泄露。

## Capabilities

### New Capabilities

- `pomelo-login-registration`: 定义 `pomelo-login` 的注册入口、注册页面、邮箱验证码、邮箱后缀限制和注册启用开关行为。
- `pomelo-login-social-auth`: 定义 `pomelo-login` 第三方登录按钮、BFF 授权跳转生成、固定 `/oauth/:provider/callback` 回调、第三方账号自动创建与绑定行为。
- `infrastructure-auth-entrypoints`: 定义注册和第三方登录能力在 `infrastructure-bff` 中的 OpenAPI REST 与 GraphQL 双入口行为。
- `auth-runtime-options`: 定义注册和第三方登录相关 `auth-*` options 的默认值、autoload 读取、访问级别、注册邮件模板、敏感配置读取和服务端启用状态校验行为。

### Modified Capabilities

- `database-migration-sync`: `infrastructure-service` 的 pending migrations 需要为老数据库补齐 `auth-*` 默认 options，并保证新站点初始化与升级库默认数据一致。

## Impact

- 影响前端：`clients/pomelo-login` 路由、登录页 UI、注册页、OAuth 回调页、GraphQL operations、i18n、样式和 token 写入流程。
- 影响 BFF：用户 OpenAPI/GraphQL 入口、options 读取、注册验证码服务、第三方 OAuth/OIDC 服务、短期状态缓存和 Redis 配置映射。
- 影响基础服务：`OptionPresetKeys`、option 默认数据、用户创建/查询/元数据能力，以及 `infrastructure-service` migrations。
- 影响部署配置：BFF 生产环境需要配置 `REDIS_URL` 以支持多实例验证码和 OAuth state 共享。
- 影响安全边界：第三方平台 `clientSecret` 存放在 `auth-*` JSON option 中，公开接口只能暴露 enable 状态，不能暴露平台密钥配置。
