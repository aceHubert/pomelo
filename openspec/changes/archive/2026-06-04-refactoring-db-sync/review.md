## 本地 Review 验收说明

本文件只适用于本地开发数据库。不得在生产、预发布或共享测试库中按此流程删表。

## 1. 删除范围

Review 人员在执行删表验收前，必须确认数据库连接指向本机 MySQL，例如：

```text
127.0.0.1:3306
```

`identity-server` 本地结构重建验收可删除以下表：

```text
identity_sequelize_meta
po_api_claims
po_api_properties
po_api_resources
po_api_scope_claims
po_api_scopes
po_api_secrets
po_client_claims
po_client_cors_origins
po_client_grant_types
po_client_id_prestrictions
po_client_post_logout_redirect_uris
po_client_properties
po_client_redirect_uris
po_client_scopes
po_client_secrets
po_clients
po_identity_claims
po_identity_properties
po_identity_resources
```

`infrastructure-service` 本地结构重建验收可删除以下表：

```text
infrastructure_sequelize_meta
po_commentmeta
po_comments
po_links
po_mediameta
po_medias
po_options
po_templatemeta
po_templates
po_term_relationships
po_term_taxonomy
po_term_taxonomymeta
po_users
po_usermeta
```

## 2. 执行顺序

1. 确认已备份或已导出现有数据。
2. 删除本地相关业务表和对应 migration meta 表。
3. 使用 `--sync` 启动 `identity-server`，验证 OIDC 结构表和 `identity_sequelize_meta` 被重建。
4. 使用 `--sync` 启动 `infrastructure-service`，验证业务结构表和 `infrastructure_sequelize_meta` 被重建。
5. 通过 Web 初始化流程创建账号 `admin`，密码 `Aa123456`。
6. 验证 `admin` / `Aa123456` 可以完成登录或初始化校验。
7. 验证通过后，再人工执行已导出的 SQL 恢复现有数据。

## 3. SQL 恢复约束

恢复 SQL 时必须跳过：

```text
po_users.sql
po_usermeta.sql
```

原因：账号表结构已由人工处理，direct-db account provider 严格依赖默认 `users` / `usermeta` 结构；review 恢复现有业务数据时不得覆盖这两张表。

`po_options.sql` 必须使用可重复恢复语义。当前仓库中的恢复文件已经改为 `REPLACE INTO`，用于覆盖 Web 初始化阶段预写入的默认 options，避免因 `option_name` 唯一键冲突导致恢复中断。

`identity-server/sqls` 中的 SQL 只用于人工恢复 OIDC 初始化数据，不会被 Umzug 自动执行。
