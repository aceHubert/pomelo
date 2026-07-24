## [2026-07-24 18:44] | Task: 修复 CI Yarn Link 阶段 ENOENT

### 🤖 Execution Context

- **Agent ID**: `codex`
- **Base Model**: `GPT-5`
- **Runtime**: `Codex Desktop`
- **Git User**: `hubert <hubert@lejian.com>`
- **Branch**: `master`

### 📥 User Query

> GitHub Actions 执行 Yarn 安装时，在 `pomelo-shared` 的嵌套 GraphQL Tools 依赖之间
> 克隆 `tslib`，发生 ENOENT。

### 🛠 Changes Overview

**Scope:** Yarn 安装配置、共享包开发依赖

**Key Actions:**

- **Link 模式**: 将 Yarn node-modules linker 设置为 `hardlinks-local`，避免 Yarn 3.2
  并行 clone/hoist 相同依赖目录时发生源路径竞态。
- **依赖声明**: 保留可选 peer，并增加 workspace dev dependency，供 `pomelo-shared`
  自身编译时解析 RAM 类型和运行时导入。
- **验证**: 在干净临时副本中执行不可变安装，并依次构建
  `ram-authorization`、`pomelo-shared`，均成功完成。

### 🧠 Design Intent (Why)

错误发生在 Link 阶段的文件复制过程，不是依赖解析失败。hardlink 模式保持现有
node-modules 布局和依赖关系，同时绕开报错的 clone 路径，比改写业务类型或删除正常
依赖更直接。

### 📊 Change Stats

> 数据来自本次任务相关工作区差异；不含本 history 文件。

- **Files changed:** 3
- **Insertions:** +3
- **Deletions:** -0

| File                               | +Added | -Removed |
| ---------------------------------- | -----: | -------: |
| `.yarnrc.yml`                      |     +1 |       -0 |
| `packages/pomelo-shared/package.json` |  +1 |       -0 |
| `yarn.lock`                        |     +1 |       -0 |

### 📁 Files Modified

- `.yarnrc.yml`
- `packages/pomelo-shared/package.json`
- `yarn.lock`
