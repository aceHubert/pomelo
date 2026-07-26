## [2026-07-26 14:45] | Task: 统一 root Vite 本地 HTTPS

### 🤖 Execution Context
* **Agent ID**: `codex`
* **Base Model**: `GPT-5`
* **Runtime**: `Codex Desktop`
* **Git User**: `hubert <hubert@lejian.com>`
* **Branch**: `feat/ioc`

### 📥 User Query
> 将除 admin/web 外的 Vite 修改和依赖安装到 root feat/ioc，再同步到 admin worktree，以便服务共同运行。

### 🛠 Changes Overview
**Scope:** root 的 identity management、initialize、login Vite 开发入口；不修改 `clients/pomelo-admin`、`clients/web`、server 或数据库。

**Key Actions:**
- 在 root 统一声明 `vite` 与 `vite-plugin-mkcert` 开发依赖。
- 三份 Vite 配置注册 `mkcert()`，以 `HTTPS=true` 显式启用 HTTPS；默认继续使用 HTTP。
- 完成 root 依赖链接，避免各 workspace 重复安装插件。

### 🧠 Design Intent (Why)
身份管理、初始化与登录服务由 root 启动。将 HTTPS 依赖和配置固定在 `feat/ioc`，再向 admin worktree 同步同一提交，避免两个工作区出现不一致的本地启动行为。

### ✅ Verification
- 三份 Vite 配置均以 HTTP 成功启动并主动停止：identity management `5185`、initialize `5186`、login `5187`。
- `git diff --check` 通过。

### 📊 Change Stats
> 数据来自相对本轮开始前 root `package.json` 与 `yarn.lock` 的差异，以及三份配置的 `git diff --numstat`；不含本 history 文件。

- **Files changed:** 5
- **Insertions:** +41
- **Deletions:** -4

| File | +Added | -Removed |
| --- | ---: | ---: |
| `package.json` | +2 | -0 |
| `yarn.lock` | +30 | -1 |
| `clients/identity-server-management/vite.config.ts` | +3 | -1 |
| `clients/pomelo-initialize/vite.config.ts` | +3 | -1 |
| `clients/pomelo-login/vite.config.ts` | +3 | -1 |

### 📁 Files Modified
- `package.json`
- `yarn.lock`
- `clients/identity-server-management/vite.config.ts`
- `clients/pomelo-initialize/vite.config.ts`
- `clients/pomelo-login/vite.config.ts`
