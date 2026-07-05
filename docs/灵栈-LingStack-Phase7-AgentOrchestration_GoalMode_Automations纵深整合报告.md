# 灵栈 LingStack Phase 7 — Agent Orchestration / Goal Mode / Automations 纵深整合报告

> **轮次**: Phase 7 (R39)
> **日期**: 2026-07-03
> **定位**: 让 LingStack 从"具备 Codex 风格工作台外形"升级为"有任务编排、持续目标、后台自动化能力"的桌面 Agent 工作台

---

## 一、本轮扫描了哪些现有代码

### 已有基础（Phase 1-6 落地）
- `features/threads/` — thread.store + thread-session.store（消息统一回流层）
- `features/review/` — review.store + DiffViewPane / ReviewSummaryPanel
- `features/terminal/` — terminal.store + 真实 xterm.js 集成
- `features/git/` — git.store + GitStatusBar / GitDiffPane
- `features/self-heal/` — self-heal.store + TaskBoard
- `features/skills/` — skills.store（壳层，hydrate 待完善）
- `layouts/codex-shell/` — 14 个组件（LeftSidebar / ThreadHeader / TopStatusBar / CenterThreadPane / StatusBar 等）

### 新建模块（Phase 7）
- `features/agent/` — orchestration 类型 + store + service + 3 个组件
- `features/goals/` — goal 类型 + store + service + 3 个组件
- `features/automations/` — automation 类型 + store + 2 个 service + 4 个组件

---

## 二、新建/重构文件清单（20 个新文件 + 3 个修改）

### features/agent/（6 个新文件）
| 文件 | 大小 | 职责 |
|------|------|------|
| `types/orchestration.types.ts` | 744B | OrchestrationStepType / OrchestrationStatus / OrchestrationStep / ThreadOrchestrationState |
| `store/orchestration.store.ts` | 4.7KB | Pinia store，localStorage 持久化，完整 step 生命周期管理 |
| `services/orchestration.service.ts` | 2.7KB | 桥接 orchestration ↔ thread-session，记录系统事件 |
| `components/AgentRunStatusBar.vue` | 3.0KB | 紧凑状态栏（彩色圆点 + 状态 + 当前步骤 + 步骤计数） |
| `components/AgentTaskQueue.vue` | 3.6KB | 步骤列表（类型图标 + 标题 + 状态徽章 + 时间） |
| `components/AgentExecutionSummary.vue` | 2.8KB | 执行摘要（完成/失败/跳过计数 + 总耗时） |

### features/goals/（6 个新文件）
| 文件 | 大小 | 职责 |
|------|------|------|
| `types/goal.types.ts` | 291B | GoalStatus / GoalItem |
| `store/goal.store.ts` | 3.3KB | Pinia store，localStorage 持久化，完整 goal 生命周期 |
| `services/goal-progress.service.ts` | 1.7KB | 桥接 goal ↔ thread-session，记录 goal 事件 |
| `components/GoalProgressRow.vue` | 2.8KB | 紧凑进度条行（28px，适合嵌入 ThreadHeader） |
| `components/GoalInspector.vue` | 8.4KB | 右侧面板（详情 + Pause/Resume/Complete/Block 操作） |
| `components/GoalEmptyState.vue` | 5.4KB | 空状态 + 内联创建表单 |

### features/automations/（8 个新文件）
| 文件 | 大小 | 职责 |
|------|------|------|
| `types/automation.types.ts` | 585B | AutomationStatus / AutomationRunStatus / AutomationItem / AutomationRunRecord |
| `store/automation.store.ts` | 4.7KB | Pinia store，双 localStorage 持久化（automations + runs） |
| `services/automation-runner.service.ts` | 2.6KB | 执行服务：创建 thread → 入队 → 模拟执行 → 记录结果 |
| `services/automation-persistence.service.ts` | 1.3KB | 导入/导出 JSON + 清除历史 |
| `components/AutomationListPane.vue` | 8.2KB | 主列表（toggle + 运行 + 删除 + 空状态 + 编辑器） |
| `components/AutomationEditor.vue` | 5.4KB | 创建/编辑表单（name/prompt/schedule/threadMode） |
| `components/AutomationRunHistory.vue` | 4.3KB | 运行历史（状态徽章 + 时间 + summary + threadId） |
| `components/AutomationEmptyState.vue` | 1.4KB | 空状态 |

### Shell 集成修改（3 个文件）
| 文件 | 改动 |
|------|------|
| `layouts/codex-shell/parts/LeftSidebar.vue` | Tools 区新增 Automations 入口 |
| `layouts/codex-shell/parts/ThreadHeader.vue` | 新增 GoalProgressRow + AgentRunStatusBar 行 |
| `layouts/codex-shell/parts/TopStatusBar.vue` | 新增 Goal 摘要 + Automation 运行数 + Agent 状态增强 |

---

## 三、Orchestration 如何组织

**产品定位**：不是"神秘 AI 黑盒"，而是"当前 thread 正在执行什么、处于哪一阶段、是否在等待/排队/完成"。

**状态中枢**：`orchestration.store.ts` 管理 `orchestrationByThread`（Record<threadId, ThreadOrchestrationState>），每个 thread 有独立的 orchestration 状态。

**Step 生命周期**：pending → running → done/failed/skipped

**与 thread 的关系**：orchestration 事件通过 `orchestration.service.ts` 桥接到 `thread-session.store`，以 system 消息形式出现在 thread timeline。

---

## 四、Goal 如何组织

**产品定位**：不是一条普通聊天消息，而是"持续目标、可暂停/恢复、有进度、有阶段"。

**状态中枢**：`goal.store.ts` 管理 `goals: GoalItem[]`，通过 `goalsByThread(threadId)` 查询。

**生命周期**：inactive → active → paused/done/blocked

**UI 接点**：
- ThreadHeader 内嵌 GoalProgressRow（28px 紧凑行）
- GoalInspector 作为右侧面板（详情 + 操作）
- GoalEmptyState 用于无 goal 时的创建入口

---

## 五、Automation 如何组织

**产品定位**：不是单纯计划任务页面，而是"定时或条件触发的后台 thread 运行器"。

**最小运行策略**：
1. 支持"手动运行一次"（已实现）
2. 支持 schedule 字段保存（已实现）
3. 运行时创建 thread + 记录 run history（已实现，模拟执行 2-3s）
4. 结果关联 threadId（已实现）

**与 thread/orchestration 的关系**：automation 运行时创建 thread → orchestration 进入 running → 完成后改为 done/failed。

---

## 六、哪些部分是真接线，哪些仍是 bridge/mock

| 部分 | 状态 | 说明 |
|------|------|------|
| orchestration store | ✅ 真实 | localStorage 持久化 + 完整 step 生命周期 |
| orchestration → thread-session | ✅ 真实 | system 消息通过 appendMessage 写入 |
| goal store | ✅ 真实 | localStorage 持久化 + 完整 goal 生命周期 |
| goal → thread-session | ✅ 真实 | goal 事件通过 appendMessage 写入 |
| automation store | ✅ 真实 | 双 localStorage 持久化 |
| automation runner | ⚠️ 模拟 | 创建 thread 是真的，但执行是 setTimeout 模拟（2-3s，90% 成功率） |
| automation → thread | ✅ 真实 | run record 关联 threadId |
| automation → orchestration | ⚠️ 预留 | 结构已就位，但 runner 未显式调用 orchestration store |
| goal → orchestration | ⚠️ 预留 | orchestration 有 goal step type，但未自动联动 |
| shell 集成 | ✅ 真实 | LeftSidebar / ThreadHeader / TopStatusBar 已接入 |

---

## 七、构建验证结果

```
npm run build → exit code 0 ✅
```

vue-tsc + vite build 全部通过。

---

## 八、下一步建议（Phase 8）

1. **Polish + Deep Link + Keyboard Shortcuts + Release Hardening**
2. **Automation runner 真实化**：接入真实 Chat API 而非 setTimeout 模拟
3. **Goal ↔ Orchestration 联动**：goal 进度自动推动 orchestration step
4. **Skills store hydrate 修复**：当前 CodexWorkbench.vue 调用 `skillsStore.hydrate?.()` 但 store 未导出该方法
5. **SettingsPanel tabs 补全**：'integrations' / 'skills' tab 被注释，需正式接入
6. **vue-tsc 严格模式**：当前 vue-tsc 有 146 个 trace 日志但 0 error，可考虑收紧配置
