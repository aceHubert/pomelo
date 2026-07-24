## [2026-07-24 17:22] | Task: 为超级管理员 usermeta 添加系统表前缀

### 🤖 Execution Context

- **Agent ID**: `codex`
- **Base Model**: `GPT-5`
- **Runtime**: `Codex Desktop`
- **Git User**: `hubert <hubert@lejian.com>`
- **Branch**: `master`

### 📥 User Query

> 将 `SuperAdministrator` 调整为与 `Capabilities` 一样需要添加 table 前缀，以区分多系统数据；已有数据人工修改，不增加兼容迁移。

### 🛠 Changes Overview

**Scope:** pomelo-shared、infrastructure-service

**Key Actions:**

- **前缀约定**: 将 `SuperAdministrator` 移到需要 table 前缀的 usermeta 枚举区域。
- **初始化写入**: 新站点初始化时使用 `keyWithTablePrefix` 写入超级管理员标记。

### 🧠 Design Intent (Why)

同一用户表被多个系统共享时，超级管理员身份必须按系统隔离，不能继续使用全局的
`super_administrator` key。

### 📊 Change Stats

> 数据来自本次任务相关工作区差异。

- **Files changed:** 2
- **Insertions:** +7
- **Deletions:** -3

| File                                                                     | +Added | -Removed |
| ------------------------------------------------------------------------ | -----: | -------: |
| `packages/pomelo-shared/src/public/preset-keys.ts`                       |     +2 |       -2 |
| `servers/infrastructure-service/src/controllers/site-init.controller.ts` |     +5 |       -1 |

### 📁 Files Modified

- `packages/pomelo-shared/src/public/preset-keys.ts`
- `servers/infrastructure-service/src/controllers/site-init.controller.ts`
