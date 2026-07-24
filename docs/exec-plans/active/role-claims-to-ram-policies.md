# 通过用户角色动态解析 RAM 权限

## 目标

保持当前单角色模型。Access Token 只需要可靠的 `sub`，`IRamPolicyProvider` 根据
`sub` 查询用户角色和超级管理员标记，再返回对应的预设 RAM Policy。

Token 中现有 `ram` 字段保留为“用户额外 RAM”入口，当前统一签发空数组，不再用它
承载角色的完整权限。

## 最终结论

```text
Access Token
  sub: 用户 ID
  ram: []              # 用户额外 RAM，当前留空
       │
       ▼
IRamPolicyProvider.getPolicies(user, serviceName)
       │ user.sub
       ▼
查询 role + super_administrator
       │
       ▼
生成迁移期角色 Action Policy
       │
       ├── 超级管理员：basic:* + identity:*
       ├── 管理角色：basic:*
       └── Subscriber：限定 GET Actions
```

不做以下事情：

- 不把角色或角色对应的大量 RAM Statements 塞进 Token。
- 不引入多角色模型。
- 不新增角色、权限、用户角色关联表。
- 不在本阶段删除 infrastructure-service 原有 capability 校验。
- 不把 capability 名称直接拼接成 Action。
- 不在 RAM 层重复实现现有的内容所有权和状态判断。

## 当前代码事实

### RAM 已具备的能力

- `IRamPolicyProvider.getPolicies(user, serviceName)` 已能读取解析后的 Token 用户对象，
  因此可以直接使用 `user.sub`。
- `CompositePolicyProvider` 已支持聚合多个 Provider。
- `RAMAuthorizationEvaluator` 已支持：
  - 多 Policy。
  - Deny 优先。
  - Action/Resource 通配符。
  - 未命中时隐式拒绝。
- 两个服务已有独立 namespace：
  - `infrastructure-bff`: `basic`
  - `identity-server`: `identity`

### 当前缺口

- `RamAuthorizationModule` 把 `RAM_POLICY_PROVIDERS` 固定为
  `JwtClaimsPolicyProvider`，应用还不能通过模块配置加入自定义
  `IRamPolicyProvider`。
- OIDC Access Token 当前仍带临时的 `basic:*`。
- `feat/ioc` 的 Management JWT 曾直接内嵌完整 `identity:*`；master 没有这条签发路径，
  本次无需处理。
- 用户角色当前保存在 `${tablePrefix}capabilities` usermeta，是单个
  `UserRole`；这次继续沿用。

## 权限来源拆分

角色预设和用户额外 RAM 是两个独立来源：

```text
角色预设 RAM（服务端按 sub 查询）
  +
用户额外 RAM（Token ram claim，当前 []）
  ↓
CompositePolicyProvider
  ↓
RAMAuthorizationEvaluator
```

### 角色预设 RAM

由共享的 `RolePolicyProvider` 负责。它只信任 `sub`，不信任客户端提供的角色值，并将
`basic`、`identity` Action 汇总到同一个 Policy 的 Statements 中：

1. 根据 `sub` 查询用户当前单角色和超级管理员标记。
2. 按角色生成 BFF Action Policy。
3. Resource 暂时使用 `['*']`，继续由 service capability 校验兜底。
4. capability Resource 重构作为后续 TODO。

### 用户额外 RAM

继续由现有 `JwtClaimsPolicyProvider` 解析。当前所有 Token 签发：

```ts
ram: [];
```

将来如果需要给某个用户单独追加或拒绝权限，再由服务端签发可信 RAM。显式 Deny
会按现有 Evaluator 规则覆盖角色预设 Allow。

## 角色预设

### 超级管理员

判定只依赖已有 usermeta，不要求用户同时是 `administrator`：

```text
meta_key   = UserMetaPresetKeys.SuperAdministrator
           = "${tablePrefix}super_administrator"
meta_value = true | 1 | "1" | "true"
```

Provider 根据 `sub` 只查询这一条 usermeta。未找到、空值或非法值都按非超级管理员
处理。

返回：

```ts
[
  {
    PolicyName: 'SuperAdministratorFullAccess',
    Statements: [
      {
        Effect: 'Allow',
        Action: ['basic:*', 'identity:*'],
        Resource: ['*'],
      },
    ],
  },
];
```

Provider 可以按 `serviceName` 只返回当前服务对应的 Action，但权限语义必须等价。

### 迁移期普通管理角色

当前角色定义继续来自内置 `UserRoles` 配置：

```text
administrator → 全部 UserCapability
editor        → 内容、分类、媒体等编辑能力
author        → 自有内容和媒体能力
contributor   → 基础内容编辑能力
subscriber    → read
```

但这些 capabilities 是 infrastructure-service 的能力，不是 BFF Action。迁移期不做
capability → Action 转换：

```ts
{
  Effect: 'Allow',
  Action: ['basic:*'],
  Resource: ['*'], // TODO: capability 重构完成后收紧
}
```

适用角色：普通 `administrator`、`editor`、`author`、`contributor`。

这不会立即抹平角色差异，因为请求进入 infrastructure-service 后仍会执行现有
capability 校验。删除旧校验前，必须先完成下面的 Resource 重构。

### Action 与 Resource 的职责

```text
Action   = infrastructure-bff 暴露的接口操作
           例如 basic:template.update

Resource = infrastructure-service 执行该操作需要的 capability
           例如 po:basic:capability/edit_templates
```

目标 Policy 示例：

```ts
{
  Effect: 'Allow',
  Action: ['basic:template.update'],
  Resource: ['po:basic:capability/edit_templates'],
}
```

同一个 Action 在不同数据状态下可能需要不同 Resource：

```text
更新自己的草稿       → edit_templates
更新他人的内容       → edit_others_templates
更新已发布内容       → edit_published_templates
更新他人的私有内容   → edit_private_templates
```

因此 capability 不能静态转换成 Action，也不能只在签发 Policy 时展开。最终需要 BFF
或 service 在掌握目标资源状态后提供实际的 capability Resource 上下文。

### Resource 重构 TODO

当前 Resource 尚未真正接入请求授权：

- 现有 `@RamAuthorized('action')` 只检查 Action。
- `TokenGuard` 会读取 `RAM_RESOURCE_CONTEXT_KEY`，但当前没有装饰器写入该 metadata。
- 对象形式 `@RamAuthorized({ action, resourceType })` 目前主要用于响应过滤，而且只有
  提供 `responseFilter` 时才实际过滤。
- 现有业务接口没有把 service capability 传给 RAM Evaluator。

后续独立重构：

1. 统一 capability Resource URN：
   `po:basic:capability/<UserCapability>`。
2. 为单一固定 capability 的接口补充 Resource Context。
3. 对依赖所有权、状态、taxonomy type 的动态 capability，在 service 确定条件后执行
   RAM Resource 评估，或返回所需 capability 供 BFF 评估。
4. 将 `UserRoles.capabilities` 转为角色 Policy 的 Resource 列表。
5. 验证 Action 与 Resource 同时命中后，再逐步移除 datasource 的 `hasCapability()`。

本次只记录 TODO，不实现 Resource 重构。

### Subscriber

Subscriber 的 `read` 仍然是 service capability。迁移期只给 Subscriber 明确需要的
BFF GET Actions，Resource 暂时为 `['*']`；公开模板详情、别名详情、模板选项和可见
分类已有 `@Anonymous()` 路径，不需要额外 Action。

## Subscriber GET 权限分析

### 当前受 RAM 保护的 GET/Query

#### 模板统计

```text
basic:template.counts
```

用途是按状态、当前用户统计内容，主要服务后台仪表盘。Subscriber 被前端管理路由
直接重定向到 forbidden，不需要该权限。

结论：不授予。

#### 分类与标签列表

```text
basic:taxonomy.category.list
basic:taxonomy.tag.list
basic:taxonomy.list
basic:taxonomy.list.byobjectid
```

这是当前唯一能合理对应 `UserCapability.Read` 的 RAM GET 组。公开内容已有无需 RAM
的替代入口，例如：

- 模板可见分类。
- 单个 taxonomy 查询。
- 模板详情、别名详情和模板选项。

为避免把 Subscriber 的只读范围扩大成后台管理读取，角色预设只授予这四个 taxonomy
Action，不授予 `basic:*`。

迁移期 Policy：

```ts
{
  PolicyName: 'SubscriberTaxonomyRead',
  Statements: [
    {
      Effect: 'Allow',
      Action: [
        'basic:taxonomy.category.list',
        'basic:taxonomy.tag.list',
        'basic:taxonomy.list',
        'basic:taxonomy.list.byobjectid',
      ],
      Resource: ['*'],
    },
  ],
}
```

#### 媒体详情和列表

```text
basic:media.detail
basic:media.list
```

这是媒体库管理数据，不是读取图片文件本身。页面展示图片使用静态资源 URL，不需要
媒体库 API。

结论：不授予。

#### 用户详情和用户列表

```text
basic:user.detail
basic:user.paged-list
basic:user.meta.detail
basic:user.meta.list
```

用户列表明显属于后台管理。`basic:user.detail` 当前没有把请求用户 `sub` 绑定到目标
用户资源，直接授予会允许 Guard 层访问任意用户 ID，不能把它当作“查看自己”。

结论：不授予。需要 Subscriber 自助资料页时，应新增或补齐“仅本人”资源上下文后再
授权，而不是直接开放 `basic:user.detail`。

#### Option 列表

```text
basic:option.list
```

完整 Option 列表属于后台配置。公开侧已有 autoload、按 ID、按名称和值读取接口，且
OptionService 会过滤敏感配置。

结论：不授予。

#### Runtime Extension 列表

```text
basic:runtime-extension.list
```

这是插件/运行时扩展管理信息。

结论：不授予。

#### Meta 只读 Action

```text
basic:template.meta.detail
basic:template.meta.list
basic:taxonomy.meta.detail
basic:taxonomy.meta.list
basic:media.meta.detail
basic:media.meta.list
```

部分生成式 Meta GET 同时组合了 `RamAuthorized` 和 `Anonymous`。这组组合需要单独验证
Guard 执行效果，但不应通过给 Subscriber 扩权来掩盖匿名访问问题。

公开模板详情本身已经支持按 `metaKeys` 返回所需 Meta。

结论：Subscriber 预设不包含这些 Meta Action；另建小范围测试确认匿名 Meta 行为。

## `RolePolicyProvider` 设计

```ts
class RolePolicyProvider implements IRamPolicyProvider {
  readonly sourceType = PolicySourceType.External;
  readonly priority = 10;

  constructor(private readonly loadAuthorization: (userId: number) => Promise<UserAuthorizationSnapshot>) {}

  async getPolicies(user: Record<string, unknown>) {
    const sub = Number(user.sub);
    if (!Number.isSafeInteger(sub) || sub <= 0) return [];

    const authorization = await this.loadAuthorization(sub);
    return createPresetRolePolicies(authorization);
  }
}
```

必须满足：

- `sub` 缺失或非法时 fail closed，返回空 Policy。
- basic 角色不存在或未知时返回空 Policy；identity meta 不存在时按 false 处理。
- `identity:*` 只对 `super_administrator` usermeta 为真时返回。
- 不从 Token 的 `role` 决定权限。
- 查询异常不能降级成 Allow。

## 用户授权查询

Provider 只需要最小数据：

```ts
interface UserAuthorizationSnapshot {
  role: UserRole;
  superAdministrator: boolean;
}
```

### infrastructure-bff

复用现有内部 `UserPattern.GetMetas`，根据 `sub` 一次读取
`capabilities` 和 `super_administrator`。返回值已由 `MetaDataSource` 去除表前缀，
Provider 不需要知道实际的 `tablePrefix`，也不新增对外接口。

### identity-server

通过 `AccountProviderService.getClaims()` 读取 Account Provider 提供的：

```ts
{
  role,
  super_administrator,
}
```

identity-server 不直接调用 infrastructure-service。当前 microservice Account Provider
内部仍通过 `UserPattern.GetMetas` 读取数据并完成表前缀归一化，但这个数据源细节只属于
`AccountConfigService`，RAM 接线只依赖 Account Provider 接口。

## `nestjs-ram-authorization` 最小改动

保留现有 Provider 结构，只开放自定义 Provider 注册：

```ts
export interface RamAuthorizationOptions {
  serviceName: string;
  policyProviders?: IRamPolicyProvider[];
}
```

模块内部：

```ts
useFactory: (options: RamAuthorizationOptions) => [
  new JwtClaimsPolicyProvider(options.ramClaimTypeName),
  ...(options.policyProviders ?? []),
];
```

应用接线：

```ts
RamAuthorizationModule.forRootAsync({
  inject: [AccountProviderService],
  useFactory: (accountProvider: AccountProviderService) => ({
    isGlobal: true,
    serviceName: 'identity',
    policyProviders: [
      new RolePolicyProvider(async (userId) => {
        const claims = await accountProvider.getClaims(userId);
        return {
          role: claims.role,
          superAdministrator: claims.super_administrator,
        };
      }),
    ],
  }),
});
```

`RamAuthorizationOptionsFactory` 仍只负责创建模块配置；真正通过 `sub` 生成角色预设
Policy 的是 `IRamPolicyProvider`。

## Token 签发调整

### OIDC Access Token

删除临时 `basic:*`，改回：

```ts
return {
  sub: String(accountId),
  ram: [],
};
```

### Identity Management JWT（master 不适用）

master 没有 `feat/ioc` 中的 Identity Management JWT 签发路径，因此没有第二处 Token
需要修改。后续若移植该路径，Token 仍应只签发：

```ts
{
  sub: accountId,
  ram: [],
}
```

后续请求应由 identity-server 的 `RolePolicyProvider` 按 `sub` 重新确认超级管理员身份，
因此撤销超级管理员后不必等待 Token 过期才失去 `identity:*`。

## 查询频率

第一版每次 RAM 校验按 `sub` 查询授权快照，不先写缓存。优点是角色和超级管理员撤销
立即生效，逻辑也最小。

只有在监控确认授权查询成为瓶颈后，再增加短 TTL 缓存。不能在没有失效机制时缓存
超级管理员权限。

## 实施顺序

1. 给 `RamAuthorizationModule` 增加 `policyProviders` 注册入口和聚合测试。
2. 在 shared 增加唯一的汇总 RolePolicyProvider 及单元测试。
3. 复用现有 `UserPattern.GetMetas` 查询最小用户授权元数据。
4. 在 infrastructure-bff 通过 RPC loader 注册共享 RolePolicyProvider。
5. 在 identity-server 通过 Account Provider loader 注册共享 RolePolicyProvider。
6. 将 master 的 OIDC Access Token `ram` 改为空数组。
7. 验证超级管理员、普通管理角色和 Subscriber。
8. 单独验证 `RamAuthorized + Anonymous` 的 Meta GET 行为。

## 验证矩阵

```text
用户                         basic Action                Resource（当前）    identity:*
超级管理员                   basic:*                     *                  Allow
普通 administrator           basic:*                     *                  Deny
editor                       basic:*                     *                  Deny
author                       basic:*                     *                  Deny
contributor                  basic:*                     *                  Deny
subscriber                   taxonomy 只读四个 Action     *                  Deny
未知/无角色用户               Deny                        -                  Deny
```

必测场景：

- Token 中 `ram: []`，超级管理员仍能访问 basic 和 identity。
- 撤销 `super_administrator` 后，同一个 Token 立即不能访问 identity。
- 管理角色能通过 BFF Action Guard，但最终仍受 service capability 限制。
- Subscriber 能读取公开模板和 taxonomy，只读之外的 RAM 接口返回 403。
- 用户额外 RAM 中的 Deny 能覆盖角色预设 Allow。
- 非法 `sub`、查询失败和未知角色全部 fail closed。
- 当前 Resource 不参与简单 Action Guard；TODO 测试必须明确标记为未完成。

## 风险

- 管理角色当前拥有 `basic:*`，角色差异完全依赖 service capability 校验；旧校验不能
  提前删除。
- Resource Context 尚未接线，Policy 中的 capability Resource 当前不会限制简单
  `@RamAuthorized('action')`。
- 每次校验查询用户授权会增加内部请求；先观测再缓存。
- `RamAuthorized + Anonymous` 组合可能让匿名 Meta GET 行为与注释不一致，必须单独测，
  不能通过 Subscriber Policy 规避。
- 未来启用用户额外 RAM 时，签发来源必须完全由服务端控制。

## 回滚

- `JwtClaimsPolicyProvider` 始终保留。
- 若 RolePolicyProvider 出现问题，可临时恢复 Token 内嵌角色 RAM。
- 旧 `capabilities` 字段和 datasource capability 校验不变，无数据迁移回滚。

## 进度记录

- [x] 核对当前 Provider 扩展点。
- [x] 核对单角色和超级管理员数据来源。
- [x] 核对 basic/identity namespace。
- [x] 盘点 Subscriber 相关 RAM GET/Query。
- [x] 收敛单角色、按 sub 动态解析方案。
- [x] 明确 Action 属于 BFF、capability 应重构为 Resource。
- [ ] 独立设计并实现 capability Resource 重构（本次明确不实施）。
- [ ] 创建正式 OpenSpec change（本次未要求）。
- [x] 将计划复制到 master worktree，并核对分支差异。
- [x] 开放自定义 `IRamPolicyProvider` 注册并保留 JWT Provider。
- [x] 实现唯一的共享 RolePolicyProvider，并由 basic/identity 分别提供数据 loader。
- [x] 将 OIDC Access Token 的 `ram` 恢复为空数组。
- [x] 验证角色矩阵、查询失败、JWT 聚合及 Deny 优先。
- [x] 验证 `RamAuthorized + Anonymous` 仍会执行 RAM Guard。
- [x] 运行格式、Lint、单元测试及相关 TypeScript 检查。

## 决策记录

- 2026-07-24：不考虑多角色，继续使用现有单角色模型。
- 2026-07-24：角色不进入 RAM claim；Provider 按 `sub` 动态查询。
- 2026-07-24：`ram` claim 保留给用户额外权限，当前签发空数组。
- 2026-07-24：超级管理员拥有 `basic:*`、`identity:*`。
- 2026-07-24：迁移期管理角色使用 `basic:*` Action，角色差异继续由 service
  capability 校验。
- 2026-07-24：Action 表示 BFF 操作；capability 未来重构为 RAM Resource。
- 2026-07-24：Subscriber 只授予 taxonomy 四个只读 Action。
- 2026-07-24：master 复用现有 `UserPattern.GetMetas`，不新增内部查询接口。
- 2026-07-24：master 不存在 Identity Management JWT 签发路径，该项标记为不适用。
- 2026-07-24：角色 Statements 在 shared Provider 中统一汇总，不在 BFF 和 identity
  分别维护；identity 只通过 `AccountProviderModule` 获取账户 claims。
- 2026-07-24：`Anonymous` 只跳过登录校验，不会移除 `RamAuthorized` 注册的 RAM Guard；
  Meta GET 若需要真正匿名，应单独调整装饰器组合，不能靠角色扩权。

## 验证记录

- RAM 授权包单元测试：3 个测试套件、21 个测试通过。
- shared RolePolicyProvider：1 个测试套件、3 个测试通过。
- `RamAuthorized + Anonymous`：确认 Authorization Guard 与 RAM Guard 同时保留。
- ESLint：本次涉及的 TypeScript 文件全部通过。
- TypeScript：`nestjs-ram-authorization`、`pomelo-shared`、`infrastructure-bff`、
  `infrastructure-service` 通过。
- `identity-server` 仍有 master 既有的 `OidcModuleFactoryFn` 类型错误，位置在
  `oidc-config.service.ts:63`；本次变更位于同文件的 Access Token claims，不是新增错误。
