## ADDED Requirements

### Requirement: 主 pomelo 镜像必须内置 nginx 作为 Web 静态入口
主 `pomelo` 镜像 MUST 内置 nginx 服务 Web 构建产物和 content 静态文件，并 MUST 使用 nginx `try_files` 处理 SPA 刷新路由。

#### Scenario: Web SPA fallback
- **WHEN** 用户访问 `/admin/*`、`/login/*`、`/initialize/*` 或普通前台路由
- **THEN** nginx 必须返回对应入口 HTML 或 `index.html`

#### Scenario: Content 静态文件
- **WHEN** 用户访问 `/uploads/*`、`/languages/*`、`/themes/*` 或 `/plugins/*`
- **THEN** nginx 必须从 `/app/content` 下返回对应静态文件

### Requirement: PM2 必须继续管理主镜像进程
主 `pomelo` 镜像 MUST 保留 PM2 管理 `infrastructure-service`、`infrastructure-bff` 和 nginx，不得用自定义 entrypoint 替代 PM2 的进程生命周期管理。

#### Scenario: PM2 管理 nginx
- **WHEN** 主 `pomelo` 镜像启动
- **THEN** PM2 必须启动 nginx，并不再启动 Web/static `serve` 进程

### Requirement: 主 pomelo 镜像端口必须固定
主 `pomelo` 镜像 MUST 暴露 Web `80` 和服务端口 `3000`、`3001`、`3002`。

#### Scenario: 主镜像内部端口
- **WHEN** 主 `pomelo` 镜像启动
- **THEN** nginx 必须监听 `80`
- **AND** `infrastructure-service` HTTP 必须监听 `3000`
- **AND** `infrastructure-service` TCP 必须监听 `3001`
- **AND** `infrastructure-bff` HTTP 必须监听 `3002`

### Requirement: 主镜像 nginx 不负责后端反向代理
主 `pomelo` 镜像内置 nginx MUST NOT 代理 `/action/` 或 `/connect/`，后端和 OIDC 入口 MUST 由部署层或运行时 options 使用独立地址配置。

#### Scenario: Compose 不再包含独立 nginx 服务
- **WHEN** 使用 example Compose 部署
- **THEN** Compose 不得再声明独立 nginx 服务，宿主机可直接访问 `pomelo-server` 的 Web 端口
