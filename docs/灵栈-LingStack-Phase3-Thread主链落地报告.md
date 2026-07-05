# 灵栈 LingStack - Phase 3 Thread 主链落地报告

**日期**: 2026-07-04
**版本**: v0.1.7 (Phase 3)
**状态**: 完成

---

## 一、本轮扫描了哪些旧组件与旧状态来源

### 旧组件
| 组件 | 扫描发现 | 处理方式 |
|------|----------|----------|
| `ThreadHeader.vue` | 纯静态展示，Pause/Stop/Review 按钮无功能 | **完全重写** - 9 个真实 action：rename/pin/archive/delete/pause/resume/stop/openReview/openTerminal |
| `ThreadComposer.vue` | Phase 2 mock bridge echo 800ms 假回复 | **接入 chat.service** - 真实 preflightSend + sendChatMessage + onToken/onComplete/onError |
| `ThreadList.vue` | 仅支持点击切换 thread，无右键菜单 | **新增右键菜单** - rename/pin/archive/delete，内联重命名，删除确认 |
| `ThreadListItem.vue` | 仅展示，无交互 | **新增** contextmenu 事件 + inline rename + isRenaming 状态 |
| `CenterThreadPane.vue` | 通过 props 传数据给 ThreadHeader | **简化** - ThreadHeader 改为自读 store，不再传 props |
| `ChatPanel.vue` | 旧版聊天视图，750 行，仍依赖旧 chat-session.store | **保留不变** - 旧版入口仍兼容，未接入新 thread 系统 |

### 旧状态来源
| 来源 | 状态 | 处理 |
|------|------|------|
| thread.store - activeThreadId | 不持久化 | **已修复** - watch 写入 `lingstack_threads_active` |
| thread-session.store - loadAllSessions | 无 corruption 防护 | **已增强** - 校验 + 过滤坏数据 + try-catch |
| composer.store - draft | 每次 setDraft 自动 persistDraft | 已满足需求 |

---

## 二、Thread 主链现在如何组织

### 数据层
```
project.store.ts          → 项目信息
thread.store.ts           → Thread 列表 + activeThreadId（持久化）
thread-session.store.ts   → 按 threadId 的消息数组（持久化 + corruption 防护）
composer.store.ts         → 按 threadId 的草稿/mode（持久化）
chat.service.ts           → 流式 API 发送
```

### 交互层（左栏 → 中栏）
```
LeftSidebar
  ├─ New Thread btn    → threadStore.createThread() → setActiveThread() → 中栏自动聚焦
  ├─ ThreadSearchBox   → thread-search.store
  └─ ThreadList        → threadStore.activeThreads
       └─ ThreadListItem
            ├─ Click        → threadStore.setActiveThread()
            └─ ContextMenu  → Rename / Pin / Archive / Delete

CenterThreadPane
  ├─ ThreadHeader      → 自读 thread/project/composer/session stores
  │    ├─ Double-click title → inline rename
  │    ├─ Pin/Unpin          → threadStore.pinThread()
  │    ├─ Pause/Resume/Stop  → threadStore.updateThreadStatus()
  │    ├─ Open Review        → reviewStore.setActiveReviewTab('review')
  │    ├─ Open Terminal      → reviewStore.setActiveReviewTab('terminal')
  │    ├─ Archive            → threadStore.archiveThread()
  │    └─ Delete             → confirm → clearMessages + clearDraft + deleteThread
  ├─ MessageTimeline  → thread-session.store.getMessages(activeThreadId)
  └─ ThreadComposer   → composer.store draft + chat.service.sendChatMessage()
       ├─ Enter send  → appendMessage(user) → preflightSend → sendChatMessage → streaming patch → done/error
       └─ Stop btn    → abortChatStream()
```

### 跨层关系
- `activeThreadId` 是唯一线程入口
- 所有消息/草稿/发送状态都围绕 `activeThreadId` 隔离
- 切换 thread 时：消息线切换、草稿恢复、composer 自动聚焦
- 右栏联动：ThreadHeader "Open Review" / "Open Terminal" 自动打开右栏

---

## 三、Thread / Message / Composer / activeThread 关联

| 操作 | 数据流 |
|------|--------|
| 新建 Thread | LeftSidebar → threadStore.createThread → setActiveThread → CenterThreadPane 渲染新 thread |
| 切换 Thread | ThreadList click → threadStore.setActiveThread → CenterThreadPane 切换消息线 + composer 恢复草稿 |
| 发送消息 | ThreadComposer.handleSend → appendMessage(user) → clearDraft → preflightSend → sendChatMessage → streaming patch(assistant) → updateThreadStatus |
| 重命名 | ThreadList 右键 / ThreadHeader 双击 → isRenaming → confirmRename → threadStore.renameThread → 左右栏同步 |
| Pin | ThreadList 右键 / ThreadHeader → threadStore.pinThread (toggle) → 列表重排 |
| Archive | ThreadList 右键 / ThreadHeader → threadStore.archiveThread → 从 activeThreads 隐藏 |
| Delete | 右键/Header → confirm → clearMessages + clearDraft + deleteThread → 自动切换到下一个或空状态 |
| 停止生成 | ThreadComposer Stop / ThreadHeader Stop → abortChatStream → updateThreadStatus('idle') |

---

## 四、持久化做到了哪些层

| 层级 | Key | 内容 | 重启恢复 |
|------|-----|------|----------|
| thread 列表 | `lingstack_threads` | ThreadItem[]（含 pinned/archived/title/status/updatedAt） | ✓ |
| activeThreadId | `lingstack_threads_active` | 最后活跃的 thread ID | ✓ |
| thread 消息 | `lingstack_thread_sessions` | Record<threadId, ThreadMessage[]> | ✓ |
| composer draft | `lingstack_composer_drafts` | Record<threadId, {draft, mode}> | ✓ |
| review state | `lingstack_review_state` | activeTab + selectedFile/Hunk | ✓ |
| terminal | `lingstack_terminal_sessions` | Record<threadId, TerminalEntry[]> | ✓ |
| project | `lingstack_projects` | ProjectItem[] (latest 20) | ✓ |

**数据损坏容错**：
- `thread-session.store.ts` 加载时校验每条消息必须有 `id` + `threadId`
- `thread.store.ts` 加载时校验数组格式
- 任何解析失败都不崩溃，静默降级为空状态

---

## 五、哪些旧组件仍是 Bridge

| 组件 | 状态 | 说明 |
|------|------|------|
| `ChatPanel.vue` | Bridge 保留 | 旧版聊天视图完整保留，通过旧 `WorkbenchLayout` 仍可访问 |
| `WorkbenchLayout.vue` | Bridge 保留 | 旧五区布局保留，`App.vue` 主入口已是 `CodexWorkbench` |
| `chat-session.store.ts` | Bridge 保留 | IndexedDB 多会话系统（ChatPanel 使用），不与新 thread 系统冲突 |

`ChatPanel` 的消息真相源已迁至 `chat-session.store`（Phase 2 完成），与 `thread-session.store` 并存但独立。

---

## 六、哪些能力刻意留到 Phase 4

| 能力 | 当前状态 | Phase 4 计划 |
|------|----------|-------------|
| Diff 数据展示 | review.store 结构完备，数据为空 | Phase 4 从 git diff 或 agent 执行结果加载真实 diff |
| Review inline comment | review.store 有 addComment/data structure | Phase 4 实现 diff viewer + inline comment UI |
| Terminal 真实执行 | terminal.store 结构完备，无真实 PTY | Phase 5 Tauri Rust 端终端实现 |
| Git 真实数据 | git.store 结构完备，无真实 git status | Phase 5 Tauri git 命令桥接 |
| 模型配置桥接 | ThreadComposer 通过 chat.service 自动读取 | Phase 4/5 可选：TopStatusBar 显示当前模型 |
| Thread 搜索 | thread-search.store 有 query/focus/results，UI 未接过滤逻辑 | Phase 4+ 实现搜索过滤 |

---

## 七、构建验证结果

```
npx vue-tsc --noEmit  →  通过（0 错误）
npm run build          →  通过（77 modules, 288ms, 231.00 KB JS + 33.69 KB CSS）
```

---

## 八、下一步建议（Phase 4 Review Pane + Diff 主链）

1. **Diff 数据源接入**：从 git diff 或 agent file 修改结果生成 ReviewFileDiff
2. **Review Diff Viewer**：双栏 diff 视图（左旧右新），支持 hunk 展开/折叠
3. **Review Inline Comment**：选中行添加评论，关联到 thread/agent 上下文
4. **Stage / Revert Hunk**：单 hunk 级别的 stage 和 revert 操作
5. **Review Tab 联动**：agent 生成 diff 后自动将 thread status 设为 ready_review，右栏自动展示
6. **Git Status Bridge**：Tauri 端读取真实 git status，填入 git.store
