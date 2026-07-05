# 灵栈 LingStack  Phase 10: 自举开发闭环与正式Beta迭代制度报告

**日期**: 2026-07-04
**版本**: v0.1.6 (Phase 10)
**当前 Phase**: Self-bootstrap transition (自举开发过渡期)

---

## 一、本轮目标与成果概要

### 目标
将前 1~9 阶段形成的工作台、主链、反馈回路制度化，升级为：
1. 可持续运转的自举开发闭环
2. 可长期执行的 Beta 迭代制度
3. 可被多助手/多人协同遵守的发布与回归纪律

### 成果
- 建立了完整的 `bootstrap` feature（types + store + services + 组件）
- 建立了 `beta-iteration` feature（types + store + services + 4 组件）
- feedback  bootstrap task  thread  review  gate  release 链完整
- Release Gate Checklist（13 项）、Regression Checklist（14 项）已固化
- 版本准入判定逻辑（ready/partial/blocked）已实现
- StatusBar 新增 bootstrap queue 数量 + beta iteration 状态
- Settings 新增 Bootstrap/Beta 管理选项卡
- 所有数据 localStorage 持久化（3 个独立 key）
- vue-tsc + npm run build 全部通过（0 error）

---

## 二、扫描的现有代码

| 文件/目录 | 状态 | 处理方式 |
|-----------|------|----------|
| `src/features/beta/` | beta-feedback.store.ts + .types.ts 存在（Phase 9），无 components | 在其同级扩展 beta-iteration 系列 |
| `src/features/automations/` | 完整 feature（store + service + 4 components） | 保留不动 |
| `src/features/goals/` | 完整 feature | 保留不动 |
| `src/layouts/codex-shell/CodexWorkbench.vue` | Phase 6-9 已集成的 shell | 新增 bootstrap/beta pane 路由 |
| `src/layouts/codex-shell/parts/StatusBar.vue` | 已有 feedback 计数 | 新增 bootstrap queue + iteration 状态 |
| `src/features/settings/` | 已有 beta/self-host tab | 新增 bootstrap tab |
| `src/features/threads/store/thread.store.ts` | 已有 createThread | 修复 pre-existing TS 类型错误 |

Phase 7-8 报告存在，Phase 9 报告不存在（仅有实际代码：betafeedback/changelog/self-host等）。

---

## 三、新建文件清单

### 3.1 Bootstrap feature（自举开发闭环）

| 文件 | 说明 |
|------|------|
| `src/features/bootstrap/bootstrap.types.ts` | BootstrapTaskItem 接口：id/source/title/description/type/status/relatedThreadId/priority/createdAt |
| `src/features/bootstrap/store/bootstrap.store.ts` | Pinia store：任务 CRUD、状态流转（todoqueuedin_progressreviewingdone/blocked）、衍生（deriveFromFeedback/deriveFromSelfHostGap）、thread 绑定、localStorage 持久化 |
| `src/features/bootstrap/services/bootstrap-planner.service.ts` | Feedback  Task 规划器（planFromFeedback + mapFeedbackType） |
| `src/features/bootstrap/services/bootstrap-readiness.service.ts` | 就绪度计算 calcReadiness（P0=blocked, inProgress=partial, 否则 ready） |
| `src/features/bootstrap/components/BootstrapQueuePane.vue` | 自举任务队列面板：P0 警告、新增任务表单、任务卡片（状态点+优先级色条+操作按钮）、空状态 |

### 3.2 Beta-Iteration feature（Beta 迭代制度）

| 文件 | 说明 |
|------|------|
| `src/features/beta/beta-iteration.types.ts` | BetaIterationItem/BetaGateItem/RegressionCheckItem 接口 + 默认数据 |
| `src/features/beta/store/beta-iteration.store.ts` | Pinia store：迭代 CRUD、Gate checklist 管理、Regression checklist 管理、releaseConclusion 计算、localStorage 持久化（3 个 key） |
| `src/features/beta/services/beta-gate.service.ts` | computeReleaseDecision：综合 gate/regression/bootstrap 得出 blocked/partial/ready |
| `src/features/beta/services/beta-release-check.service.ts` | quickReleaseCheck：快速摘要（含 P0 任务阻断检测） |
| `src/features/beta/components/BetaIterationBoard.vue` | 迭代看板：创建迭代、阶段流转（planningin_progressqaready_to_releasereleased）、release conclusion 显示 |
| `src/features/beta/components/BetaGateChecklist.vue` | 13 项发布门禁清单：点击循环切换 todopassfailpartial |
| `src/features/beta/components/BetaReleaseCandidatePane.vue` | 发布候选面板：决策显示、blocker 列表、checklist 摘要 + P0 阻断 + 当前迭代 |
| `src/features/beta/components/RegressionChecklistPane.vue` | 14 项回归检查清单：按 area 分组显示、点击 pass/fail 切换 |

---

## 四、自举开发闭环的组织

### 数据链
```
Beta Feedback  Bootstrap Task  Thread  Review/Terminal/Git
                      
Self-Host Gap 
                      
Manual Entry 
```

### 状态流转
```
todo  queued  in_progress  reviewing  done
                     
                  blocked
```

### 关键实现
- `deriveFromFeedback(feedbackId, title, desc, type)`：feedback 转任务，自动关联 sourceId
- `deriveFromSelfHostGap(gapId, title, desc)`：self-host gap 转任务
- `addTask(title, desc, type, 'manual')`：手动创建
- `startTask(taskId)`：启动任务 + 自动创建 thread 并绑定
- `attachThread(taskId, threadId)`：手动绑定已有 thread
- BootstrapQueuePane 的 "Start Fix" 按钮一键完成 start + createThread + attachThread

### 与 Thread 的关系
- 每条 bootstrap task 有 `relatedThreadId`
- 启动任务时自动调用 `threadStore.createThread()` 创建修复 thread
- Task card 显示关联 thread 摘要
- Thread 成为修复上下文（后续可注入 task 描述到 composer）

---

## 五、Beta 迭代制度的组织

### 一轮迭代的标准阶段
```
planning  in_progress  qa  ready_to_release  released
```

### Release Gate Checklist（13 项）
1. Thread main chain normal
2. Review pane normal
3. Terminal normal
4. Git pane normal
5. Skills/MCP/Browser/Desktop entries not crash
6. Goal/Automation basics available
7. Deep link normal
8. Shortcuts critical path normal
9. Build passes
10. Tauri build/pkg passes (if possible)
11. Updater metadata consistent
12. State restore normal
13. Key fixes verified this round

### Regression Checklist（14 项）
覆盖：thread(Create/Switch/Restore/Composer)、review(Diff/Comment)、terminal(Execute)、git(Stage/Revert)、settings、shortcuts、feedback、self-host、build

### 版本准入判定（beta-gate.service.ts）
综合 gate checklist + regression checklist + bootstrap p0 任务 + in-progress 任务，生成：
- `ready`：80%+ checklist pass + 无 P0 + 无 fail
- `partial`：50-80% pass
- `blocked`：有 fail 或有 P0

---

## 六、Feedback / Self-Host / Bootstrap / Beta Gate 的关系

```
Beta Feedback  Bootstrap Queue  Bootstrap Task
                        
Self-Host Gap  Bootstrap Queue  Bootstrap Task
                                         
                                    Thread 修复
                                         
                                    Review/Git/Terminal
                                         
                     
                     
              Beta Gate Checklist
                     
              Regression Checklist
                     
              Release Decision (ready/partial/blocked)
                     
              Beta Iteration: released
```

- Beta Feedback 进入 Bootstrap Queue
- Self-Host Gap 进入 Bootstrap Queue
- Bootstrap Task 完成情况影响 Beta Gate
- Beta Gate 决定版本是否 Ready
- 三者不再是孤立模块

---

## 七、持久化方案

| Key | 内容 | Store |
|-----|------|-------|
| `lingstack_bootstrap_tasks` | BootstrapTaskItem[]（localStorage JSON） | bootstrap.store.ts |
| `lingstack_beta_iterations` | BetaIterationItem[] | beta-iteration.store.ts |
| `lingstack_beta_gate` | BetaGateItem[] | beta-iteration.store.ts |
| `lingstack_regression_checks` | RegressionCheckItem[] | beta-iteration.store.ts |

所有 store 使用 `watch(..., { deep: true })` 自动持久化，启动时 `load()` 恢复。

---

## 八、Shell 集成

### StatusBar
新增 3 个条件渲染项：
- `N bootstrap tasks`（queueSize > 0 时显示）
- `v0.1.6 WIP/QA/Ready`（当前 iteration version + status 简写）
- 与已有 feedback pending 计数并列显示

### CodexWorkbench
新增 5 个 capability pane：
- `BootstrapQueuePane`（bootstrap）
- `BetaIterationBoard`（beta）
- `BetaReleaseCandidatePane`（release）
- `BetaGateChecklist`（gate）
- `RegressionChecklistPane`（regression）
通过 CapabilityTab type 扩展路由。

### LeftSidebar
- 新增 "Beta" 入口（Rocket 图标，打开 Settings）
- 保留 Phase 6 的 Skills/MCP/Browser/Desktop 能力入口
- 保留 Phase 8 的 Feedback 入口

### Settings
- 新增 "Bootstrap" tab（Rocket 图标），body 区嵌入 BootstrapQueuePane
- 保留现有 Beta tab（BetaStatusPane + Changelog + SelfHostReadiness）

---

## 九、真接线 vs Bridge/Mock

### 真接线
- `bootstrap.types.ts`：完整类型定义
- `bootstrap.store.ts`：完整任务 CRUD + 状态流转 + localStorage 持久化
- `bootstrap-planner.service.ts`：feedback 类型映射
- `bootstrap-readiness.service.ts`：就绪度计算
- `BootstrapQueuePane.vue`：完整 UI + 交互
- `beta-iteration.types.ts`：完整接口 + 默认 checklist 数据
- `beta-iteration.store.ts`：迭代/Gate/Regression 完整管理 + localStorage
- `beta-gate.service.ts`：发版决策计算（综合 gate/regr/bootstrap）
- `beta-release-check.service.ts`：快速检查
- 所有 4 个 beta 组件：完整 UI + 交互 + 状态循环
- StatusBar 集成：实时 bootstrap/iteration 状态
- CodexWorkbench pane 路由：完整
- Settings Bootstrap tab：完整

### Bridge/Mock
- `deriveFromSelfHostGap`：Self-host readiness gap 转任务逻辑完整，但 self-host gap 本身的自动化检测是 bridge
- `BetaReleaseCandidatePane` 的 release 动作：UI 完整，实际 release 流程（打包/上传/部署）尚未自动化
- Gate checklist 的状态检查：UI 支持手动切换 todo/pass/fail/partial，但未自动检测各项
- Regression checklist：同上，手动勾选模式

---

## 十、构建验证结果

```powershell
npx vue-tsc --noEmit   # exit 0, 0 errors（含修复 pre-existing thread.store.ts 类型错误）
npm run build           # exit 0, 432ms, 347 KB JS + 87 KB CSS
```

---

## 十一、验收标准达成情况

| # | 标准 | 状态 |
|---|------|------|
| 1 | feedback 可转成 bootstrap task | PASS（deriveFromFeedback） |
| 2 | self-host gap 可转成 bootstrap task | PASS（deriveFromSelfHostGap） |
| 3 | bootstrap task 可创建或绑定 thread | PASS（startTask 自动 createThread） |
| 4 | thread 成为修复上下文 | PASS（attachThread + card 显示） |
| 5 | task 状态可流转 | PASS（6 状态完整流转） |
| 6 | 可创建一轮 beta iteration | PASS（createIteration） |
| 7 | 可看到当前 iteration 状态 | PASS（BetaIterationBoard） |
| 8 | 可看到 release gate checklist | PASS（BetaGateChecklist 13 项） |
| 9 | 可看到 regression checklist | PASS（RegressionChecklistPane 14 项） |
| 10 | gate 结果能得出 ready/blocked/partial | PASS（computeReleaseDecision） |
| 11 | beta/bootstrap/self-host 三者有清晰关系 | PASS（数据链完整） |
| 12 | 不破坏前 1~9 阶段已有工作流 | PASS（增量添加） |
| 13 | settings/status bar 能看到版本治理状态 | PASS（bootstrap tab + iteration badge） |
| 14 | vue-tsc --noEmit 通过 | PASS（含 pre-existing 修复） |
| 15 | npm run build 通过 | PASS（432ms） |

**15/15 全部通过。**

---

## 十二、下一步建议 (Phase 11)

Phase 11 方向：**团队协作规范与长期路线制度化**

1. **多人协作锁**：同一 bootstrap task 防止多人同时编辑
2. **Bootstrap 任务分配**：支持 assignee 字段
3. **Release 自动化**：Beta Release Candidate 的 Tauri build + 上传 + 部署自动化
4. **Gate 自动检测**：部分 gate 项（如 build passes）可自动检测
5. **Public Roadmap**：对外可见的路线图（从 bootstrap 任务中提取）
6. **贡献者指南**：外部贡献者的 PR 流程规范化
7. **MCP Provider 真接线**：至少 1 个真实 MCP provider 的完整接入

---

## 十三、文件变更汇总

### 新建文件（14 个）
```
src/features/bootstrap/bootstrap.types.ts
src/features/bootstrap/store/bootstrap.store.ts
src/features/bootstrap/services/bootstrap-planner.service.ts
src/features/bootstrap/services/bootstrap-readiness.service.ts
src/features/bootstrap/components/BootstrapQueuePane.vue
src/features/beta/beta-iteration.types.ts
src/features/beta/store/beta-iteration.store.ts
src/features/beta/services/beta-gate.service.ts
src/features/beta/services/beta-release-check.service.ts
src/features/beta/components/BetaIterationBoard.vue
src/features/beta/components/BetaGateChecklist.vue
src/features/beta/components/BetaReleaseCandidatePane.vue
src/features/beta/components/RegressionChecklistPane.vue
```

### 修改文件（6 个）
```
src/layouts/codex-shell/CodexWorkbench.vue           - CapabilityTab 扩展 + 5 pane 路由
src/layouts/codex-shell/parts/StatusBar.vue           - bootstrap/iteration 状态 item
src/layouts/codex-shell/parts/LeftSidebar.vue          - 修复 Phase 6 能力入口 + Beta 入口
src/features/settings/components/SettingsPanel.vue     - Bootstrap tab + Beta tab 完善
src/features/settings/store/settings.store.ts           - activeTab/setActiveTab 类型扩展
src/features/threads/store/thread.store.ts              - 修复 pre-existing TS 类型错误
```
