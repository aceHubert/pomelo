## ADDED Requirements

### Requirement: 系统必须提供认证相关默认 options
系统 SHALL 在 `options` 表中提供注册和第三方登录相关默认 option，所有 optionValue MUST 为字符串。

#### Scenario: 默认注册 options
- **WHEN** 系统初始化或执行认证 options migration
- **THEN** `auth-register-enable` SHALL 默认为 `"0"`
- **AND** `auth-register-email-suffixes` SHALL 默认为空字符串
- **AND** `auth-register-email-template` SHALL 默认为合法 JSON 字符串

#### Scenario: 默认第三方 options
- **WHEN** 系统初始化或执行认证 options migration
- **THEN** `auth-google-enable`、`auth-github-enable` 和 `auth-linuxdo-enable` SHALL 默认为 `"0"`
- **AND** `auth-google`、`auth-github` 和 `auth-linuxdo` SHALL 默认为 `"{}"`

### Requirement: 认证 option keys 必须统一定义为预设常量
所有新增认证 option key MUST 定义在 `OptionPresetKeys` 中。BFF option definitions、站点初始化默认数据、migration 和认证服务逻辑 SHALL 引用 `OptionPresetKeys`，不得散落硬编码字符串作为权威定义。

#### Scenario: 新增认证 option 常量
- **WHEN** 实现新增注册和第三方登录 options
- **THEN** `OptionPresetKeys` SHALL 包含 `auth-register-enable`、`auth-register-email-suffixes`、`auth-register-email-template`、`auth-google-enable`、`auth-google`、`auth-github-enable`、`auth-github`、`auth-linuxdo-enable` 和 `auth-linuxdo`

#### Scenario: 使用认证 option key
- **WHEN** BFF、站点初始化或 migration 读写新增认证 options
- **THEN** 实现 SHALL 从 `OptionPresetKeys` 引用对应 key

### Requirement: 认证 enable options 必须匿名可读取
`auth-register-enable`、`auth-google-enable`、`auth-github-enable` 和 `auth-linuxdo-enable` SHALL 允许匿名用户通过 `autoloadOptions` 读取，并且只允许管理员修改。

#### Scenario: 匿名读取 enable options
- **WHEN** 未登录用户查询 `autoloadOptions`
- **THEN** 响应 SHALL 包含 autoload 的认证 enable options

#### Scenario: 非管理员修改 enable options
- **WHEN** 非管理员用户尝试修改认证 enable option
- **THEN** 系统 MUST 拒绝修改

### Requirement: 注册邮箱后缀 option 必须匿名可读取
`auth-register-email-suffixes` SHALL 允许匿名用户通过 `autoloadOptions` 读取，并且只允许管理员修改。

#### Scenario: 匿名读取邮箱后缀
- **WHEN** 未登录用户查询 `autoloadOptions`
- **THEN** 响应 SHALL 包含 `auth-register-email-suffixes`

#### Scenario: 非管理员修改邮箱后缀
- **WHEN** 非管理员用户尝试修改 `auth-register-email-suffixes`
- **THEN** 系统 MUST 拒绝修改

### Requirement: 注册邮件模板 option 必须提供默认值
`auth-register-email-template` SHALL 存储注册验证码邮件模板，optionValue MUST 为 JSON 字符串，并且至少包含 `subject` 和 `text` 字段。系统 SHALL 提供可直接使用的默认模板。

#### Scenario: 默认注册邮件模板
- **WHEN** 系统初始化或执行认证 options migration
- **THEN** `auth-register-email-template` SHALL 被写入默认 JSON 字符串
- **AND** 默认模板 SHALL 支持 `code`、`email`、`expiresInMinutes` 和 `siteName` 变量

#### Scenario: 匿名读取 autoloadOptions
- **WHEN** 未登录用户查询 `autoloadOptions`
- **THEN** 响应 MUST NOT 包含 `auth-register-email-template`

#### Scenario: 管理员修改注册邮件模板
- **WHEN** 管理员写入 `auth-register-email-template`
- **THEN** 系统 SHALL 保存传入的 JSON 字符串

### Requirement: 平台 JSON options 不得公开泄露
`auth-google`、`auth-github` 和 `auth-linuxdo` SHALL 存储 JSON 字符串平台配置。由于配置包含 `clientSecret`，系统 MUST NOT 通过匿名读取接口、`autoloadOptions` 或普通公开 option 查询返回明文配置。

#### Scenario: 匿名读取 autoloadOptions
- **WHEN** 未登录用户查询 `autoloadOptions`
- **THEN** 响应 MUST NOT 包含 `auth-google`、`auth-github` 或 `auth-linuxdo` 明文配置

#### Scenario: 管理员写入平台配置
- **WHEN** 管理员写入 `auth-google`、`auth-github` 或 `auth-linuxdo`
- **THEN** 系统 SHALL 保存传入的 JSON 字符串

### Requirement: BFF 服务端必须可读取平台 JSON 配置
BFF 第三方登录服务 SHALL 能通过内部服务端路径读取 `auth-google`、`auth-github` 和 `auth-linuxdo` 的原始 optionValue，但该读取能力 MUST NOT 暴露给匿名或普通公开 API。

#### Scenario: 第三方登录读取平台配置
- **WHEN** BFF start 或 complete 接口处理已启用 provider
- **THEN** BFF SHALL 读取对应 `auth-*` JSON 配置并解析

#### Scenario: 平台配置 JSON 无效
- **WHEN** `auth-*` optionValue 不是合法 JSON 对象
- **THEN** BFF MUST 拒绝第三方登录并返回配置无效错误

### Requirement: 平台配置必须在启用时校验必需字段
当某个 `auth-*-enable` 为 `"1"` 时，BFF start 接口 MUST 校验对应 `auth-*` 平台配置具备完成登录所需字段。

#### Scenario: 启用平台缺少 clientId
- **WHEN** `auth-google-enable` 为 `"1"` 但 `auth-google` 缺少 `clientId`
- **THEN** BFF MUST 拒绝生成授权地址并返回配置不完整错误

#### Scenario: 启用平台缺少 clientSecret
- **WHEN** `auth-github-enable` 为 `"1"` 但 `auth-github` 缺少 `clientSecret`
- **THEN** BFF MUST 拒绝生成授权地址并返回配置不完整错误

### Requirement: BFF cache 必须支持 Redis 配置
BFF SHALL 通过现有 `AppCacheService` 保存验证码、OAuth state、PKCE 和一次性 ticket。系统 MUST 支持通过 `REDIS_URL` 配置 Redis，并映射为 BFF cache 使用的 Redis URL。

#### Scenario: 配置 REDIS_URL
- **WHEN** BFF 启动时配置了 `REDIS_URL`
- **THEN** `AppCacheService` SHALL 使用 Redis 作为缓存存储

#### Scenario: 未配置 REDIS_URL
- **WHEN** BFF 启动时未配置 `REDIS_URL`
- **THEN** `AppCacheService` SHALL 使用内存缓存作为开发环境 fallback

### Requirement: 服务接口必须校验 options 启用状态
注册和第三方登录相关 BFF 服务接口 MUST 使用 options 中的启用状态作为服务端授权条件。

#### Scenario: 注册接口校验启用状态
- **WHEN** 注册相关接口被调用
- **THEN** BFF MUST 校验 `auth-register-enable`

#### Scenario: 第三方接口校验启用状态
- **WHEN** 第三方 start 或 complete 接口被调用
- **THEN** BFF MUST 校验对应 `auth-*-enable`
