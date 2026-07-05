# 灵栈 LingStack - Phase 2 核心 Stores 重构报告

**日期**: 2026-07-04
**版本**: v0.1.6 (Phase 2)
**状态**: 完成

---

## 一、本轮扫描了哪些旧状态来源

### 1.1 旧 stores
| Store | 位置 | 发现 |
|-------|------|------|
| `navigation.store.ts` | `features/navigation/store/` | 混入了 projectPath / projectName / hasOpenProject 等非导航核心状态 |
| `workspace.store.ts` | `features/workspace/store/` | 混入了 activeProject / recentProjects 等项目管理状态 |
| `model-configs.store.ts` | `features/settings/store/` | 模型配置管理，本轮不重做，后续 Phase 3 通过 bridge 读取 |
| `terminal.store.ts` (旧) | `features/terminal/store/` | 仅包含 `isOpen` toggle，无命令执行记录 |

### 1.2 旧组件本地状态
| 组件 | 问题状态 | 迁移方案 |
|------|----------|----------|
| `ChatPanel.vue` | messages/inputText/isSending 已迁至 chat-session.store | 归档为旧版视图，保留兼容 |
| `ThreadList.vue` | 3 条硬编码 mock 数据 | 已接 thread.store |
| `ThreadComposer.vue` | 本地 draft/mode/isSending ref | 已接 composer.store + thread-session.store |
| `CenterThreadPane.vue` | 纯占位组件，无数据 | 已接 thread/thread-session/project stores |
| `RightReviewPane.vue` | 本地 activeTab ref，5 个空 Tab | 已接 review/terminal/git stores |
| `ProjectSwitcher.vue` | 静态占位 UI | 已接 project.store |
| `TopStatusBar.vue` | 静态占位 UI | 已接 project/thread stores |

---

## 二、新建/重构了哪些 Store

### 2.1 新建 stores（7 个）

| Store | 文件路径 | 职责 |
|-------|----------|------|
| `project.store.ts` | `src/features/projects/store/` | 当前项目、最近项目、项目元信息管理 |
| `thread.store.ts` | `src/features/threads/store/` | Thread 列表、activeThread、创建/切换/重命名/pin/archive/delete |
| `thread-session.store.ts` | `src/features/threads/store/` | 按 threadId 维度的消息流，appendMessage/patchMessage/clearThreadMessages |
| `thread-search.store.ts` | `src/features/threads/store/` | 搜索查询、焦点状态、搜索结果 |
| `composer.store.ts` | `src/features/chat/store/` | 按 threadId 维度的草稿/mode/attachments |
| `review.store.ts` | `src/features/review/store/` | 右栏 review tab 状态、diff 数据集、选中文件/hunk、评论 |
| `git.store.ts` | `src/features/git/store/` | branch、changedFiles、stagedFiles、commitDraft |

### 2.2 重写 stores（1 个）

| Store | 说明 |
|-------|------|
| `terminal.store.ts` | 完全重写：从 isOpen toggle → 按 threadId 维度的命令执行记录（appendEntry/appendOutput/finishEntry/killEntry） |

### 2.3 增强 stores（1 个）

| Store | 增强内容 |
|-------|----------|
| `chat-session.store.ts` | 新增 abortController 按 session 管理（registerAbortController/removeAbortController/abortSession），为 Phase 3 流式请求做准备 |

### 2.4 新建 types 文件（3 个）

| 文件 | 导出类型 |
|------|----------|
| `src/features/projects/types/index.ts` | `ProjectItem`, `ProjectKind` |
| `src/features/threads/types/index.ts` | `ThreadItem`, `ThreadStatus`, `ThreadMode`, `ThreadMessage`, `ThreadMessageType` |
| `src/features/review/types/index.ts` | `ReviewTab`, `ReviewFileDiff`, `ReviewHunk`, `ReviewLine`, `ReviewComment` |

---

## 三、每个 Store 的职责边界

### project.store.ts
- `currentProjectId` / `recentProjects`（localStorage: `lingstack_projects`）
- `setCurrentProject()` / `addRecentProject()` / `removeRecentProject()`
- Getters: `currentProject`, `currentProjectPath`, `currentProjectName`, `currentBranch`

### thread.store.ts
- `threads` / `activeThreadId`（localStorage: `lingstack_threads`）
- `createThread()` / `setActiveThread()` / `renameThread()` / `pinThread()` / `archiveThread()` / `deleteThread()` / `updateThreadStatus()`
- Getters: `activeThread`, `pinnedThreads`, `activeThreads`, `threadsByProject`

### thread-session.store.ts
- `messagesByThread`（localStorage: `lingstack_thread_sessions`）
- `appendMessage()` / `patchMessage()` / `patchLastMessage()` / `clearThreadMessages()`
- Getters: `getMessages(threadId)`, `getMessageCount(threadId)`

### chat-session.store.ts（现有，增强）
- 维持现有功能：sessions, messages, inputText, isSending, currentSampleId（IndexedDB）
- 新增：`registerAbortController()` / `removeAbortController()` / `abortSession()`

### composer.store.ts
- `draftByThread` / `modeByThread` / `attachmentsByThread`（localStorage: `lingstack_composer_drafts`）
- `setDraft()` / `clearDraft()` / `setMode()` / `addAttachment()` / `removeAttachment()`

### review.store.ts
- `activeReviewTab` / `currentDiffSet` / `selectedFileId` / `selectedHunkId` / `comments`
- `setActiveReviewTab()` / `setDiffSet()` / `selectFile()` / `selectHunk()` / `addComment()`
- 持久化: `lingstack_review_state`（activeTab + selectedFileId + selectedHunkId）

### terminal.store.ts（重写）
- `entriesByThread` / `isOpen`（localStorage: `lingstack_terminal_sessions`）
- `appendEntry()` / `appendOutput()` / `finishEntry()` / `killEntry()` / `clearThreadTerminal()`

### git.store.ts
- `currentBranch` / `changedFiles` / `stagedFiles` / `commitDraft`
- `stageFile()` / `unstageFile()` / `stageAll()` / `unstageAll()` / `setCommitDraft()`
- Getters: `hasChanges`, `hasStaged`, `unstagedFiles`, `changeCount`, `stagedCount`

### thread-search.store.ts
- `query` / `isFocused` / `results`
- `setQuery()` / `setFocused()` / `setResults()` / `clear()`

---

## 四、哪些旧组件已切换到新 Store

| 组件 | 切换内容 |
|------|----------|
| `CodexWorkbench.vue` | onMounted 中 hydrate 所有 6 个 stores（project/thread/thread-session/composer/review/terminal） |
| `ProjectSwitcher.vue` | 从 project.store 读取 currentProjectName / currentProjectPath，"Open Folder" 写入 addRecentProject |
| `LeftSidebar.vue` | "New Thread" 按钮调用 threadStore.createThread() |
| `ThreadList.vue` | 移除 mock 数据，从 threadStore.activeThreads 动态渲染 |
| `ThreadSearchBox.vue` | 绑定 thread-search.store 的 query / isFocused |
| `CenterThreadPane.vue` | 从 thread.store + thread-session.store 读取 activeThread 和消息列表渲染 |
| `ThreadComposer.vue` | 从 composer.store 读写 draftByThread / modeByThread，从 thread-session.store 写入用户消息 |
| `RightReviewPane.vue` | 从 review.store 控制 activeReviewTab，从 terminal.store 读取命令记录，从 git.store 读取文件变更 |
| `TopStatusBar.vue` | 从 project.store 读取 projectPath，从 thread.store 读取 activeThread title |
| `ReviewTabs.vue` | Props/Emits 类型从 `string` 升级为 `ReviewTab` |
| `ThreadListItem.vue` | 新增 `isActive` prop，active 视觉反馈 |

---

## 五、哪些地方仍是 Bridge 过渡

| 过渡项 | 说明 | 计划 |
|--------|------|------|
| ThreadComposer.handleSend() | 发送走的是 mock echo，非真实 chat.service 调用 | Phase 3 接入 chat.service 流式发送 |
| RightReviewPane diff 数据 | review.store 持有 `currentDiffSet` 但当前无真实数据源 | Phase 4 从 git / agent 执行结果加载 |
| git.store changedFiles | 结构完备但无真实 git status 读取 | Phase 5 Tauri Rust 端 git 命令桥接 |
| terminal.store entries | 结构完备但无真实 PTY/子进程执行 | Phase 5 Tauri 端 terminal 实现 |
| TopStatusBar model 字段 | 硬编码显示 "—" | Phase 3 桥接 model-configs.store 读 activeConfig |
| chat-session.store（旧） | 维持 ChatPanel.vue 兼容，IndexedDB 多会话系统 | Phase 3 决定是否统一到 thread-session.store |
| ChatPanel.vue | 旧版视图保留，未接入新 thread 系统 | 后续可归档 |

---

## 六、持久化策略

| localStorage Key | 内容 | Store |
|------------------|------|-------|
| `lingstack_projects` | ProjectItem[] | project.store |
| `lingstack_threads` | ThreadItem[] | thread.store |
| `lingstack_thread_sessions` | Record<string, ThreadMessage[]> | thread-session.store |
| `lingstack_composer_drafts` | Record<string, {draft, mode}> | composer.store |
| `lingstack_review_state` | {activeTab, selectedFileId, selectedHunkId} | review.store |
| `lingstack_terminal_sessions` | Record<string, TerminalEntry[]> | terminal.store |
| `lingstack_chat` (IndexedDB) | sessions + meta | chat-session.store（旧，保留） |

所有新建 stores 均在 constructor 中自动从 localStorage 恢复，hydrate() 可作为生命周期手动触发。

---

## 七、构建验证结果

```
npx vue-tsc --noEmit  →  通过（0 错误）
npm run build          →  通过（75 modules, 261ms, 211.75 kB JS + 30.07 kB CSS）
```

---

## 八、下一步建议（Phase 3 Thread 主链）

1. **接入 chat.service 流式发送**：ThreadComposer.handleSend() → chat.service.sendChatMessage() 真实 API
2. **流式 token 写入 thread-session.store**：onToken 回调 → appendMessage + patchMessage 增量更新
3. **AbortController 管理**：注册到 chat-session.store.abortSession
4. **Thread 状态自动切换**：idle → running → done / failed
5. **模型桥接**：TopStatusBar 和 ThreadComposer 读取 model-configs.store.activeConfig
6. **Workspace Context 注入**：将当前 project + active file 上下文注入到 chat.service
7. **LeftSidebar 完整操作**：pin/archive/rename/delete 右键菜单或更多操作
8. **消息持久化可靠性**：评估是否将 thread-session.store 迁移到 IndexedDB
