## ADDED Requirements

### Requirement: 认证 options 默认数据必须通过 migration 升级
`infrastructure-service` SHALL 提供 migration，为已有数据库补齐注册和第三方登录所需的默认 options。migration MUST 保持幂等，不得覆盖已存在的管理员配置。

#### Scenario: 老数据库执行认证 options migration
- **WHEN** 老数据库缺少认证相关 options 且 `infrastructure-service` 以 `--sync` 执行 pending migrations
- **THEN** 系统 SHALL 插入 `auth-register-enable`、`auth-register-email-suffixes`、`auth-register-email-template`、`auth-google-enable`、`auth-google`、`auth-github-enable`、`auth-github`、`auth-linuxdo-enable` 和 `auth-linuxdo`

#### Scenario: 已存在 option 不被覆盖
- **WHEN** 老数据库已存在某个认证相关 option 且执行认证 options migration
- **THEN** 系统 MUST 保留该 option 的现有 optionValue

#### Scenario: 默认认证 options 全部关闭
- **WHEN** 认证 options migration 插入默认数据
- **THEN** `auth-register-enable`、`auth-google-enable`、`auth-github-enable` 和 `auth-linuxdo-enable` SHALL 为 `"0"`
- **AND** `auth-register-email-suffixes` SHALL 为空字符串
- **AND** `auth-register-email-template` SHALL 为合法 JSON 字符串
- **AND** `auth-google`、`auth-github` 和 `auth-linuxdo` SHALL 为 `"{}"`

### Requirement: 站点初始化必须写入认证 options 默认数据
`infrastructure-service` 的站点初始化流程 SHALL 写入与认证 options migration 相同的默认 options，确保新数据库和升级数据库的认证默认行为一致。

#### Scenario: 新站点初始化写入认证 options
- **WHEN** 管理员执行站点初始化
- **THEN** 初始化流程 SHALL 创建注册和第三方登录相关默认 options

#### Scenario: 新站点默认禁用注册和第三方登录
- **WHEN** 站点初始化完成且管理员未修改认证 options
- **THEN** 注册入口 SHALL 默认关闭
- **AND** Google、GitHub 和 Linux.do 第三方登录 SHALL 默认关闭
