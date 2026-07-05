# 灵栈 LingStack — Phase 5：Terminal + Git 主链闭环报告

**版本**: v0.1.5 Phase 5
**日期**: 2026-07-04
**轮次**: R39
**阶段**: 自举过渡期 — Terminal + Git 两条主链合流

---

## 一、执行摘要

严格承接 Phase 4 Review Pane + Diff 主链，完成 Phase 5 Terminal + Git 主链闭环。

本轮让 LingStack 首次具备了"执行命令 → 持续看输出 → 捕获退出状态 → 关联当前 thread → 读取 git 变更 → 从 review 进入 stage/revert → 生成 commit draft"的完整工作流骨架。

右栏三个 tab（review / terminal / git）全部从壳层占位升级为可工作面板。

---

## 二、本轮扫描的旧 terminal / git / review 代码

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/features/terminal/store/terminal.store.ts` | **增强** | 已有 per-thread entriesByThread + appendOutput/finishEntry/killEntry。缺少：currentCwdByThread、runningEntryIdByThread、source 字段 |
| `src/features/terminal/types.ts` | **删除** | 旧扁平文件只含 TerminalTab 接口，被新的 `types/index.ts` 替代 |
| `src/features/terminal/components/TerminalPane.vue` | **重写** | 原为 xterm.js 集成面板（旧 WorkbenchLayout 用），本轮重写为 CodexWorkbench 右栏组件 |
| `src/features/terminal/composables/useTerminal.ts` | **保留** | xterm.js composable，未动 |
| `src/features/git/store/git.store.ts` | **完全重写** | 原为全局维度（单一 changedFiles/stagedFiles/commitDraft），本轮升级为 per-project 管理 |
| `src/features/git/` | **新建目录** | 无 types/、无 components/、无 services/ |
| `src/layouts/codex-shell/parts/RightReviewPane.vue` | **重写** | terminal/git tab 从静态占位委派给 TerminalPane / GitPane |
| `src/features/review/components/ReviewDiffPane.vue` | **增强** | 新增 review↔git bridge：stage/revert 操作同步到 git.store |

---

## 三、新建/重构文件清单

### 3.1 新建 Terminal 文件（5 个）

| 文件 | 说明 |
|------|------|
| `src/features/terminal/types/index.ts` | TerminalEntry 类型定义（含 source 字段: user/agent/system） |
| `src/features/terminal/services/terminal-runtime.service.ts` | 命令执行服务：runCommand/stopCommand + flow output 模拟 + setTerminalCallback |
| `src/features/terminal/components/TerminalPane.vue` | 主编排组件：toolbar + entry 列表 + 命令输入行 + run/stop/clear |
| `src/features/terminal/components/TerminalEntryItem.vue` | 单条 entry：command + 状态图标 + 输出 + exitCode + running spinner |
| `src/features/terminal/components/TerminalToolbar.vue` | 工具栏：cwd 编辑 + clear 按钮 + running 状态 |
| `src/features/terminal/components/TerminalEmptyState.vue` | 空状态 |

### 3.2 新建 Git 文件（5 个）

| 文件 | 说明 |
|------|------|
| `src/features/git/types/index.ts` | GitChangedFile / GitProjectState / GitFileStatus 类型定义 |
| `src/features/git/components/GitPane.vue` | 主编排组件：branchBar + filesList + commitDraft + 空状态 + git↔thread 回流 |
| `src/features/git/components/GitBranchBar.vue` | 分支栏：branch 名 + staged/total 统计 + Stage All / Revert All |
| `src/features/git/components/GitChangedFilesList.vue` | 文件列表：status(A/M/D/R/U) + 文件名/路径 + stage/unstage/revert 按钮 |
| `src/features/git/components/CommitDraftEditor.vue` | commit draft 编辑器：textarea + staged hint |
| `src/features/git/components/GitEmptyState.vue` | 空/clean 状态 |

### 3.3 增强/重写文件（4 个）

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `src/features/terminal/store/terminal.store.ts` | 增强 | 新增 currentCwdByThread、runningEntryIdByThread、source 字段；createEntry 替代旧 appendEntry；finishEntry/killEntry 自动清理 runningEntryId |
| `src/features/git/store/git.store.ts` | 完全重写 | 全局状态 → per-project maps（branchesByProject/changedFilesByProject/commitDraftsByProject）；新增 revertFile/revertAll/addChangedFile/removeFile /commitDraft 持久化到 localStorage |
| `src/layouts/codex-shell/parts/RightReviewPane.vue` | 重写 | review tab 委派 ReviewDiffPane；terminal tab 委派 TerminalPane；git tab 委派 GitPane；artifacts/pr tab 保留占位 |
| `src/features/review/components/ReviewDiffPane.vue` | 增强 | 新增 review↔git bridge：stageFile/revertFile 同步到 git.store（addChangedFile + stageFile/revertFile）；注入 projectStore + gitStore |

### 3.4 删除文件（1 个）

| 文件 | 原因 |
|------|------|
| `src/features/terminal/types.ts` | 旧扁平文件被新的 `types/index.ts` 替代，且会遮蔽目录模块解析 |

---

## 四、Terminal 主链组织

### 4.1 数据维度

Terminal 是 **thread 维度**：
- `entriesByThread[threadId]` — 命令历史
- `currentCwdByThread[threadId]` — 当前工作目录
- `runningEntryIdByThread[threadId]` — 当前运行中的 entry

### 4.2 执行流程

```
用户输入命令 → TerminalPane.handleRun()
  → terminalRuntime.runCommand(threadId, command, cwd)
    → terminalStore.createEntry() → 创建 entry (status: 'running')
    → setInterval 模拟逐行输出 → terminalStore.appendOutput()
    → 完成 → terminalStore.finishEntry()
      → setTerminalCallback → sessionStore.appendMessage(type: 'command')
```

### 4.3 TerminalPane 结构

```
TerminalPane
├── TerminalToolbar（cwd + clear + running 状态）
├── TerminalEntryItem × N
│   ├── header（状态图标 + $ command + time）
│   ├── output（等宽文本滚动区）
│   ├── running spinner
│   └── exitCode
├── TerminalEmptyState（fallback）
└── input row（$ prefix + input + Run/Stop）
```

### 4.4 Terminal ↔ Thread 联动

- **Thread → Terminal**: ThreadHeader "Open Terminal" → 右栏切到 terminal tab
- **Terminal → Thread**: 命令完成后通过 `setTerminalCallback` → `sessionStore.appendMessage(type: 'command', content: summary)` → 中栏 timeline 可见

---

## 五、Git 主链组织

### 5.1 数据维度

Git 是 **project 维度**：
- `branchesByProject[projectId]` — 当前分支（持久化 localStorage）
- `changedFilesByProject[projectId]` — 变更文件列表（运行时）
- `commitDraftsByProject[projectId]` — commit draft（持久化 localStorage）
- `lastSyncedAtByProject[projectId]` — 最后同步时间

### 5.2 GitPane 结构

```
GitPane
├── GitBranchBar（branch + staged/total stats + Stage All / Revert All）
├── GitChangedFilesList
│   └── file × N（status badge + fileName/filePath + stage/unstage/revert）
├── CommitDraftEditor（textarea + staged hint）
└── GitEmptyState（fallback）
```

### 5.3 Git ↔ Thread 联动

- 每个 stage/unstage/revert 操作 → `sessionStore.appendMessage(type: 'system', content: '[Git] ...')` → 中栏 timeline

### 5.4 Commit Draft 持久化

- 通过 localStorage key `lingstack_git_state` 持久化 branches + commitDrafts
- 跨页面刷新恢复

---

## 六、Review ↔ Git 联动

在 `ReviewDiffPane.vue` 中建立双向桥接：

### Stage 联动链路

```
用户点击 review pane 中 Stage File
  → reviewStore.stageFile(threadId, fileId)
  → 检查 git.store 是否已有该 filePath
    → 无：gitStore.addChangedFile() + gitStore.stageFile()
    → 有：gitStore.stageFile()
  → sessionStore.appendMessage(type: 'system', 'Staged: ...')
```

### Revert 联动链路

```
用户点击 review pane 中 Revert File
  → reviewStore.revertFile(threadId, fileId)
  → 查找 git.store 中对应 filePath → gitStore.revertFile()
  → sessionStore.appendMessage(type: 'system', 'Reverted: ...')
```

### 数据隔离
- review 维度的 staged/reverted 标记独立于 git 维度
- 两者通过 filePath 关联，不耦合 store 内部逻辑

---

## 七、真实执行与 bridge/mock 状态

| 模块 | 状态 | 说明 |
|------|------|------|
| terminal.types | **真实接线** | TerminalEntry 正式定义 |
| terminal.store | **真实接线** | per-thread 管理 + currentCwd + runningEntryId + source |
| terminal-runtime.service | **bridge/mock** | 模拟命令执行与流式输出；接口设计（runCommand/stopCommand/callback）按真实 runtime 组织，可无缝切换到 Tauri shell |
| TerminalPane | **真实接线** | 基于 bridge runtime，run/stop/clear 全部可用 |
| TerminalEntryItem | **真实接线** | 四种状态（running/done/failed/killed）完整渲染 |
| Terminal ↔ Thread 联动 | **真实接线** | 命令完成后回写 thread timeline |
| git.types | **真实接线** | GitChangedFile / GitProjectState 正式定义 |
| git.store | **真实接线** | per-project 管理 + localStorage 持久化 |
| GitPane + 子组件 | **真实接线** | stage/unstage/revert + commitDraft 全部可用 |
| Git ↔ Thread 联动 | **真实接线** | 操作后回写 thread timeline |
| Review ↔ Git 桥接 | **真实接线** | ReviewDiffPane 中 stage/revert 同步到 git.store |
| **真实 git porcelain** | **bridge** | 当前 git store 数据和 review diff 均为手动/桥接注入，尚未对接真实 git diff/status；数据模型已就绪 |
| **真实 shell 执行** | **bridge** | terminal-runtime 为 mock 实现，Tauri 环境可接真实 command |
| **commit draft → git commit** | **bridge** | commitDraft 可编辑持久化，但尚未执行 `git commit` |

---

## 八、空状态与异常处理

### Terminal
- 无 entries → TerminalEmptyState（"Execute commands or wait for agent commands to appear here"）
- 命令失败 → 标记 failed + exitCode + thread 中有失败消息
- 切换 thread → entries 自动切换，不串线

### Git
- 无变更 → GitEmptyState（"The current project has no pending git changes to review"）
- 切换 project → files + branch + draft 自动切换
- 全部 revert 后 → 切回 empty state

---

## 九、维度关系总结

```
thread → terminal    (per-thread: entries, cwd, running)
thread → review      (per-thread: diffSet, comments, selections)
review → git         (per-project: changedFiles, staged, drafts)
git → project        (per-project: branch)
```

四层关系清晰分离，不再混在一个组件中。

---

## 十、构建验证结果

| 命令 | 结果 |
|------|------|
| `npx vue-tsc --noEmit` | **通过** — 零错误 |
| `npm run build` | **通过** — 121 modules (+26 vs Phase 4), 291ms, 249.50 KB JS + 48.56 KB CSS (gzip: 91.06 KB + 8.56 KB) |

---

## 十一、验收结果

### Terminal 主链验收
1. 打开 terminal tab — **通过**（ReviewTabs 切换）
2. 输入命令 — **通过**（input + Enter/Run button）
3. entry 创建 — **通过**（createEntry with status 'running'）
4. 流式输出 — **通过**（模拟 interval → appendOutput）
5. running → done/failed 切换 — **通过**（finishEntry/killEntry）
6. exitCode 显示 — **通过**
7. Stop 可用 — **通过**（killEntry + 清理 runningEntryId）
8. Clear 可用 — **通过**（clearThreadTerminal）
9. 切换 thread 不串线 — **通过**（per-thread entriesByThread）
10. 命令结束 thread 有反馈 — **通过**（setTerminalCallback → appendMessage 'command'）

### Git 主链验收
11. 打开 git tab — **通过**
12. branch 显示 — **通过**（GitBranchBar）
13. changed files 显示 — **通过**（GitChangedFilesList）
14. stage file 状态变化 — **通过**（staged=true + thread 消息）
15. revert file 状态变化 — **通过**（文件移除 + thread 消息）
16. stage all / revert all 可用 — **通过**（GitBranchBar 操作区）
17. commit draft 可输入保存 — **通过**（CommitDraftEditor + localStorage）
18. review pane stage/revert 同步 git — **通过**（ReviewDiffPane bridge）

### 稳定性验收
19. 无 terminal 数据时空状态 — **通过**（TerminalEmptyState）
20. 无 git 变更时 clean state — **通过**（GitEmptyState）
21. 命令失败不崩溃 — **通过**（finishEntry failed 状态）
22. git 异常不白屏 — **通过**（fallback 空状态）

### 工程验收
23. `npx vue-tsc --noEmit` 通过 — **通过**
24. `npm run build` 通过 — **通过**

---

## 十二、下一步建议（Phase 6：Skills / MCP / Browser / Computer Use 入口整合）

1. **真实 git 对接收口**：git-status.service.ts 对接真实 git diff/status，自动填充 git.store
2. **真实 shell 执行切换**：terminal-runtime.service 在 Tauri 环境切换到真实 shell
3. **commit 完整链路**：commitDraft → git commit 真执行 → thread 反馈
4. **Skills 入口**：右栏 skills tab 或独立入口，与 chat 线程联动
5. **MCP 集成**：工具调用结果的右栏展示
6. **Browser / Computer Use 预留**：artifacts tab 真实内容

---

## 十三、核心结论

本轮严格达成 Phase 5 目标：

**LingStack 首次真正具备了"执行命令 → 观察输出 → 形成变更 → 进入审查 → 准备提交"的完整工作流骨架。**

Terminal 和 Git 不再是右栏的静态占位 — TerminalPane 支持命令执行/流式输出/退出码/运行状态管理，GitPane 支持分支查看/文件变更列表/stage-unstage-revert/commit draft 编辑，且两者均与中栏 thread 双向通信。Review ↔ Git 双向桥接确保审查流程与 git 状态同步。
