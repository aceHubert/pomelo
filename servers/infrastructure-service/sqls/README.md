# infrastructure-service 恢复 SQL

这些 SQL 是人工 review / 恢复现有数据使用的导出文件，服务启动和 Umzug 不会自动执行。

review 流程要求：

1. 先删除本地相关业务表和 migration meta 表。
2. 分别使用 `identity-server --sync` 和 `infrastructure-service --sync` 验证结构可重建。
3. 通过 Web 初始化 `admin` / `Aa123456`，并确认账号验证通过。
4. 再人工执行导出的恢复 SQL。
5. 恢复时明确跳过 `po_users.sql` 和 `po_usermeta.sql`。
6. `po_options.sql` 已调整为 `REPLACE INTO`，用于覆盖 Web 初始化阶段已写入的同名 option，避免恢复时因唯一键冲突中断。
