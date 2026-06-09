## Why

当前 `infrastructure-bff` 已有 NestJS DynamicModule 风格的插件包和 `active_plugins` 等配置项，但缺少统一的运行时扩展加载方案。需要把 `content/plugins`、`content/themes` 与 options 表中的启用状态串起来，让 WebUI 修改插件状态后可以通过受控重启让 NestJS IoC、Controller、Resolver 和 Provider 正确生效。

## What Changes

- 新增 BFF 启动期插件加载机制：从 `content/plugins` 扫描插件目录，并按 options 表中的 `active_plugins` 决定是否导入插件模块。
- 明确 `content/themes` 与 options 表中 `template`、`stylesheet` 的关系，保留主题目录作为主题资源事实源。
- 新增插件/主题运行时扩展管理接口，用于读取目录状态、更新启用配置，并返回是否需要重启。
- 新增系统重启接口：WebUI 触发后端优雅停机，由 PM2 等进程管理器重新拉起 BFF。
- 新增轻量心跳接口：返回 `bootId`、`ready`、启用插件摘要等信息，供 WebUI 判断新进程是否已启动成功。
- WebUI 在插件启用/停用/卸载后进入重启等待状态，通过心跳轮询确认重启成功后刷新页面。
- 不做运行时热插拔；Nest Controller、Resolver、Provider 的启停均以重启后生效为边界。

## Capabilities

### New Capabilities

- `runtime-extension-management`: 管理 `content/plugins`、`content/themes` 中的扩展资源，按 options 表配置启用插件，并支持 WebUI 触发 BFF 重启后通过心跳确认新进程已生效。

### Modified Capabilities

- 无。

## Impact

- 影响 `servers/infrastructure-bff` 的启动流程、模块装配、系统管理 API、健康/心跳接口和插件加载边界。
- 影响 `clients/web` 管理端插件操作流程：插件配置更新后需要进入重启轮询并在成功后刷新页面。
- 影响部署约定：`content/plugins`、`content/themes` 必须作为运行时持久目录存在；BFF 重启依赖 PM2、容器或 systemd 等外部进程守护。
- 影响插件包约定：后端插件需要提供可被宿主加载的 manifest 和 Nest DynamicModule 入口，并共享宿主的 NestJS peer dependencies。
