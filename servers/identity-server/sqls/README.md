# identity-server 初始化 SQL

这些 SQL 只用于人工初始化或 review 恢复数据，不会被 Umzug 或服务启动流程自动执行。

执行前需要按部署环境确认：

- redirect URI、silent redirect URI、post logout redirect URI 是否与实际 Web 访问地址一致。
- CORS origin 是否与实际 Web 访问域名一致。
- `client_secrets.value` 是当前数据库中的摘要值，不包含明文 secret；明文 secret 需由部署人员单独管理。
- review 恢复数据时不得执行 `po_users.sql` 和 `po_usermeta.sql`。

建议执行顺序：

1. `po_identity_resources.sql`
2. `po_identity_claims.sql`
3. `po_clients.sql`
4. `po_client_scopes.sql`
5. `po_client_grant_types.sql`
6. `po_client_redirect_uris.sql`
7. `po_client_post_logout_redirect_uris.sql`
8. `po_client_cors_origins.sql`
9. `po_client_secrets.sql`
