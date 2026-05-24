## ADDED Requirements

### Requirement: 服务必须使用 Umzug 管理数据库结构
`identity-server` 和 `infrastructure-service` SHALL 使用 Umzug 管理数据库结构初始化和升级，migration 执行历史 MUST 记录在数据库中的服务隔离 meta 表里，不得再依赖 `db.lock` 判断结构状态。

#### Scenario: 新数据库执行结构初始化
- **WHEN** 服务连接到没有业务表的新数据库并以 `--sync` 启动
- **THEN** 系统必须执行该服务的 pending migrations 并创建所需业务表和 migration meta 表

#### Scenario: 已有 migration 历史的数据库启动
- **WHEN** 数据库中已存在该服务的 migration meta 记录
- **THEN** 系统必须只执行尚未记录的 pending migrations

#### Scenario: 不再读取 db.lock
- **WHEN** 服务启动检查数据库结构状态
- **THEN** 系统不得读取或写入 `db.lock`

### Requirement: `--sync` 必须控制 pending migrations 执行
服务启动时 MUST 检查 pending migrations。带 `--sync` 时 MUST 执行 pending migrations；未带 `--sync` 时如果存在 pending migrations，MUST 输出 warning 并继续启动。

#### Scenario: 带 sync 启动执行升级
- **WHEN** 服务启动参数包含 `--sync` 且存在 pending migrations
- **THEN** 系统必须在完成 migrations 后继续启动服务

#### Scenario: 未带 sync 启动只提示
- **WHEN** 服务启动参数不包含 `--sync` 且存在 pending migrations
- **THEN** 系统必须输出 warning 并继续启动，不得自动执行 pending migrations

#### Scenario: 未带 sync 且无 pending migrations
- **WHEN** 服务启动参数不包含 `--sync` 且不存在 pending migrations
- **THEN** 系统必须正常启动且不得输出 pending migration warning

### Requirement: 初始化账号不得生成数据库结构
`infrastructure-service` 的管理员初始化账号流程 MUST 只插入初始化业务数据，不得负责建表、升级表或写入结构初始化状态。

#### Scenario: 初始化账号前结构已同步
- **WHEN** 管理员初始化账号接口被调用
- **THEN** 系统必须只创建管理员账号和必要业务数据，不得执行 schema sync 或 migration

#### Scenario: 未同步结构时调用初始化账号
- **WHEN** 数据库结构尚未创建且管理员初始化账号接口被调用
- **THEN** 系统必须返回数据库结构不可用的错误，不得尝试隐式建表

### Requirement: Review 必须支持本地删表验证 sync
在 review 阶段，系统 MUST 允许基于本地开发数据库删除相关业务表和 migration meta 表后，通过 `--sync` 验证结构完整重建。

#### Scenario: 本地删除表后验证 sync
- **WHEN** review 人员在本地数据库删除相关表和 migration meta 表后以 `--sync` 启动服务
- **THEN** 系统必须重建该服务所需数据库结构

#### Scenario: Review 删除表不适用于生产
- **WHEN** review 文档描述删除表验证流程
- **THEN** 系统必须明确该流程仅适用于本地开发数据库

### Requirement: Review 必须先验证 Web 初始化账号再恢复数据
在 review 阶段，`infrastructure-service` 结构重建后 MUST 先通过 Web 初始化流程创建账号 `admin`、密码 `Aa123456`，并在该账号验证通过后再执行 SQL 恢复现有数据。

#### Scenario: Web 初始化账号验证通过
- **WHEN** review 人员完成 `infrastructure-service --sync` 结构重建后通过 Web 初始化账号 `admin`、密码 `Aa123456`
- **THEN** 系统必须允许使用该账号完成登录或初始化验证

#### Scenario: 验证通过后恢复现有数据
- **WHEN** `admin` / `Aa123456` 已通过 Web 初始化验证
- **THEN** review 人员才能执行已导出的 SQL 恢复现有数据
