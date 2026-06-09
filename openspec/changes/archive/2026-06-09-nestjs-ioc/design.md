## Context

`infrastructure-bff` 是 NestJS 聚合层，当前在 `AppModule` 中静态装配 Config、Log4js、I18n、微服务 Client、鉴权、RAM 授权、GraphQL 以及业务模块。仓库内已有 `plugins/obs`、`plugins/submodules` 这类 Nest DynamicModule 风格插件包，`AppModule` 中也保留了静态接入注释。

运行时扩展资源的事实源应落在 `content` 目录：

```text
content/
├── plugins/
│   └── <plugin-id>/
│       ├── manifest.json
│       └── server entry / assets
└── themes/
    └── <theme-id>/
        ├── manifest.json
        └── theme assets / optional server entry
```

启用状态的事实源应落在 options 表：

- `active_plugins`：当前启用的插件列表。
- `uninstall_plugins`：已卸载或待清理插件列表。
- `template`：当前主题模板。
- `stylesheet`：当前主题样式。

NestJS 的 Controller、Resolver、Provider 需要在应用模块图构建时进入 IoC 容器和路由表，因此启用/停用包含后端模块的扩展后必须重启 BFF。当前部署使用 PM2 `autorestart` 管理 `infrastructure-bff`，可以作为 WebUI 触发重启后的进程守护。

## Goals / Non-Goals

**Goals:**

- 从 `content/plugins` 和 `content/themes` 发现运行时扩展资源。
- 按 options 表中的启用配置，在 BFF 启动期加载启用扩展的 Nest DynamicModule。
- 允许 WebUI 更新插件/主题启用状态，并获得是否需要重启的明确响应。
- 提供受权限保护的 BFF 重启 API，重启由外部进程管理器拉起。
- 提供轻量心跳 API，让 WebUI 使用 `bootId` 和启用摘要确认新进程已启动并应用目标配置。
- 保持宿主 Config、日志、鉴权、GraphQL、ClientProxy 等能力可被插件模块通过 Nest IoC 使用。

**Non-Goals:**

- 不做运行时热插拔，不在进程运行中动态新增或移除 Nest Controller/Resolver 路由。
- 不执行不可信用户脚本，不以 `vm` 沙箱作为第一版插件机制。
- 不在 BFF 进程内自行拉起已退出的 Node 进程；重启恢复依赖 PM2、容器或 systemd。
- 不改变现有业务模块的领域逻辑。

## Decisions

### 启动前构建运行时 AppModule

在 `NestFactory.create()` 前读取必要配置、发现扩展并构建包含插件 imports 的运行时根模块。这样启用插件的 Controller、Resolver、Provider 会进入 NestJS 正常扫描流程。

备选方案是启动后使用 `LazyModuleLoader`，但它无法自然注册 Controller 路由和 GraphQL schema，不满足当前插件需求。

### options 表作为启用状态事实源

插件目录只表达“已安装”，是否启用以 options 表为准。`active_plugins` 控制 `content/plugins` 中启用的插件，`template`/`stylesheet` 控制当前主题。BFF 的目录扫描结果和 options 状态需要合并成统一扩展状态返回给 WebUI。

备选方案是从 manifest 中读取启用状态，但这样会让文件系统和数据库出现双写冲突，不适合管理端操作。

### 插件 manifest 约定

每个扩展目录需要提供 manifest，至少包含扩展 ID、类型、版本、入口、是否包含服务端模块、配置元信息。服务端入口应导出 Nest DynamicModule 或可返回 DynamicModule 的工厂。

宿主只加载启用且 manifest 合法的服务端模块。纯主题资源可以被列出和切换，但不必进入 Nest IoC。

### 插件依赖共享宿主 NestJS

插件包应将 `@nestjs/common`、`@nestjs/core`、`@nestjs/graphql`、`@ace-pomelo/shared` 等作为 peer dependencies 或外部依赖，避免装饰器 metadata、DI token 和 GraphQL 类型来自多份 Nest 包。

备选方案是插件自带完整依赖，但会增加注入失败和装饰器失效风险。

### 插件加载失败不阻断 BFF 就绪

启用插件导入失败时，BFF 应记录失败信息并继续启动核心能力，心跳中返回 failed plugins。这样 WebUI 可以在重启后展示失败原因，避免坏插件导致管理入口完全不可达。

备选方案是启用插件失败即启动失败，契约更严格，但会让一次错误插件更新把 BFF 卡死在重启循环。

### 重启 API 只负责优雅退出

`POST /api/system/restart` 先返回成功响应，再延迟发送 `SIGTERM` 给当前进程。BFF 已通过共享 bootstrap 启用 shutdown hooks，外部进程守护负责重新拉起。

备选方案是在接口里执行 `pm2 restart`，但这会绑定 PM2 并提高命令注入与权限风险。

### 心跳独立于完整健康检查

新增轻量心跳接口返回当前进程的 `bootId`、`startedAt`、`ready`、`activePluginsHash`、`loadedPlugins`、`failedPlugins`。WebUI 不使用现有 `/health` 判断重启成功，因为完整健康检查可能依赖下游服务或外网。

## Risks / Trade-offs

- [Risk] 启动前读取 options 表可能依赖 `infrastructure-service` 未就绪。→ Mitigation: 加载器需要有超时和默认空插件策略；读取失败时启动核心 BFF 并在心跳中暴露配置读取失败。
- [Risk] 插件入口产物不统一会导致加载失败。→ Mitigation: manifest 明确入口路径和模块导出名，实施前统一现有插件构建产物约定。
- [Risk] 恶意插件拥有宿主进程权限。→ Mitigation: 第一版仅支持受信任插件；上传、安装、启用接口必须受管理员/RAM 权限保护。
- [Risk] WebUI 轮询可能误判旧进程仍在响应。→ Mitigation: 轮询必须比较重启前后的 `bootId`，不能只看 HTTP 200。
- [Risk] 坏插件会被跳过但 options 仍显示启用。→ Mitigation: 扩展状态接口同时返回 configured、loaded、failed 三类状态，WebUI 明确提示“已配置但加载失败”。
- [Risk] 多实例部署时重启单个进程不足以让全部实例生效。→ Mitigation: 第一版以单实例/PM2 进程为目标，多实例需要后续接入编排平台滚动重启。

## Migration Plan

1. 定义运行时扩展 manifest 和插件入口约定。
2. 让 BFF 在启动期扫描 `content/plugins`、`content/themes`，并读取 options 启用状态。
3. 引入运行时根模块构建流程，将启用插件模块并入 Nest imports。
4. 增加扩展管理 API、系统重启 API 和心跳 API。
5. 更新 WebUI 插件管理流程：保存配置后根据响应触发重启和心跳轮询。
6. 迁移现有 `plugins/obs`、`plugins/submodules` 到统一 manifest/入口产物约定。

回滚策略：保留插件加载开关，关闭后 BFF 忽略 `content/plugins` 的服务端模块，仅保留核心模块启动；WebUI 可提示插件功能暂不可用。

## Open Questions

- 插件 manifest 的精确文件名和字段是否固定为 `manifest.json`，还是兼容 `package.json` 中的 `pomelo` 字段？
- `active_plugins` 的值使用字符串数组，还是使用包含版本、入口、配置 hash 的对象数组？
- 主题是否允许携带服务端 Nest 模块；若允许，是否纳入 `active_plugins`，还是由 `template`/`stylesheet` 推导？
