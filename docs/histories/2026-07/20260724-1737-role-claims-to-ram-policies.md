## [2026-07-24 17:37] | Task: 按用户角色动态解析 RAM 权限

### 🤖 Execution Context

- **Agent ID**: `codex`
- **Base Model**: `GPT-5`
- **Runtime**: `Codex Desktop`
- **Git User**: `hubert <hubert@lejian.com>`
- **Branch**: `master`

### 📥 User Query

> 将角色转 RAM 的执行计划复制到 master worktree，完成实现并验证；Token 中的 `ram`
> 保留为用户额外权限且当前置空，角色权限由 Provider 根据 `sub` 动态读取。

### 🛠 Changes Overview

**Scope:** nestjs-ram-authorization、pomelo-shared、infrastructure-bff、identity-server、docs

**Key Actions:**

- **Provider 扩展**: `RamAuthorizationModule` 支持追加自定义 `IRamPolicyProvider`，并保留
  原有 JWT Claims Provider。
- **角色策略**: shared 中的唯一 Provider 将 `basic`、`identity` Actions 汇总为一份
  Policy；两个服务不再分别维护 Statements。
- **Token 收敛**: OIDC Access Token 的 `ram` 从临时 `basic:*` 恢复为 `[]`。
- **模块边界**: BFF 通过内部 RPC 提供授权快照；identity 只通过
  `AccountProviderService.getClaims()` 提供授权快照，不直接访问 service 数据源。
- **验证**: 覆盖 Provider 聚合、角色矩阵、非法 `sub`、查询失败和匿名装饰器组合。

### 🧠 Design Intent (Why)

角色权限必须以服务端当前数据为准，避免把完整角色 RAM 固化在 Token 中。JWT RAM
继续作为用户额外策略来源，由现有 Composite Provider 合并；撤销角色或超级管理员
标记后，新请求会立即按当前 usermeta 重新授权。

### 📊 Change Stats

> 数据来自本次任务相关工作区差异；不含本 history 文件。

- **Files changed:** 13
- **Insertions:** +786
- **Deletions:** -20

| File                                                                                      | +Added | -Removed |
| ----------------------------------------------------------------------------------------- | -----: | -------: |
| `docs/exec-plans/active/role-claims-to-ram-policies.md`                                   |   +579 |       -0 |
| `packages/nestjs-ram-authorization/src/interfaces/ram-authorization-options.interface.ts` |     +6 |       -0 |
| `packages/nestjs-ram-authorization/src/ram-authorized.module.ts`                          |     +2 |       -1 |
| `packages/nestjs-ram-authorization/__tests__/ram-authorized.module.spec.ts`               |    +23 |       -0 |
| `packages/pomelo-shared/package.json`                                                     |     +1 |       -0 |
| `packages/pomelo-shared/src/server/services/index.ts`                                     |     +1 |       -0 |
| `packages/pomelo-shared/src/server/services/role-policy.provider.ts`                      |    +70 |       -0 |
| `packages/pomelo-shared/__tests__/role-policy.provider.spec.ts`                           |    +34 |       -0 |
| `servers/infrastructure-bff/src/app.module.ts`                                            |    +30 |       -4 |
| `servers/infrastructure-bff/src/common/authorization/anonymous-ram-guard.spec.ts`         |    +16 |       -0 |
| `servers/identity-server/src/app.module.ts`                                               |    +20 |       -7 |
| `servers/identity-server/src/oidc-config/oidc-config.service.ts`                          |     +2 |       -7 |
| `yarn.lock`                                                                               |     +2 |       -1 |

### 📁 Files Modified

- `docs/exec-plans/active/role-claims-to-ram-policies.md`
- `packages/nestjs-ram-authorization/src/interfaces/ram-authorization-options.interface.ts`
- `packages/nestjs-ram-authorization/src/ram-authorized.module.ts`
- `packages/nestjs-ram-authorization/__tests__/ram-authorized.module.spec.ts`
- `packages/pomelo-shared/package.json`
- `packages/pomelo-shared/src/server/services/index.ts`
- `packages/pomelo-shared/src/server/services/role-policy.provider.ts`
- `packages/pomelo-shared/__tests__/role-policy.provider.spec.ts`
- `servers/infrastructure-bff/src/app.module.ts`
- `servers/infrastructure-bff/src/common/authorization/anonymous-ram-guard.spec.ts`
- `servers/identity-server/src/app.module.ts`
- `servers/identity-server/src/oidc-config/oidc-config.service.ts`
- `yarn.lock`
