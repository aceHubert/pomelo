## ADDED Requirements

### Requirement: 登录页必须展示启用的第三方登录按钮
`pomelo-login` SHALL 使用 `autoloadOptions` 中的 `auth-google-enable`、`auth-github-enable` 和 `auth-linuxdo-enable` 控制第三方登录按钮展示。

#### Scenario: 至少一个第三方平台启用
- **WHEN** 用户打开 `/login` 且至少一个 `auth-*-enable` 为 `"1"`
- **THEN** 登录按钮下方 SHALL 展示 `-- or --` 分隔线
- **AND** 登录页 SHALL 展示对应启用平台的第三方登录按钮

#### Scenario: 没有第三方平台启用
- **WHEN** 用户打开 `/login` 且所有 `auth-*-enable` 都不为 `"1"`
- **THEN** 登录页 MUST NOT 展示 `-- or --` 分隔线
- **AND** 登录页 MUST NOT 展示第三方登录按钮

### Requirement: 第三方授权地址必须点击按钮后由 BFF 生成
第三方登录按钮点击后，`pomelo-login` SHALL 调用 BFF start 接口获取授权跳转地址，MUST NOT 在前端直接拼接第三方授权 URL。

#### Scenario: 点击 Google 登录按钮
- **WHEN** 用户点击 Google 登录按钮
- **THEN** `pomelo-login` SHALL 调用 BFF start 接口并传入 provider 和当前 `returnUrl`
- **AND** BFF SHALL 返回第三方授权跳转地址
- **AND** `pomelo-login` SHALL 将浏览器跳转到该地址

#### Scenario: 平台未启用时点击登录
- **WHEN** 客户端调用 BFF start 接口且对应 `auth-*-enable` 不为 `"1"`
- **THEN** BFF MUST 拒绝生成授权地址

### Requirement: 第三方登录必须使用固定 OAuth 回调路由
`pomelo-login` MUST 提供 `/oauth/:provider/callback` 回调路由。生产环境完整路径 SHALL 位于 `/auth/oauth/:provider/callback`。

#### Scenario: Google 回调
- **WHEN** 第三方平台回跳到 `/auth/oauth/google/callback?code=...&state=...`
- **THEN** `pomelo-login` SHALL 展示回调处理状态
- **AND** SHALL 调用 BFF complete 接口完成登录

#### Scenario: 回调完成后跳转来源页面
- **WHEN** BFF complete 接口返回登录 token
- **THEN** `pomelo-login` SHALL 写入 `access-token`
- **AND** SHALL 跳转到 OAuth state 中保存的 `returnUrl`

### Requirement: BFF 必须保护 OAuth state 和 PKCE
BFF start 接口 SHALL 生成 OAuth state，并将 provider、returnUrl、PKCE 信息和过期时间写入 BFF cache。BFF complete 接口 MUST 校验 state 并确保 state 只能使用一次。

#### Scenario: state 有效
- **WHEN** BFF complete 接口收到有效且未过期的 state
- **THEN** BFF SHALL 使用该 state 对应的 provider 和 PKCE 信息完成 token exchange
- **AND** BFF SHALL 删除该 state

#### Scenario: state 无效
- **WHEN** BFF complete 接口收到不存在、过期或 provider 不匹配的 state
- **THEN** BFF MUST 拒绝登录并不得签发本地 token

### Requirement: 系统必须支持 Google、GitHub 和 Linux.do
BFF SHALL 支持 Google、GitHub 和 Linux.do 三种第三方登录 provider。Google 和 Linux.do SHALL 支持 OIDC discovery；GitHub SHALL 使用 OAuth2 token endpoint 和 GitHub user/email API。

#### Scenario: Google OIDC 登录
- **WHEN** provider 为 `google`
- **THEN** BFF SHALL 使用 `auth-google` 配置和 Google OIDC endpoint 完成登录

#### Scenario: Linux.do OIDC 登录
- **WHEN** provider 为 `linuxdo`
- **THEN** BFF SHALL 使用 `auth-linuxdo` 配置和 Linux.do OIDC endpoint 完成登录

#### Scenario: GitHub OAuth 登录
- **WHEN** provider 为 `github`
- **THEN** BFF SHALL 使用 `auth-github` 配置完成 GitHub OAuth token exchange 并读取 GitHub 用户信息

### Requirement: 第三方登录成功必须创建或绑定本地用户
第三方登录成功后，BFF SHALL 按 provider 和平台 subject 查找本地绑定用户；不存在绑定时 SHALL 自动创建本地用户并保存绑定元数据。

#### Scenario: 已存在绑定用户
- **WHEN** 第三方 userinfo 的 provider subject 已存在于用户元数据
- **THEN** BFF SHALL 使用该用户签发本地登录 token

#### Scenario: 不存在绑定用户
- **WHEN** 第三方 userinfo 的 provider subject 不存在于用户元数据
- **THEN** BFF SHALL 创建一个启用状态的本地用户
- **AND** 新用户登录名 SHALL 使用平台前缀和稳定标识生成
- **AND** 新用户密码 SHALL 为空字符串
- **AND** BFF SHALL 保存 provider subject 和 profile 快照到用户元数据

#### Scenario: 空字符串密码不能本地登录
- **WHEN** 第三方自动创建用户的 `loginPwd` 为空字符串
- **THEN** 用户 MUST NOT 能通过本地账号密码登录接口直接登录该账号

### Requirement: 第三方 email 冲突不得自动接管账号
当第三方返回的 email 已属于其他本地用户时，系统 MUST NOT 自动把第三方身份绑定到该已有用户。

#### Scenario: 第三方 email 已存在
- **WHEN** 第三方 userinfo 返回的 email 已被其他用户使用
- **THEN** BFF MUST NOT 自动绑定该已有用户
- **AND** BFF SHALL 拒绝登录并提示联系管理员
