# infrastructure-service 初始化 SQL

这些 SQL 只用于人工初始化或历史库兼容，不会被 Umzug 或服务启动流程自动执行。

## migration meta 表手动兼容

- 全新环境不要执行 `migration_meta.sql`，应使用服务启动参数 `--sync` 正常创建表。
- 历史库已有全部表但缺少 `sequelize_meta` 时，可以人工执行 `migration_meta.sql`。
- 执行前必须确认业务表结构与当前模型一致，否则后续迁移状态会失真。
- 执行后再使用 `--sync` 启动服务，Umzug 会跳过已记录的建表 migrations。
