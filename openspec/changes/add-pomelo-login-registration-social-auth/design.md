## Context

`pomelo-login` 已经是独立 React + Vite 登录应用，生产主入口为 `/auth`，应用内固定路由包含 `/login` 和 `/password/*`。当前它只迁移了本地登录、忘记密码和修改密码流程，缺少用户自助注册和第三方登录入口。

现有 BFF 已经提供 GraphQL、`OptionService`、`AppCacheService` 和本地 token 签发能力；`AppCacheService` 可在配置 Redis 时切换到 Redis，否则使用内存缓存。`infrastructure-service` 使用 Umzug migrations 管理结构升级，`options` 表的值类型为字符串，适合用普通字符串、逗号分隔字符串和 JSON 序列化对象承载认证配置。

## Goals / Non-Goals

**Goals:**

- 在 `pomelo-login` 中补齐注册页面、登录页注册入口、第三方登录按钮和 OAuth 回调页面。
- 使用 `autoloadOptions` 暴露匿名可读的启用状态，不新增专门的认证能力查询接口。
- 使用 BFF 接口处理注册验证码、邮箱后缀校验、第三方 OAuth/OIDC state、token exchange、userinfo 拉取、用户创建和本地 token 签发。
- 在 `infrastructure-bff` 中同时提供 OpenAPI REST 和 GraphQL 认证入口，便于不同客户端和接口文档使用。
- 使用 BFF 场景化邮件发送接口处理注册验证码邮件，并在发送前校验邮箱发送配置完整性。
- 使用 Redis 支撑 BFF 多实例下的验证码、OAuth state、PKCE 和一次性 ticket；开发环境允许 fallback 到内存缓存。
- 通过 migration 给现有数据库补齐 `auth-*` 默认 options，并让站点初始化写入同一批默认数据。
- 将第三方平台密钥保存在 `auth-*` JSON option 中，公开接口只返回 enable 状态，不泄露密钥。

**Non-Goals:**

- 不在 `pomelo-admin` 中新增注册或第三方登录管理页面。
- 不改造 `identity-server` 的 OIDC 服务端能力。
- 不实现第三方账号与已有本地账号的用户自助绑定/解绑页面。
- 不实现短信验证码、邮箱模板可视化管理页面或邮件投递队列。
- 不改变现有本地登录 token 存储格式。

## Decisions

### Decision 1: `pomelo-login` 只负责展示和跳转，BFF 负责安全状态与密钥

登录页从匿名可读的 `autoloadOptions` 读取 `auth-register-enable`、`auth-google-enable`、`auth-github-enable` 和 `auth-linuxdo-enable`，用于控制注册入口和第三方按钮展示。点击第三方按钮时，前端调用 BFF start 接口，由 BFF 校验 enable 状态、读取平台配置、生成 state/PKCE 并返回授权 URL。

备选方案是在前端根据平台配置直接拼接授权 URL。该方案会让回调、state 和密钥处理散落到前端，不利于安全控制和多实例部署，因此不采用。

### Decision 2: 注册开关和第三方开关都使用 `auth-*-enable`

注册使用 `auth-register-enable`，第三方平台使用 `auth-google-enable`、`auth-github-enable`、`auth-linuxdo-enable`。这些值都为字符串 `"0"` 或 `"1"`，并设置为 autoload、匿名可读、管理员可写。

所有新增认证 option key 必须统一定义到 `OptionPresetKeys`，包括注册开关、邮箱后缀、注册邮件模板、第三方平台 enable 和平台 JSON 配置。BFF option definitions、migration、站点初始化默认数据和认证服务逻辑应引用这些常量，避免多处硬编码导致 key 拼写漂移。

备选方案是通过平台配置是否为空判断是否启用。该方案无法表达“已配置但临时关闭”，也会诱导前端读取敏感配置，因此不采用。

### Decision 3: 邮箱后缀白名单使用逗号分隔字符串

`auth-register-email-suffixes` 使用普通字符串保存允许后缀，例如 `company.com,linux.do`。BFF 解析时 trim、转小写、移除开头 `@` 并过滤空值。默认空字符串表示没有允许的后缀，注册发送验证码和提交注册都必须失败。

备选方案是使用 JSON 数组。邮箱后缀是简单字符串列表，逗号分隔更便于管理员直接配置和迁移默认值，因此不采用 JSON 数组。

### Decision 4: 平台配置使用一个 JSON 字符串 option

每个平台使用一个对象 option：`auth-google`、`auth-github`、`auth-linuxdo`，默认值为 `"{}"`。`optionValue` 仍然是字符串，服务端读取后 `JSON.parse`。配置字段至少覆盖 `clientId`、`clientSecret`、`scope`、`discoveryUrl`、`authorizationEndpoint`、`tokenEndpoint`、`userinfoEndpoint` 和 `tokenAuthMethod`。

备选方案是拆成多个 `auth-google-client-id` 这类 option。拆分会增加 option 数量和管理复杂度，平台配置天然是一个对象，因此不采用。

### Decision 5: BFF 使用内部读取路径获取敏感 `auth-*` 配置

`auth-*` 平台 JSON 包含 `clientSecret`，不得通过匿名 GraphQL 或普通读取接口返回。BFF 的第三方登录服务需要通过内部方法或直接 service pattern 读取原始 option 值，且该能力不能暴露到公开 API。

备选方案是将 `auth-*` 配置设为普通公开 option。该方案会泄露 `clientSecret`，不可接受。

### Decision 6: OAuth 回调固定到 `/auth/oauth/:provider/callback`

`pomelo-login` 新增业务路由 `/oauth/:provider/callback`。生产环境完整回调路径为 `/auth/oauth/google/callback`、`/auth/oauth/github/callback` 和 `/auth/oauth/linuxdo/callback`。`returnUrl` 不追加到第三方 callback URL，而是存入 state 对应的 BFF cache 记录中。

备选方案是每次动态生成不同 callback 或把 `returnUrl` 放入 callback query。动态 callback 增加第三方平台配置复杂度；query 暴露业务来源且容易被篡改，因此不采用。

### Decision 7: 第三方账号使用用户元数据保存绑定关系

第三方登录成功后，系统先按平台 subject 在用户元数据中查找绑定用户。未找到时自动创建用户，登录名使用平台前缀和稳定标识生成，例如 `google_<hash>`、`github_<hash>`、`linuxdo_<hash>`；`loginPwd` 写空字符串，阻止直接密码登录；平台 subject、provider 和 profile 快照写入私有用户元数据。

如果第三方返回的 email 已被其他用户占用，不自动绑定到该用户，避免账号接管。第一版直接拒绝登录并提示联系管理员，后续如需绑定已有账号，需要单独设计已登录用户确认绑定流程。

### Decision 8: 注册和第三方自动建号使用受控认证创建接口

现有 `createUser` / `UserPattern.Create` 是管理员创建用户能力，会校验 `CreateUsers` 权限。注册和第三方自动建号不能复用该接口绕权限，也不能把匿名请求伪装成管理员请求。本变更需要在 shared pattern、`infrastructure-service` 和 BFF 中新增受控认证创建路径，只允许注册服务和第三方登录服务调用，并在该路径内部执行唯一性校验、默认角色写入、固定元数据写入和用户状态设置。

备选方案是复用现有管理员创建接口并传入系统用户 ID。该方案会模糊权限边界，并把匿名注册和后台管理混在同一能力里，因此不采用。

### Decision 9: 邮件发送抽象为按 scene 分发的 BFF 接口

注册验证码发送由 BFF 负责。BFF 定义内部邮件发送接口，入参包含 `scene`、收件人和模板变量，例如 `scene = register-email-code`。邮件服务根据 scene 选择模板并渲染内容，第一版至少支持注册验证码场景。这样后续找回密码、邮箱验证等场景可以复用同一发送接口，而不是为每个场景散落 SMTP 和模板逻辑。

发送前，BFF 必须读取并校验现有 `mailserver_url`、`mailserver_port`、`mailserver_login` 和 `mailserver_pass` options。缺少任一必需配置时，发送验证码接口必须失败，并返回“邮箱发送配置未完成，请联系管理员配置”的用户可理解提示。

注册验证码邮件模板使用 `auth-register-email-template` option 保存，`optionValue` 是 JSON 字符串，至少包含 `subject`、`text` 和可选 `html`。模板变量至少包含 `code`、`email`、`expiresInMinutes` 和 `siteName`。如果仓库没有可复用 SMTP 客户端，实现阶段新增受控依赖（例如 `nodemailer`）并将发送逻辑封装在 BFF 内部服务中。

备选方案是只把验证码写日志或交给 identity-server 旧密码流程。写日志不能满足真实注册；复用 identity-server 会把 `pomelo-login` 的注册能力耦合到另一套页面和控制器，因此不采用。

### Decision 10: BFF cache 需要显式支持 `REDIS_URL`

`AppCacheService` 已经读取 `cache.redisUrl`，但环境样例使用 `REDIS_URL`。本变更需要补齐 shared configuration 到 `cache.redisUrl` 的映射，使 BFF 在生产多实例下能通过 Redis 共享验证码、OAuth state、PKCE 和一次性 ticket。

备选方案是为注册和 OAuth 另建 Redis 客户端。现有 BFF cache 已封装 Redis/内存切换，复用它更少引入重复基础设施。

### Decision 11: 认证入口同时支持 OpenAPI REST 和 GraphQL

`infrastructure-bff` 需要为注册验证码发送、注册提交、第三方登录 start 和第三方登录 complete 提供两套公开入口：OpenAPI REST controller 和 GraphQL resolver。REST 路由纳入 Swagger/OpenAPI 文档，GraphQL mutation 纳入现有 GraphQL schema。两套入口必须委托同一个应用服务，复用同一批 input/response 模型和错误映射，保证行为一致。

建议 REST controller 放在 `/api/auth/*` 命名空间，GraphQL resolver 使用清晰的认证 mutation 名称。`pomelo-login` 可以优先使用 GraphQL operations，但 OpenAPI 入口必须同样可用，方便外部客户端、调试和接口文档消费。

备选方案是只实现 GraphQL 或只实现 REST。只实现一种入口会削弱 infrastructure 作为通用 API 层的能力，也不符合当前仓库中 controller/resolver 并存的模式，因此不采用。

## Risks / Trade-offs

- [Redis 未配置导致多实例回调失败] → 生产部署必须配置 `REDIS_URL`；开发环境可使用内存缓存。
- [邮箱后缀默认空字符串导致管理员以为注册可用] → `auth-register-enable=1` 但后缀为空时，后端返回明确错误，提示先配置允许邮箱后缀。
- [邮箱发送配置缺失导致验证码无法发送] → 发送前统一校验邮箱 options，缺失时返回联系管理员配置的提示，不生成可用验证码。
- [第三方 email 冲突造成账号接管] → 不按 email 自动绑定已有账号，只按平台 subject 元数据绑定。
- [平台 JSON 配置格式错误] → BFF start 接口在启用平台时校验必需字段，错误信息指向缺失字段。
- [公开 autoload 泄露敏感配置] → `auth-*` 平台 JSON 不设为公开读取，autoload 只暴露 enable 和非敏感注册后缀。
- [GitHub 与 OIDC provider 行为不一致] → 使用 provider adapter 分流；Google/Linux.do 走 OIDC discovery，GitHub 走 OAuth2 token endpoint 和 user/email API。

## Migration Plan

1. 新增 migration，为 `options` 表补齐 `auth-register-enable`、`auth-register-email-suffixes`、`auth-register-email-template`、`auth-google-enable`、`auth-google`、`auth-github-enable`、`auth-github`、`auth-linuxdo-enable`、`auth-linuxdo` 默认值。
2. 更新站点初始化默认 options，确保新库和升级库默认数据一致。
3. 更新 `OptionPresetKeys` 和 BFF option definitions，保证 enable 和邮箱后缀可匿名读取，平台 JSON 不公开读取。
4. 补齐 BFF `REDIS_URL` 到 `cache.redisUrl` 的配置映射。
5. 实现 BFF 注册验证码和注册提交的 OpenAPI REST 与 GraphQL 双入口，再接入 `pomelo-login` 注册页面。
6. 实现 BFF 第三方登录 start/complete 的 OpenAPI REST 与 GraphQL 双入口和 provider adapters，再接入 `pomelo-login` 登录页按钮与 callback 页面。
7. 执行 BFF、infrastructure-service、pomelo-login 的单元测试、typecheck 和构建验证。

回滚时可关闭所有 `auth-*-enable` 和 `auth-register-enable`，保留 options 数据不影响现有本地登录。若需要代码回滚，删除前端入口和 BFF 新接口即可，migration 插入的默认 option 可保留。

## Open Questions

暂无。
