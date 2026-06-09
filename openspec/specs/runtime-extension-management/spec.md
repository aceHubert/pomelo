## Purpose

定义运行时扩展的目录发现、启用配置、NestJS IoC 加载、受控重启和 WebUI 等待体验。

## Requirements

### Requirement: 扩展目录发现
系统 SHALL 从运行时 `contentPath` 下的 `plugins` 和 `themes` 目录发现已安装扩展，并读取每个扩展目录中的 manifest 元数据。

#### Scenario: 发现插件和主题目录
- **WHEN** BFF 启动或 WebUI 请求扩展列表
- **THEN** 系统返回 `content/plugins` 和 `content/themes` 下 manifest 合法的扩展信息

#### Scenario: 忽略非法扩展目录
- **WHEN** 某个扩展目录缺少 manifest 或 manifest 格式无效
- **THEN** 系统 MUST 不加载该扩展，并在扩展状态中标记校验失败原因

### Requirement: options 表控制启用状态
系统 SHALL 使用 options 表作为扩展启用状态的事实源，其中 `active_plugins` 控制插件启用列表，`template` 和 `stylesheet` 控制当前主题选择，`uninstall_plugins` 标记已卸载或待清理插件。

#### Scenario: 合并目录和启用配置
- **WHEN** WebUI 查询扩展状态
- **THEN** 系统返回每个扩展的安装状态、配置启用状态、实际加载状态和失败原因

#### Scenario: 更新插件启用配置
- **WHEN** 管理员通过 WebUI 启用、停用或卸载插件
- **THEN** 系统 MUST 更新 options 表中的对应配置，并返回该变更是否需要重启 BFF 才能生效

### Requirement: 启动期加载启用插件
系统 SHALL 在 Nest 应用模块图构建期间加载 `active_plugins` 中启用且 manifest 合法的服务端插件模块，使插件 Controller、Resolver 和 Provider 进入 NestJS IoC 容器。

#### Scenario: 加载启用插件
- **WHEN** BFF 进程启动且 `active_plugins` 包含某个服务端插件
- **THEN** 系统导入该插件声明的 Nest DynamicModule，并将其加入运行时根模块 imports

#### Scenario: 不加载未启用插件
- **WHEN** `content/plugins` 中存在某个插件但该插件不在 `active_plugins` 中
- **THEN** 系统 MUST 不导入该插件的服务端模块

#### Scenario: 插件加载失败
- **WHEN** 某个已启用插件导入失败或返回无效模块
- **THEN** 系统 MUST 继续启动核心 BFF，并在心跳和扩展状态中报告该插件加载失败

### Requirement: 宿主能力可注入给插件
系统 SHALL 允许插件通过 NestJS IoC 使用宿主已提供的全局能力，包括配置、日志、鉴权、RAM 授权、GraphQL、微服务 Client 和公共共享类型。

#### Scenario: 插件注入宿主 ConfigService
- **WHEN** 插件 Provider 声明依赖宿主全局 ConfigService
- **THEN** NestJS IoC 容器 MUST 为该插件 Provider 注入宿主 ConfigService 实例

#### Scenario: 插件使用宿主鉴权装饰器
- **WHEN** 插件 Controller 或 Resolver 使用宿主鉴权和 RAM 授权装饰器
- **THEN** 系统 MUST 按现有鉴权链路执行访问控制

### Requirement: 插件变更后受控重启
系统 SHALL 提供受权限保护的系统重启 API，用于在 WebUI 更新插件启用状态后优雅终止当前 BFF 进程，并依赖外部进程管理器重新拉起服务。

#### Scenario: 重启请求先返回再退出
- **WHEN** 管理员请求重启 BFF
- **THEN** 系统 MUST 先返回成功响应，再延迟触发当前进程优雅退出

#### Scenario: 非授权用户不能重启
- **WHEN** 非管理员或无对应 RAM 权限的用户请求重启 BFF
- **THEN** 系统 MUST 拒绝该请求

### Requirement: 心跳确认重启成功
系统 SHALL 提供轻量心跳接口，返回当前 BFF 进程的 `bootId`、`startedAt`、`ready`、启用插件摘要、已加载插件和加载失败插件。

#### Scenario: 返回当前进程启动身份
- **WHEN** WebUI 请求心跳接口
- **THEN** 系统返回当前进程唯一 `bootId` 和 `startedAt`

#### Scenario: WebUI 识别新进程
- **WHEN** WebUI 在触发重启后轮询心跳接口
- **THEN** WebUI MUST 只有在 `bootId` 不同于重启前且 `ready` 为 true 时才判断 BFF 已重启成功

#### Scenario: 展示插件加载失败
- **WHEN** 重启后的 BFF 有启用插件加载失败
- **THEN** 心跳和扩展状态 MUST 返回失败插件列表，WebUI MUST 提示插件未成功加载

### Requirement: WebUI 重启等待体验
WebUI SHALL 在插件启用状态更新后，根据 BFF 响应进入重启等待流程，通过心跳轮询确认服务恢复，并在成功后刷新当前页面。

#### Scenario: 插件变更需要重启
- **WHEN** WebUI 保存插件启用、停用或卸载操作且 BFF 返回需要重启
- **THEN** WebUI 请求重启 API，并进入带超时的心跳轮询状态

#### Scenario: 心跳轮询成功
- **WHEN** 心跳返回新的 `bootId` 且 `ready` 为 true
- **THEN** WebUI 停止轮询并刷新页面

#### Scenario: 心跳轮询超时
- **WHEN** WebUI 在配置的最大等待时间内没有确认新进程就绪
- **THEN** WebUI 停止轮询并提示用户检查服务状态或手动刷新
