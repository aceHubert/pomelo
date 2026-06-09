## MODIFIED Requirements

### Requirement: 主 pomelo 镜像必须内置 nginx 作为 Web 静态入口
主 `pomelo` 镜像 MUST 内置 nginx 服务 Web 构建产物和 content 静态文件，并 MUST 使用 nginx `try_files` 处理 SPA 刷新路由。

#### Scenario: Web SPA fallback
- **WHEN** 用户访问 `/admin/*`、`/initialize/*`、`/auth/*`、`/login/*` 或普通前台路由
- **THEN** nginx 必须返回对应入口 HTML 或 `index.html`
- **AND** `/initialize/*` 必须从独立 `/app/clients/initialize` 目录返回初始化应用 `index.html`
- **AND** `/auth/*` 必须从独立 `/app/clients/auth` 目录返回登录应用 `index.html`
- **AND** `/auth/*` 必须支持登录应用 history 路由刷新
- **AND** `/auth/*` 必须作为 `pomelo-login` 的 canonical 登录入口
- **AND** `/login/*` 必须作为 `pomelo-login` 的兼容 alias

#### Scenario: Content 静态文件
- **WHEN** 用户访问 `/uploads/*`、`/languages/*`、`/themes/*` 或 `/plugins/*`
- **THEN** nginx 必须从 `/app/content` 下返回对应静态文件
