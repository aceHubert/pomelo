# identity-server 初始化 SQL

这些 SQL 只用于人工初始化或 review 恢复数据，不会被 Umzug 或服务启动流程自动执行。

执行前需要按部署环境确认：

- redirect URI、silent redirect URI、post logout redirect URI 是否与实际 Web 访问地址一致。
- CORS origin 是否与实际 Web 访问域名一致。
- `client_secrets.value` 是当前数据库中的摘要值，不包含明文 secret；明文 secret 需由部署人员单独管理。
- SQL 文件中的表名仍保留 `po_` 前缀，执行前需要人工按目标环境替换。
- `migration_meta.sql` 只用于历史库手动写入 migration 记录，不包含 `po_` 表前缀替换。
- review 恢复数据时不得执行 `users.sql` 和 `usermeta.sql`。

## migration meta 表手动兼容

- 全新环境不要执行 `migration_meta.sql`，应使用服务启动参数 `--sync` 正常创建表。
- 历史库已有全部表但缺少 `sequelize_meta` 时，可以人工执行 `migration_meta.sql`。
- 执行前必须确认业务表结构与当前模型一致，否则后续迁移状态会失真。
- 执行后再使用 `--sync` 启动服务，Umzug 会跳过已记录的建表 migrations。

## user 表使用规范

- `users.sql` 和 `usermeta.sql` 只用于全新环境初始化默认管理员账号。
- 已有用户数据的环境不得重复执行，避免覆盖或冲突现有账号数据。
- 如需初始化默认管理员，应先执行 `users.sql`，再执行 `usermeta.sql`。
- 默认管理员初始密码为 `Aa123456`，初始化完成后必须立即修改密码。
- 生产环境建议按实际账号策略重新生成管理员密码摘要，不要长期保留初始化密码。

建议执行顺序：

1. `identity_resources.sql`
2. `identity_claims.sql`
3. `clients.sql`
4. `client_scopes.sql`
5. `client_grant_types.sql`
6. `client_redirect_uris.sql`
7. `client_post_logout_redirect_uris.sql`
8. `client_cors_origins.sql`
9. `client_secrets.sql`
