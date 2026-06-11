## 1. Shared 契约与配置基础

- [x] 1.1 在 `OptionPresetKeys` 中新增 `auth-register-enable`、`auth-register-email-suffixes`、`auth-register-email-template`、`auth-google-enable`、`auth-google`、`auth-github-enable`、`auth-github`、`auth-linuxdo-enable` 和 `auth-linuxdo`。
- [x] 1.2 在 BFF option definitions 中登记新增认证 options，并设置 enable 与邮箱后缀为匿名可读、管理员可写。
- [x] 1.3 将 `auth-google`、`auth-github` 和 `auth-linuxdo` 登记为敏感平台 JSON 配置，确保普通匿名读取和 `autoloadOptions` 不返回明文配置。
- [x] 1.4 为 BFF 内部服务增加读取敏感 option 原始值的受控方法，供第三方登录服务读取 `auth-*` JSON。
- [x] 1.5 补齐 shared configuration 的 `REDIS_URL` 到 `cache.redisUrl` 映射，并保留未配置时的内存缓存 fallback。
- [x] 1.6 定义认证用户创建和第三方绑定所需的 shared pattern、DTO、类型和私有 user meta key 常量。
- [x] 1.7 定义 BFF 内部邮件发送接口类型，使用 `scene` 区分邮件场景，并声明 `register-email-code` 场景。
- [x] 1.8 定义注册和第三方登录的 OpenAPI/GraphQL 复用 input、response 模型，确保两种入口返回结构一致。

## 2. Options 默认数据与数据库升级

- [x] 2.1 新增 `infrastructure-service` migration，幂等插入认证 options 默认值。
- [x] 2.2 确保 migration 不覆盖已存在的认证 optionValue。
- [x] 2.3 在 migration 默认值中加入 `auth-register-email-template` 注册邮件模板 JSON 字符串。
- [x] 2.4 更新站点初始化默认 options，写入与 migration 相同的认证 options 默认值。
- [x] 2.5 覆盖新库初始化和老库 `--sync` 升级两种路径下的默认值一致性。
- [x] 2.6 为认证 options migration 添加可验证的单元测试或集成验证脚本。

## 3. Infrastructure 用户创建与绑定能力

- [x] 3.1 在 `infrastructure-service` 中实现受控认证用户创建方法，不复用需要管理员权限的用户创建入口。
- [x] 3.2 认证用户创建方法需要执行用户名、邮箱、手机号唯一性校验，并写入默认角色、固定元数据和启用状态。
- [x] 3.3 支持第三方账号按 provider subject 查询已绑定用户。
- [x] 3.4 支持第三方自动创建用户时写入空字符串 `loginPwd`、平台前缀登录名和私有绑定元数据。
- [x] 3.5 第三方 email 已被其他用户占用时返回明确错误，不自动绑定已有用户。
- [x] 3.6 为受控认证创建、provider subject 查询和 email 冲突处理添加测试。

## 4. BFF 注册能力

- [x] 4.1 新增注册验证码发送和注册提交的 OpenAPI REST controller 与 GraphQL resolver，并标记为匿名可调用。
- [x] 4.2 实现 `auth-register-enable` 服务端校验，关闭时拒绝发送验证码和提交注册。
- [x] 4.3 实现 `auth-register-email-suffixes` 解析工具，支持逗号分隔、trim、小写、移除开头 `@` 和过滤空值。
- [x] 4.4 发送验证码前校验邮箱格式、邮箱后缀白名单、邮箱唯一性、邮箱发送配置完整性和发送冷却。
- [x] 4.5 使用 `AppCacheService` 保存邮箱验证码、过期时间和发送冷却状态。
- [x] 4.6 实现 BFF 场景化邮件发送服务，支持按 `scene` 选择邮件模板和模板变量。
- [x] 4.7 实现 `register-email-code` 场景，读取 `auth-register-email-template` 并渲染注册验证码邮件内容。
- [x] 4.8 基于现有邮箱 options 实现 BFF SMTP 发送适配；如无现成 SMTP 客户端，新增并封装受控邮件发送依赖。
- [x] 4.9 邮箱发送配置缺失时返回联系管理员配置的提示，并且不得写入可用于注册的验证码状态。
- [x] 4.10 注册提交时校验验证码、用户名唯一性、邮箱唯一性和密码输入，并通过受控认证创建接口创建本地用户。
- [x] 4.11 注册成功后签发与 `signIn` 兼容的 token 结果。
- [x] 4.12 为注册开关、邮箱后缀、邮箱配置缺失、邮件模板渲染、验证码过期、验证码错误、重复邮箱和注册成功添加测试。
- [x] 4.13 为注册 OpenAPI REST 和 GraphQL 入口添加一致性测试，确认两者委托同一服务并返回等价结构。

## 5. BFF 第三方登录能力

- [x] 5.1 新增第三方登录 provider 枚举和 provider 配置解析模型，覆盖 Google、GitHub、Linux.do。
- [x] 5.2 实现第三方登录 start 的 OpenAPI REST controller 与 GraphQL resolver，校验 `auth-*-enable`、读取 `auth-*` JSON、校验必需字段并生成授权 URL。
- [x] 5.3 在 start 接口中生成 state、PKCE 信息和 returnUrl，并写入 `AppCacheService`。
- [x] 5.4 实现 `/oauth/:provider/callback` 对应的 BFF complete 能力，并提供 OpenAPI REST controller 与 GraphQL resolver，校验 state 一次性使用并完成 token exchange。
- [x] 5.5 实现 Google 和 Linux.do OIDC discovery / userinfo adapter。
- [x] 5.6 实现 GitHub OAuth token exchange、用户信息读取和主邮箱读取 adapter。
- [x] 5.7 第三方登录成功后按 provider subject 查找绑定用户；未绑定时按规则自动创建外部用户并写入绑定元数据。
- [x] 5.8 complete 成功后返回与 `signIn` 兼容的 token 结果。
- [x] 5.9 为未启用平台、配置缺失、state 无效、provider subject 已绑定、自动建号和 email 冲突添加测试。
- [x] 5.10 为第三方登录 OpenAPI REST 和 GraphQL 入口添加一致性测试，确认 start/complete 两种入口返回等价结构和错误语义。

## 6. pomelo-login 前端注册页面

- [x] 6.1 在 `pomelo-login` 中新增 `/register` 路由、注册页面组件和导航入口。
- [x] 6.2 登录页通过 `autoloadOptions` 读取 `auth-register-enable`，开启时展示注册入口，关闭时隐藏。
- [x] 6.3 注册页直接访问时校验 `auth-register-enable`，关闭时跳回登录页或展示注册未开放状态。
- [x] 6.4 注册表单实现邮箱、验证码、用户名、密码、确认密码和记住我等必要控件。
- [x] 6.5 实现发送验证码交互、发送冷却展示、错误提示和成功提示。
- [x] 6.6 注册提交前对密码执行与本地登录一致的 SHA-256 处理。
- [x] 6.7 注册成功后按现有 `access-token` 格式写入 localStorage 或 sessionStorage，并跳转 `returnUrl` 或结果页。
- [x] 6.8 补齐注册页中文和英文 i18n 文案，并保持 AuthShell / LiquidGlass 视觉一致。

## 7. pomelo-login 第三方登录页面

- [x] 7.1 登录页通过 `autoloadOptions` 读取 `auth-google-enable`、`auth-github-enable` 和 `auth-linuxdo-enable`。
- [x] 7.2 在登录按钮下方实现 `-- or --` 分隔线，并仅在至少一个第三方平台启用时展示。
- [x] 7.3 实现 Google、GitHub、Linux.do 第三方登录按钮，并按 enable 状态展示。
- [x] 7.4 点击第三方按钮时调用 BFF start 接口，不在前端拼接第三方授权 URL。
- [x] 7.5 新增 `/oauth/:provider/callback` 页面，读取 code/state，调用 BFF complete 接口并展示处理中、成功和失败状态。
- [x] 7.6 complete 成功后按现有 `access-token` 格式写入 token，并跳转到 state 中保存的 `returnUrl`。
- [x] 7.7 补齐第三方登录按钮、错误状态和回调页的中英文 i18n 文案。
- [x] 7.8 检查登录页移动端和桌面端布局，确保注册入口、分隔线和第三方按钮不重叠。

## 8. 自动化验证与回归

- [x] 8.1 运行 BFF 相关单元测试，覆盖 options、注册验证码和第三方登录服务。
- [x] 8.2 运行 `infrastructure-service` 相关测试或本地 `--sync` 验证，确认 migration 可插入默认 options 且不覆盖已有值。
- [x] 8.3 运行 `pomelo-login` typecheck 和 build。
- [x] 8.4 使用本地 Redis 配置验证验证码、OAuth state 和 callback 能跨 BFF 请求读取。
- [x] 8.5 验证未配置 Redis 时开发环境仍能通过内存缓存完成单实例注册和 OAuth callback。
- [x] 8.6 验证 `auth-register-enable=0`、`auth-*-enable=0` 时前端入口隐藏且后端接口拒绝。
- [x] 8.7 验证 `auth-register-enable=1` 且 `auth-register-email-suffixes` 为空时注册接口返回明确错误。
- [x] 8.8 验证邮箱发送配置缺失时发送验证码接口提示联系管理员配置，且不会写入可用验证码。
- [x] 8.9 验证注册验证码邮件使用 `register-email-code` scene 和 `auth-register-email-template` 渲染。
- [x] 8.10 通过 mock provider 或服务测试验证三方自动创建的空密码账号不能通过本地密码登录。
- [x] 8.11 验证 `autoloadOptions` 不返回 `auth-google`、`auth-github`、`auth-linuxdo` 和 `auth-register-email-template` 明文配置。
- [x] 8.12 验证 Swagger/OpenAPI 文档包含认证 REST 入口，GraphQL schema 包含对应 mutation。

## 9. 人工验收

- [x] 9.1 人工配置正确的邮箱发送 options 后，在真实邮箱 app 中收到注册验证码邮件，并使用邮件中的 code 完成注册。
- [x] 9.2 验收 `auth-register-email-template` 模板渲染结果，确认邮件 subject、text/html 内容和 `code`、`email`、`expiresInMinutes`、`siteName` 变量替换正确。
- [x] 9.3 人工创建并配置 Google、GitHub、Linux.do 的 `clientId`、`clientSecret`、callback URL、scope 和 endpoint 等参数。
- [x] 9.4 在真实 Google OAuth client 配置下完成第三方登录 start、授权回跳、complete、自动建号和 token 写入流程验收。
- [x] 9.5 在真实 GitHub OAuth app 配置下完成第三方登录 start、授权回跳、complete、自动建号和 token 写入流程验收。
- [x] 9.6 在真实 Linux.do OAuth/OIDC client 配置下完成第三方登录 start、授权回跳、complete、自动建号和 token 写入流程验收。
- [x] 9.7 验收第三方自动创建账号的登录名带平台前缀、`loginPwd` 为空字符串，并确认该账号不能通过本地密码登录。
