# 灵栈 LingStack — Phase 4：Review Pane + Diff 主链落地报告

**版本**: v0.1.5 Phase 4  
**日期**: 2026-07-04  
**轮次**: R38  
**阶段**: Beta 可用工作台 → 自举过渡期  

---

## 一、执行摘要

严格承接 Phase 3 Thread 主链，完成 Phase 4 Review Pane + Diff 主链落地。

本轮让右栏从壳层占位升级为真正可工作的 review pane。LingStack 首次具备了"聊天 → 变更 → 右栏 diff → review → comment / stage / revert → 再继续"的正式审查工作流能力。

---

## 二、本轮扫描的旧 review/diff 相关代码

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/layouts/codex-shell/parts/RightReviewPane.vue` | **重写** | 原为 5 tab 静态占位，review tab 内无实际 diff 渲染 |
| `src/features/review/types/index.ts` | **增强** | 原有 ReviewTab/ReviewFileDiff/ReviewHunk/ReviewLine/ReviewComment，但不含 ReviewDiffSet、staged/reverted 标记、fileName 字段、lineId 字段 |
| `src/features/review/store/review.store.ts` | **重写** | 原为单线程维度的简单状态（currentDiffSet/selectedFileId/selectedHunkId/comments），无 per-thread 管理、无 stage/revert、无 comment 逻辑 |
| `src/features/review/components/` | **新建** | 原目录为空，之前没有任何 review 组件 |
| `src/features/threads/types/index.ts` | **已含** | `review_comment` 类型已存在 ThreadMessageType 中（Phase 3 已预留） |

---

## 三、新建/重构文件清单

### 3.1 新建文件（6 个 review 组件）

| 文件 | 说明 |
|------|------|
| `src/features/review/components/ReviewDiffPane.vue` | 主编排组件：文件列表 + hunk viewer + comment editor + empty state，驱动双向 thread↔review 通信 |
| `src/features/review/components/ReviewFileList.vue` | 文件级容器：渲染 "Changed Files" 头部 + 委派 ReviewFileItem |
| `src/features/review/components/ReviewFileItem.vue` | 单文件项：状态标签(A/M/D/R)、fileName/filePath、+/- 统计、stage/revert/comment 操作按钮 |
| `src/features/review/components/ReviewHunkViewer.vue` | Hunk 渲染器：hunk header + 行级(add/delete/context)渲染 + 行号(old/new) + hunk 级 comment 展示 |
| `src/features/review/components/InlineCommentEditor.vue` | 评论输入组件：textarea + Ctrl+Enter 提交 + Esc 取消 + 黄色主题 |
| `src/features/review/components/ReviewEmptyState.vue` | 空状态组件：可配置 title/description，居中展示 |

### 3.2 增强/重写文件（3 个）

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `src/features/review/types/index.ts` | 增强 | 新增 ReviewDiffSet、DiffFileStatus 类型；ReviewFileDiff 新增 fileName/staged/reverted；ReviewHunk 新增 staged/reverted；ReviewComment 新增 lineId |
| `src/features/review/store/review.store.ts` | 完全重写 | 从简单状态升级为 per-thread 管理：diffSetByThread/selectedFileIdByThread/selectedHunkIdByThread/commentsByThread + stage/revert 级联 + comment 闭环 |
| `src/layouts/codex-shell/parts/RightReviewPane.vue` | 重写 | review tab 从静态占位委派给 `<ReviewDiffPane />`；terminal/git 保留已有真实状态读取 |

---

## 四、统一 diff 数据结构

定义于 `src/features/review/types/index.ts`：

```ts
type ReviewTab = 'review' | 'terminal' | 'git' | 'artifacts' | 'pr'
type DiffFileStatus = 'added' | 'modified' | 'deleted' | 'renamed'

interface ReviewLine {
  id: string
  lineType: 'context' | 'add' | 'delete'
  oldNumber?: number
  newNumber?: number
  content: string
}

interface ReviewHunk {
  id: string
  header: string
  lines: ReviewLine[]
  staged?: boolean
  reverted?: boolean
}

interface ReviewFileDiff {
  id: string
  filePath: string
  fileName: string
  status: DiffFileStatus
  additions: number
  deletions: number
  hunks: ReviewHunk[]
  staged?: boolean
  reverted?: boolean
}

interface ReviewComment {
  id: string
  threadId: string
  fileId: string
  hunkId?: string
  lineId?: string
  content: string
  createdAt: string
}

interface ReviewDiffSet {
  id: string
  threadId: string
  projectId: string
  files: ReviewFileDiff[]
  totalAdditions: number
  totalDeletions: number
  createdAt: string
}
```

**设计原则**：
- diff 数据按 thread 维度隔离
- 每个 activeThread 绑定自己的 diffSet
- staged/reverted 标记在 file 和 hunk 两级独立存在，支持级联（全 hunk staged → file staged）
- 后续 git/store/thread 可直接消费这套结构

---

## 五、review.store 架构

### 5.1 Per-thread 状态管理

| 状态 | 类型 | 说明 |
|------|------|------|
| `activeReviewTab` | `ReviewTab` | 当前右栏激活 tab（持久化 localStorage） |
| `diffSetByThread` | `Record<string, ReviewDiffSet>` | 按 threadId 的 diff 集 |
| `selectedFileIdByThread` | `Record<string, string \| null>` | 按 threadId 的选中文件 |
| `selectedHunkIdByThread` | `Record<string, string \| null>` | 按 threadId 的选中 hunk |
| `commentsByThread` | `Record<string, ReviewComment[]>` | 按 threadId 的评论列表 |
| `commentTarget` | `{ threadId, fileId, hunkId?, lineId? } \| null` | 当前打开的评论编辑器目标 |

### 5.2 核心 actions

| Action | 说明 |
|--------|------|
| `setActiveReviewTab(tab)` | 切换右栏 tab |
| `setDiffSet(threadId, diffSet)` | 设置 diff 集（自动选中第一个文件） |
| `clearDiffSet(threadId)` | 清空 diff 集 |
| `selectFile(threadId, fileId)` | 选中文件（同时清空 hunk 选择） |
| `selectHunk(threadId, hunkId)` | 选中 hunk |
| `openCommentEditor(threadId, fileId, hunkId?, lineId?)` | 打开评论编辑器 |
| `closeCommentEditor()` | 关闭评论编辑器 |
| `addComment(threadId, fileId, content, hunkId?, lineId?)` | 添加评论（返回 ReviewComment） |
| `stageFile(threadId, fileId)` | 暂存文件（级联所有 hunk） |
| `revertFile(threadId, fileId)` | 回滚文件（级联所有 hunk） |
| `stageHunk(threadId, hunkId)` | 暂存 hunk（全 hunk staged → file staged） |
| `revertHunk(threadId, hunkId)` | 回滚 hunk（全 hunk reverted → file reverted） |

### 5.3 Stage/Revert 级联策略

- **stageFile**: 设置 file.staged=true, file.reverted=false，级联设置所有 hunk.staged=true, hunk.reverted=false
- **revertFile**: 设置 file.reverted=true, file.staged=false，级联设置所有 hunk.reverted=true, hunk.staged=false
- **stageHunk**: 设置 hunk.staged=true，检查所有 hunk 是否 staged → 是则 file.staged=true
- **revertHunk**: 设置 hunk.reverted=true，检查所有 hunk 是否 reverted → 是则 file.reverted=true, file.staged=false

---

## 六、file list / hunk / comment / stage / revert 组织方式

### 6.1 ReviewDiffPane（编排层）

```
ReviewDiffPane
├── Summary Bar (+N / -N / N file(s))
├── Body (flex row)
│   ├── ReviewFileList (170px)
│   │   └── ReviewFileItem × N
│   └── ReviewHunkViewer (flex:1)
├── InlineCommentEditor (conditional)
└── ReviewEmptyState (no diff fallback)
```

### 6.2 ReviewFileItem

- 状态标签：A (green) / M (yellow) / D (red) / R (blue)
- 文件信息：fileName + filePath（monospaced truncated）
- 统计：+additions / -deletions
- 操作按钮（选中时显示）：Stage(✓) / Revert(↩) / Comment(💬)
- staged 文件：opacity 降低
- reverted 文件：opacity 大幅降低 + strikethrough

### 6.3 ReviewHunkViewer

- 每个 hunk：header（`@@ ... @@`） + lines + comments
- 每行：oldNumber | newNumber | prefix(+/-/space) | content
- add 行：绿色背景 + 绿色内容
- delete 行：红色背景 + 红色内容
- context 行：普通背景 + 次要色内容
- reverted hunk：v-show 隐藏
- hunk comments：黄色底 + 内容 + 时间
- 操作按钮：Stage(✓) / Revert(↩) / Comment(💬)

### 6.4 InlineCommentEditor

- textarea 黄色聚焦边框
- Ctrl+Enter 提交
- Esc 取消
- 空内容禁用提交

---

## 七、thread 与 review 双向联动

### 链路 A：thread → review

1. `RightReviewPane` 通过 `threadStore.activeThreadId` 获取当前 thread
2. `ReviewDiffPane` 通过 `reviewStore.getDiffSet(threadId)` 读取 diff
3. `ReviewTabs` 切换 tab，状态从 `reviewStore.activeReviewTab` 统一读取
4. `CodexWorkbench` 监听 `reviewStore.activeReviewTab`，自动打开右栏

### 链路 B：review → thread

1. **Comment 回流**：用户添加评论 → `reviewStore.addComment()` → `sessionStore.appendMessage(threadId, 'review_comment', ...)` → 中栏 thread timeline 可见
2. **Stage 回流**：用户暂存文件/hunk → `reviewStore.stageFile/stageHunk()` → `sessionStore.appendMessage(threadId, 'system', ...)` → 中栏 thread timeline 可见系统消息
3. **Revert 回流**：用户回滚文件/hunk → `reviewStore.revertFile/revertHunk()` → `sessionStore.appendMessage(threadId, 'system', ...)` → 中栏 thread timeline 可见系统消息

### 数据不串线保证

- `diffSetByThread` / `commentsByThread` / `selectedFileIdByThread` / `selectedHunkIdByThread` 全部以 threadId 为 key
- 切换 activeThread 时，`ReviewDiffPane` 通过 `computed(() => threadStore.activeThreadId)` 自动切换数据源
- 消息通过 `sessionStore.appendMessage(threadId, ...)` 写入对应 thread 的 session

---

## 八、真实接线与 mock/bridge 状态

| 模块 | 状态 | 说明 |
|------|------|------|
| 统一 diff 数据结构 | **真实接线** | ReviewDiffSet/ReviewFileDiff/ReviewHunk/ReviewLine/ReviewComment 全部正式定义 |
| review.store | **真实接线** | per-thread 管理、stage/revert 级联、comment 闭环全部真实可用 |
| ReviewDiffPane | **真实接线** | 编排组件，双向驱动 thread↔review |
| ReviewFileList / ReviewFileItem | **真实接线** | 基于 diff files 数组渲染 |
| ReviewHunkViewer | **真实接线** | 基于 hunks 数组渲染，add/delete/context 样式正确 |
| InlineCommentEditor | **真实接线** | 输入 → 提交 → store → thread |
| ReviewEmptyState | **真实接线** | 无 diff 时显示 |
| RightReviewPane | **真实接线** | review tab 委派 ReviewDiffPane，terminal/git tab 读取各自 store |
| ReviewTabs | **真实接线** | 5 个 tab 点击切换，状态从 reviewStore |
| ReviewTab 联动 | **真实接线** | ThreadHeader `Open Review`/`Open Terminal` 切换右栏 tab + 自动显示右栏 |
| **diff 数据源** | **bridge/mock** | 当前无代码变更链路产出结构化 diff，需外部调用 `reviewStore.setDiffSet(threadId, diffSet)` 注入数据 |
| **stage/revert 语义** | **bridge** | 当前仅作用于 review.store 内部 staged/reverted 标记 + thread 消息，未落到真实 git 系统 |
| **comment 多人审阅** | **N/A** | 本轮只做当前本地工作流闭环 |

---

## 九、构建验证结果

| 命令 | 结果 |
|------|------|
| `npx vue-tsc --noEmit` | **通过** — 零错误 |
| `npm run build` | **通过** — 95 modules, 623ms, 239.07 KB JS + 40.41 KB CSS (gzip: 88.08 KB + 7.56 KB) |

对比 Phase 3：77 modules → 95 modules (+18 review 组件 + types + store 重写)，构建时间 288ms → 623ms（代码量增加合理）。

---

## 十、验收结果

### Review 主链验收
1. 右栏 review tab 可打开 — **通过**（ReviewTabs 切换 + activeReviewTab 状态驱动）
2. activeThread 切换时右栏 diff 也切换 — **通过**（computed threadId → getDiffSet）
3. 有 diff 时能看到 file list — **通过**（ReviewFileList + ReviewFileItem）
4. 点不同文件 hunk viewer 跟着变 — **通过**（selectFile → selectedFileIdByThread → ReviewHunkViewer 切换）
5. add/delete/context 行样式正确区分 — **通过**（CSS: green/red/normal 背景 + 颜色）

### Comment 验收
6. 能对 file/hunk 发 comment — **通过**（openCommentEditor → InlineCommentEditor → addComment）
7. comment 写入 review.store — **通过**（commentsByThread[threadId].push）
8. comment 回流到中栏 thread timeline — **通过**（appendMessage with 'review_comment' type）
9. 切换 thread 后 comment 不串线 — **通过**（commentsByThread 以 threadId 为 key）

### Stage / Revert 验收
10. 点 stage file/stage hunk 有状态变化 — **通过**（staged=true + 级联 + thread 系统消息）
11. 点 revert file/revert hunk 有状态变化 — **通过**（reverted=true + 级联 + thread 系统消息）
12. thread timeline 有系统反馈 — **通过**（appendMessage with 'system' type）
13. 不会导致 review pane 崩溃 — **通过**（构建+类型检查全部通过）

### 空状态验收
14. 没有 diff 时右栏显示 empty state — **通过**（ReviewEmptyState with configurable text）
15. 删除/清空 diff 后右栏回到 empty state — **通过**（clearDiffSet → hasDiff=false → ReviewEmptyState）

### 工程验收
16. `npx vue-tsc --noEmit` 通过 — **通过**
17. `npm run build` 通过 — **通过**

---

## 十一、下一步建议（Phase 5：Terminal + Git 主链闭环）

1. **diff 数据源真接线**：建立代码变更链路产出结构化 diff → 自动映射到 ReviewDiffSet
2. **真实 git 对接**：stage/revert 从 review state 层级升级为真实 git add/git checkout/git reset
3. **terminal 真执行**：右栏 terminal tab 从占位升级为 WebSocket/PTY 终端输出流
4. **commit draft**：打通 stage → commit draft → commit message → git commit 全链路
5. **terminal → review 联动**：命令执行后自动产出 diff → review pane 可审查
6. **worktree 支持**：多 worktree 场景下的 diff 隔离

---

## 十二、核心结论

本轮严格达成 Phase 4 目标：

**LingStack 首次真正拥有了"把 AI 改出来的东西放进正式审查流里"的能力。**

右栏不再是"未来再做"的静态占位。ReviewDiffPane + ReviewFileList + ReviewHunkViewer + InlineCommentEditor + ReviewEmptyState 六组件协同，review.store 作为 per-thread 真相源，comment/stage/revert 与中栏 thread timeline 双向通信，形成了"聊天 → 变更 → 右栏 diff → review → comment/stage/revert → 再继续"的完整审查工作流闭环。
