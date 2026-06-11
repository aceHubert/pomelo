## ADDED Requirements

### Requirement: 登录应用必须支持注册入口开关
`pomelo-login` SHALL 使用 `autoloadOptions` 中的 `auth-register-enable` 控制注册入口展示和注册页面可访问性。

#### Scenario: 注册开启时展示入口
- **WHEN** 匿名用户打开 `/login` 且 `autoloadOptions.auth-register-enable` 为 `"1"`
- **THEN** 登录页 SHALL 展示注册入口

#### Scenario: 注册关闭时隐藏入口
- **WHEN** 匿名用户打开 `/login` 且 `autoloadOptions.auth-register-enable` 不为 `"1"`
- **THEN** 登录页 MUST NOT 展示注册入口

#### Scenario: 注册关闭时禁止直接打开注册页
- **WHEN** 用户直接访问 `/register` 且 `auth-register-enable` 不为 `"1"`
- **THEN** `pomelo-login` SHALL 阻止展示注册表单并返回登录页或展示注册未开放状态

### Requirement: 注册接口必须校验注册开关
BFF 注册验证码发送接口和注册提交接口 MUST 在服务端校验 `auth-register-enable`，不得只依赖前端隐藏入口。

#### Scenario: 注册关闭时发送验证码
- **WHEN** 客户端调用发送注册邮箱验证码接口且 `auth-register-enable` 不为 `"1"`
- **THEN** BFF MUST 拒绝请求并返回注册未开放错误

#### Scenario: 注册关闭时提交注册
- **WHEN** 客户端调用注册提交接口且 `auth-register-enable` 不为 `"1"`
- **THEN** BFF MUST 拒绝请求并且不得创建用户

### Requirement: 注册必须使用邮箱验证码
系统 SHALL 支持通过邮箱发送验证码，并在注册提交时校验验证码后创建本地用户。

#### Scenario: 发送注册邮箱验证码
- **WHEN** 用户在注册页输入允许后缀的邮箱并请求验证码
- **THEN** BFF SHALL 生成短期验证码并通过邮箱发送给该邮箱
- **AND** BFF SHALL 将验证码状态写入 BFF cache

#### Scenario: 邮箱发送配置缺失
- **WHEN** 用户请求发送注册邮箱验证码且邮箱发送必需配置未完整设置
- **THEN** BFF MUST 拒绝发送验证码
- **AND** BFF SHALL 返回联系管理员配置邮箱发送服务的提示
- **AND** BFF MUST NOT 写入可用于注册的验证码状态

#### Scenario: 验证码正确时注册成功
- **WHEN** 用户提交邮箱、验证码、用户名和密码且验证码匹配未过期
- **THEN** BFF SHALL 创建启用状态的本地用户
- **AND** 新用户 SHALL 使用默认角色 option 配置的角色

#### Scenario: 验证码错误时注册失败
- **WHEN** 用户提交的验证码不存在、已过期或不匹配
- **THEN** BFF MUST 拒绝注册并且不得创建用户

### Requirement: 注册验证码邮件必须使用场景化邮件发送接口
BFF SHALL 提供内部邮件发送接口，并使用 `scene` 表示邮件场景。注册验证码邮件 MUST 使用注册验证码场景和注册邮件模板发送。

#### Scenario: 注册验证码邮件场景
- **WHEN** BFF 发送注册验证码邮件
- **THEN** BFF SHALL 调用邮件发送接口并传入 `register-email-code` scene
- **AND** 邮件发送接口 SHALL 使用注册验证码邮件模板渲染邮件内容

#### Scenario: 注册邮件模板变量
- **WHEN** 邮件发送接口渲染注册验证码邮件
- **THEN** 模板上下文 SHALL 包含 `code`、`email`、`expiresInMinutes` 和 `siteName`

### Requirement: 注册必须限制邮箱后缀
系统 MUST 使用 `auth-register-email-suffixes` 限制允许注册的邮箱后缀。该 option 为逗号分隔字符串，解析时 MUST trim、转小写、移除开头 `@` 并过滤空值。

#### Scenario: 邮箱后缀在白名单中
- **WHEN** `auth-register-email-suffixes` 为 `"company.com,linux.do"` 且用户邮箱为 `user@linux.do`
- **THEN** 系统 SHALL 允许继续发送验证码或提交注册

#### Scenario: 邮箱后缀不在白名单中
- **WHEN** `auth-register-email-suffixes` 为 `"company.com"` 且用户邮箱为 `user@example.com`
- **THEN** 系统 MUST 拒绝发送验证码和注册提交

#### Scenario: 邮箱后缀未配置
- **WHEN** `auth-register-email-suffixes` 为空字符串
- **THEN** 系统 MUST 拒绝发送验证码和注册提交，并提示管理员配置允许注册的邮箱后缀

### Requirement: 注册密码必须保持现有本地密码处理语义
`pomelo-login` 注册提交 MUST 对密码执行与本地登录一致的前端 SHA-256 处理，BFF 创建用户时 SHALL 按现有用户创建链路保存可用于本地登录校验的密码值。

#### Scenario: 注册密码哈希
- **WHEN** 用户提交注册表单
- **THEN** `pomelo-login` SHALL 在前端对密码执行 SHA-256 后提交给 BFF
- **AND** BFF SHALL 按现有用户密码持久化规则保存密码

### Requirement: 注册成功后必须使用现有 token 存储格式
注册成功后，系统 SHALL 返回与 `signIn` 兼容的 token 结果，`pomelo-login` MUST 按现有 `access-token` 格式写入 localStorage 或 sessionStorage。

#### Scenario: 注册成功后自动登录
- **WHEN** 注册提交成功并返回 token
- **THEN** `pomelo-login` SHALL 将 `access-token` 写入当前选择的存储位置
- **AND** 存储值 SHALL 包含 `token` 和 `type`
- **AND** 页面 SHALL 跳转到 `returnUrl` 或登录成功结果页
