## [2026-07-24 19:34] | Task: 将角色 RAM Provider 临时下沉到两个服务

### 🤖 Execution Context

- **Agent ID**: `codex`
- **Base Model**: `GPT-5`
- **Runtime**: `Codex Desktop`
- **Git User**: `hubert <hubert@lejian.com>`
- **Branch**: `master`

### 📥 User Query

> shared 独立编译仍无法解析 `@ace-nestjs/ram-authorization`，暂时不要封装到 shared，
> 将 Provider 复制到 BFF 和 identity-server，后期再重构。

### 🛠 Changes Overview

**Scope:** pomelo-shared、infrastructure-bff、identity-server、执行计划

**Key Actions:**

- **解除 shared 依赖**: 删除 shared 中的 RolePolicyProvider、导出、测试，以及 RAM 的
  dev/peer dependency。
- **服务内实现**: BFF 和 identity-server 各自新增相同的 RolePolicyProvider，并继续
  汇总 `basic`、`identity` Statements。
- **数据边界不变**: BFF 仍通过 RPC 查询 usermeta；identity 仍通过
  `AccountProviderService.getClaims()` 查询账户 claims。
- **后续重构**: 两份实现增加 TODO，并在执行计划中记录重新合并事项。

### 🧠 Design Intent (Why)

shared 的独立声明构建受 `rootDir` 和包解析边界限制，继续从 shared 引用 RAM 包会导致
TS2307。临时把 Provider 放回实际使用 RAM 的两个服务，可以保持权限语义不变，同时
让 shared 恢复为不依赖 RAM 的独立包。

### ✅ Validation

- `pomelo-shared` TypeScript 独立检查通过，不再需要先构建 RAM 包。
- `infrastructure-bff` TypeScript 检查通过。
- 两个 RolePolicyProvider 测试套件均通过，共 6 个测试。
- 完整临时副本执行 `yarn install --immutable --mode=skip-build` 成功。
- `identity-server` 仅保留既有 `OidcModuleFactoryFn` 类型错误，本次 Provider 无新增错误。

### 📊 Change Stats

> 数据来自本次任务相关工作区差异；不含本 history 文件和用户已有改动。

- **Files changed:** 12
- **Insertions:** +225
- **Deletions:** -128

### 📁 Files Modified

- `docs/exec-plans/active/role-claims-to-ram-policies.md`
- `packages/pomelo-shared/__tests__/role-policy.provider.spec.ts`（删除）
- `packages/pomelo-shared/package.json`
- `packages/pomelo-shared/src/server/services/index.ts`
- `packages/pomelo-shared/src/server/services/role-policy.provider.ts`（删除）
- `servers/infrastructure-bff/src/app.module.ts`
- `servers/infrastructure-bff/src/common/authorization/role-policy.provider.ts`
- `servers/infrastructure-bff/src/common/authorization/role-policy.provider.spec.ts`
- `servers/identity-server/src/app.module.ts`
- `servers/identity-server/src/common/authorization/role-policy.provider.ts`
- `servers/identity-server/src/common/authorization/role-policy.provider.spec.ts`
- `yarn.lock`
