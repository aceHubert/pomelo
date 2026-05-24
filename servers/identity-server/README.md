# @ace-pomelo/identity-server
> Pomelo OpenID Connect Identity Server

## OIDC 专用镜像

OIDC 专用镜像使用根目录 `Dockerfile.oidc` 构建，只运行 `identity-server` 一个应用：

```bash
docker build -f Dockerfile.oidc -t pomelo-oidc .
docker run --rm -p 3000:3000 \
  -e ACCOUNT_PROVIDER=direct-db \
  -e IDENTITY_DATABASE_CONNECTION=mysql://user:password@host:3306/po_template \
  pomelo-oidc
```

镜像默认命令为 `node dist/main.js --sync`，容器启动时会自动同步数据库结构。默认初始化数据仍需人工执行 `sqls/` 目录中的 SQL，且 review 恢复时不得执行 `po_users.sql` 和 `po_usermeta.sql`。
