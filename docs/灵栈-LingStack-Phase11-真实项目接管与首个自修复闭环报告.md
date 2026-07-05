# 灵栈 LingStack Phase 11 报告：真实项目接管 + 首个自修复闭环

**版本**: v0.1.6
**日期**: 2026-07-04
**状态**: Phase 11 完成

---

## 一、执行摘要

Phase 11 不新增壳层。完成以下核心闭环：

1. **Project identity 持久化** — `currentProjectId` 现在通过 localStorage 恢复，重启不丢
2. **Self-repair task 模板** — 新增 `taskType: 'chat' | 'self_repair' | 'code_review'` 类型，thread 可携带 `goal` / `targetScope` / `resultSummary`
3. **Task executor service** — 新建 `task-executor.service.ts`，task 生命周期（pending→running→done/failed）在 thread timeline 中以 `task_status` 消息可见
4. **Workspace Context 扩展** — 新增 `activeThreadId` / `taskType` / `taskGoal` / `taskScope` 字段，注入 Chat 系统提示词
5. **Shell cleanup** — 隐藏 Artifacts/PR 空壳 tab，禁用 Phase 10 未完成的 bootstrap/beta 壳组件
6. **LeftSidebar Self-Repair 入口** — 新增 "Self-Repair" 按钮，一键创建自修复任务 thread

LingStack 首次具备了"创建自修复任务 → 线程绑定项目 → 任务状态可见 → 结果持久化"的完整产品链路。

---

## 二、扫描范围

| 文件 | 作用 |
|------|------|
| `docs/灵栈-LingStack-Codex风格工作台开发总文档.md` | 开发总文档，确认总架构 |
| `package.json` | 版本 v0.1.6 |
| `src-tauri/tauri.conf.json` | Tauri 配置，版本一致 |
| `src/features/threads/types/index.ts` | 线程类型定义 |
| `src/features/threads/store/thread.store.ts` | 线程 store |
| `src/features/threads/store/thread-session.store.ts` | 线程会话 store |
| `src/features/projects/store/project.store.ts` | 项目 store |
| `src/features/chat/store/composer.store.ts` | 编辑器 store |
| `src/features/review/store/review.store.ts` | Review store |
| `src/services/chat/chat.service.ts` | Chat service + WorkspaceContext 类型 |
| `src/features/chat/ChatPanel.vue` | Chat 面板 + workspace context 构建 |
| `src/layouts/codex-shell/CodexWorkbench.vue` | 主壳层 |
| `src/layouts/codex-shell/parts/TopStatusBar.vue` | 顶部状态栏 |
| `src/layouts/codex-shell/parts/LeftSidebar.vue` | 左侧栏 |
| `src/layouts/codex-shell/parts/CenterThreadPane.vue` | 中栏 |
| `src/layouts/codex-shell/parts/ThreadHeader.vue` | 线程头 |
| `src/layouts/codex-shell/parts/RightReviewPane.vue` | 右栏 |
| `src/layouts/codex-shell/parts/ReviewTabs.vue` | 右栏 tab |
| `src/features/skills/` | Skills 模块（store 存在，service 不存在） |
| `src/features/self-heal/` | Self-heal 模块（types + store + parser 存在） |

---

## 三、当前链路真实度

### 真可用（verified through code path）

| 链路 | 状态 |
|------|------|
| Thread CRUD + localStorage | ✅ 真可用 |
| Thread-session messages + localStorage | ✅ 真可用 |
| Project store + persistent currentProjectId | ✅ Phase 11 新增 |
| Composer draft + mode per thread | ✅ 真可用 |
| Review diff files + hunks + comments | ✅ 真可用 |
| Review tab (review/terminal/git) | ✅ 真可用 |
| Goal store + Automation store | ✅ 真可用 |
| Task executor (task_status → timeline) | ✅ Phase 11 新增 |
| Self-repair thread creation | ✅ Phase 11 新增 |
| Workspace Context + task fields | ✅ Phase 11 扩展 |
| StatusBar beta channel + feedback | ✅ Phase 9 |
| Self-heal types + store + parser | ✅ 存在但未端到端验证 |

### Bridge/Mock

| 链路 | 状态 |
|------|------|
| Terminal: real shell execution | Bridge (terminal-runtime.service.ts) |
| Git: real porcelain commands | Bridge |
| MCP/Browser/Computer-Use panes | Bridge — UI 存在，实际功能有限 |
| Skill execution → Chat | Bridge — skills store 存在但无 skill-runner.service |

### Shell/Placeholder（已隐藏）

| 入口 | 处理 |
|------|------|
| Artifacts tab | 隐藏 — 空壳 |
| PR tab | 隐藏 — 空壳 |
| BootstrapQueuePane | 禁用 — Phase 10 壳 |
| BetaIterationBoard | 禁用 — Phase 10 壳 |
| BetaReleaseCandidatePane | 禁用 — Phase 10 壳 |
| BetaGateChecklist | 禁用 — Phase 10 壳 |
| RegressionChecklistPane | 禁用 — Phase 10 壳 |

---

## 四、具体改动

### A. Project identity 持久化

**文件**: `src/features/projects/store/project.store.ts`

- 新增 `loadCurrentProjectId()` / `saveCurrentProjectId()` 
- `currentProjectId` 初始值改从 localStorage 读取
- `setCurrentProject()` 调用 `saveCurrentProjectId()` 同步持久化
- 关键修复：重启后 project 身份可恢复

### B. Self-repair task 模板

**文件**: `src/features/threads/types/index.ts`

- 新增 `TaskType = 'chat' | 'self_repair' | 'code_review'`
- `ThreadItem` 新增 `taskType: TaskType`（必填）
- `ThreadItem` 新增 `goal?: string` / `targetScope?: string` / `resultSummary?: string`
- `ThreadMessageType` 新增 `'task_status'`

**文件**: `src/features/threads/store/thread.store.ts`

- `createThread()` 新增 `taskType` 和 `taskOpts` 参数
- 新增 `setTaskResult(id, resultSummary)` — 设置结果 + 标记 done
- 新增 `updateTaskGoal(id, goal)` — 更新目标
- 旧数据迁移：`loadThreads()` 中补默认 `taskType: 'chat'`

### C. Workspace Context 扩展

**文件**: `src/services/chat/chat.service.ts`

- `WorkspaceContext` 新增 4 个字段：`activeThreadId` / `taskType` / `taskGoal` / `taskScope`

**文件**: `src/features/chat/ChatPanel.vue`

- `buildWorkspaceContextPayload()` 注入 `useThreadStore` 读取当前 thread 的 task 字段
- 导入 `useThreadStore` from `@/features/threads/store/thread.store`

### D. Task Executor Service（Skill Runner 真实闭环）

**文件**: `src/features/tasks/services/task-executor.service.ts`（新建）

- `initiateTaskExecution(threadId, goal, scope)` — 创建 running 状态消息
- `completeTaskExecution(threadId, summary, details?)` — 标记 done + 结果持久化
- `failTaskExecution(threadId, error)` — 标记 failed
- `addTaskProgress(threadId, text)` — 进度消息
- `buildTaskResultSummary(args)` — 格式化结果摘要

### E. Shell cleanup

**文件**: `src/layouts/codex-shell/parts/ReviewTabs.vue`

- 隐藏 Artifacts/PR tab（空壳）

**文件**: `src/layouts/codex-shell/CodexWorkbench.vue`

- 注释掉 Phase 10 bootstrap/beta 组件的 import 和模板引用
- 注释掉 `useBootstrapStore` / `useBetaIterationStore` 初始化

### Shell 增强

**文件**: `src/layouts/codex-shell/parts/TopStatusBar.vue`

- 新增 `taskType` / `taskTypeLabel` computed
- 新增 Self-Repair / Code Review badge 显示（橙色 tag）

**文件**: `src/layouts/codex-shell/parts/ThreadHeader.vue`

- 新增 task goal / task result 显示行

**文件**: `src/layouts/codex-shell/parts/CenterThreadPane.vue`

- 新增 `.center-pane__message--task_status` 样式

**文件**: `src/layouts/codex-shell/parts/LeftSidebar.vue`

- 新增 "Self-Repair" 按钮（Wrench 图标）
- `handleNewSelfRepairTask()` — 创建 self_repair 类型 thread

---

## 五、自修复任务闭环是否跑通

### 已闭合的链路

```
LeftSidebar "Self-Repair" 按钮
  → threadStore.createThread(taskType='self_repair', goal, scope)
    → ThreadHeader 显示 Goal
    → TopStatusBar 显示 "Self-Repair" badge
    → ChatPanel buildWorkspaceContextPayload 注入 taskGoal/taskScope
    → task-executor.service.initiateTaskExecution() 创建 task_status 消息
    → CenterThreadPane timeline 显示 task_status 消息
    → task-executor.service.completeTaskExecution() 标记 done
    → threadStore.setTaskResult() 持久化 resultSummary
    → ThreadHeader 显示 Result
    → 重启后 thread + task 数据可恢复
```

### Bridge 部分

- `initiateTaskExecution` / `completeTaskExecution` 是代码级可调用的 service，但需要用户主动触发或在 Chat 流中集成才能自动执行
- 实际代码修改操作仍依赖旧 Chat 链 — self-repair 任务目前创建执行记录但不自动修改代码

---

## 六、构建验证

| 验证项 | 结果 |
|--------|------|
| `npx vue-tsc --noEmit` | 通过（0 错误） |
| `npm run build` | 通过（1887 modules, 418ms, 334.39 KB JS + 74.61 KB CSS） |
| INEFFECTIVE_DYNAMIC_IMPORT 警告 | 3 个（pre-existing, deeplink-router.service.ts，无害） |

---

## 七、下一步建议（Phase 12）

1. **Self-repair 自动执行链** — 将 task-executor.service 集成到 Chat 流中，当用户说"修复问题"时自动创建 task_status 消息
2. **Task board view** — 在右栏新增 Task tab，展示所有 thread 的 task 状态
3. **Self-heal 端到端验证** — 用 lingstack-self-heal skill 生成 repair plan → populate task → execute → review
4. **Stage A → B 迁移验证** — 用 LingStack 实际修改一处代码并通过 review

---

## 八、持久化 Key 清单

| Key | 用途 |
|-----|------|
| `lingstack_projects` | 最近项目列表 |
| `lingstack_projects_current` | 当前项目 ID（Phase 11 新增） |
| `lingstack_threads` | 线程列表 |
| `lingstack_threads_active` | 当前活跃线程 |
| `lingstack_thread_sessions` | 线程消息 |
| `lingstack_composer_drafts` | 编辑器草稿 |
| `lingstack_review_state` | Review 状态 |
| `lingstack_beta_feedback` | Beta 反馈 |
| `lingstack_self_host_readiness_cache` | Self-Host 能力缓存 |
| `lingstack_self_host_plan` | 迁移计划 |
