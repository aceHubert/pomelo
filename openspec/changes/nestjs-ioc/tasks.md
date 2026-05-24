## 1. 扩展契约与启动上下文

- [x] 1.1 定义运行时扩展 manifest 类型，覆盖扩展 ID、类型、版本、入口、导出名、是否包含服务端模块和配置摘要字段
- [x] 1.2 定义插件加载状态模型，区分 installed、configured、loaded、failed 和 uninstall-pending 状态
- [x] 1.3 定义 BFF 进程启动上下文，生成 `bootId`、`startedAt`，并保存启用插件摘要和加载失败信息
- [x] 1.4 明确 `active_plugins`、`uninstall_plugins`、`template`、`stylesheet` 的解析格式和默认值策略

## 2. BFF 启动期扩展加载

- [x] 2.1 实现 `content/plugins` 和 `content/themes` 目录扫描，读取并校验每个扩展的 manifest
- [x] 2.2 在 Nest 应用创建前读取 options 表中的扩展启用配置，并提供读取超时和失败降级
- [x] 2.3 实现服务端插件入口导入逻辑，支持从 manifest 指定入口解析 Nest DynamicModule 或模块工厂
- [x] 2.4 构造运行时根模块，将启用且加载成功的插件模块加入 Nest imports
- [x] 2.5 捕获插件加载异常，确保核心 BFF 继续启动并记录 failed plugins

## 3. BFF 管理 API

- [x] 3.1 新增扩展状态查询 API，返回目录发现、options 配置、实际加载和失败原因的合并视图
- [x] 3.2 新增插件启用、停用、卸载配置更新 API，写入 options 表并返回 `restartRequired`
- [x] 3.3 新增轻量心跳 API，返回 `bootId`、`startedAt`、`ready`、`activePluginsHash`、`loadedPlugins`、`failedPlugins`
- [x] 3.4 新增受权限保护的 BFF 重启 API，先返回成功响应，再延迟发送 `SIGTERM`
- [x] 3.5 为扩展管理和重启 API 接入现有鉴权与 RAM 权限动作

## 4. WebUI 重启流程

- [x] 4.1 新增管理端扩展状态请求封装，支持读取插件、主题和加载失败信息
- [x] 4.2 在插件启用、停用、卸载操作后，根据 `restartRequired` 触发重启流程
- [x] 4.3 实现心跳轮询工具，包含首次等待、轮询间隔、单次请求超时、总超时和网络错误容忍
- [x] 4.4 使用重启前后的 `bootId` 判断新进程是否已启动，成功后刷新 WebUI
- [x] 4.5 在轮询超时或插件加载失败时展示明确错误提示

## 5. 现有插件与部署约定

- [x] 5.1 为现有 `obs` 插件补齐统一 manifest 和服务端入口约定
- [x] 5.2 为现有 `submodules` 插件补齐统一 manifest 和服务端入口约定
- [x] 5.3 统一插件构建产物路径，确保运行时 manifest 指向的入口文件真实存在
- [x] 5.4 更新部署配置，确保 `content/plugins` 和 `content/themes` 作为运行时持久目录存在
- [x] 5.5 更新示例配置或说明，标明插件变更通过 options 表启用并需要重启生效

## 6. 验证

- [x] 6.1 为 manifest 校验、目录扫描和启用状态合并添加单元测试
- [x] 6.2 为插件加载成功、未启用跳过、加载失败降级添加单元测试
- [x] 6.3 为心跳和重启 API 添加控制器/服务测试，覆盖权限拒绝和先响应后退出逻辑
- [x] 6.4 为 WebUI 心跳轮询添加单元测试，覆盖成功、网络错误重试和超时
- [x] 6.5 编写一个测试插件放入 `content/plugins`，验证启用后插件 Controller 路由可被 BFF 正确注册和访问
- [x] 6.6 运行 BFF 相关测试和前端相关测试，确认核心启动路径不受未启用插件影响
