## [2026-07-26 15:29] | Task: 统一 TypeScript 与前端构建依赖

### 🤖 Execution Context
* **Agent ID**: `codex`
* **Base Model**: `gpt-5`
* **Runtime**: `Codex Desktop`
* **Git User**: `hubert <hubert@lejian.com>`
* **Branch**: `feat/ioc`

### 📥 User Query
> 将根 TypeScript 升级到 `^5.3.3`，客户端共享根 TypeScript 和样式开发依赖，验证 Server，并同步到两个迁移 worktree。

### 🛠 Changes Overview
**Scope:** 根工具链、NestJS packages/plugins、Vue/React 客户端

**Key Actions:**
- **统一工具链**: 根目录集中声明 TypeScript、Autoprefixer、Less、PostCSS 和 Tailwind CSS，移除客户端重复声明。
- **兼容 TypeScript 5**: 根模块解析恢复为 CommonJS/Node；客户端类型检查通过 Yarn 顶层命令使用根 TypeScript。
- **升级 GraphQL**: 将 `@nestjs/graphql` 统一到 12.x，与现有 Nest 10 和 `@nestjs/apollo` 12 对齐。
- **验证构建**: 三个 Server、两套 migration 类型检查及四个客户端生产构建通过。

### 🧠 Design Intent (Why)
*减少 monorepo 内重复工具版本，并避免 `^5.3.3` 自动漂移到 5.9 后触发旧 Node 类型兼容问题。GraphQL 12 同时修复 GraphQL 11 编译插件在 TypeScript 5 下的发射错误。*

### 📊 Change Stats
> 数据来自本次任务相关文件的工作区差异。

- **Files changed:** 13
- **Insertions:** +235
- **Deletions:** -155

| File | +Added | -Removed |
| --- | ---: | ---: |
| `clients/pomelo-initialize/package.json` | +1 | -6 |
| `clients/pomelo-login/package.json` | +1 | -6 |
| `clients/web/package.json` | +0 | -2 |
| `docs/histories/2026-07/20260726-1529-unify-typescript-tooling.md` | +53 | -0 |
| `package.json` | +5 | -2 |
| `packages/nestjs-authorization/package.json` | +1 | -1 |
| `packages/nestjs-oidc/package.json` | +1 | -1 |
| `packages/nestjs-ram-authorization/package.json` | +1 | -1 |
| `packages/pomelo-shared/package.json` | +2 | -2 |
| `plugins/obs/package.json` | +2 | -2 |
| `plugins/submodules/package.json` | +2 | -2 |
| `tsconfig.json` | +1 | -1 |
| `yarn.lock` | +165 | -129 |

### 📁 Files Modified
- `package.json`、`yarn.lock`、`tsconfig.json`
- `clients/pomelo-login/package.json`、`clients/pomelo-initialize/package.json`、`clients/web/package.json`
- `packages/nestjs-authorization/package.json`、`packages/nestjs-oidc/package.json`
- `packages/nestjs-ram-authorization/package.json`、`packages/pomelo-shared/package.json`
- `plugins/obs/package.json`、`plugins/submodules/package.json`
