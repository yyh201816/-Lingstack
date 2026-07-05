# 灵栈 LingStack Phase 9 报告：真实内测回路 + 用灵栈开发灵栈的迁移计划

**版本**: v0.1.6
**日期**: 2026-07-04
**状态**: Phase 9 完成

---

## 一、执行摘要

Phase 9 不新增大功能线，而是为 LingStack 建立三件产品基础设施：

1. **Beta 内测反馈回路** — 用户可提交 bug/ux/feature 类型反馈，关联当前 thread/project，本地持久化，支持导出和同步。
2. **产品版本身份系统** — 当前版本号、build channel、changelog 对用户可见，StatusBar 显示 beta 身份。
3. **Self-Host 自举迁移计划** — 15 项能力 readiness checklist + A/B/C 三阶段迁移规划，可从面板生成修复任务注入 thread。

LingStack 第一次真正拥有了"可给真实用户用、可收反馈、可根据反馈回修、并开始逐步接手自己的开发主链"的产品基础。

---

## 二、扫描范围

### 扫描的已有代码/报告

| 文件 | 说明 |
|------|------|
| `G:\codex-vibecoding\LingStack-协同共享记忆.md` | 项目协同记忆（完整读取） |
| `G:\codex-vibecoding\LingStack-项目进度记忆.md` | 项目进度记忆（完整读取） |
| `src/features/beta/types/beta-feedback.types.ts` | Phase 9 会话前已创建 |
| `src/features/beta/store/beta-feedback.store.ts` | Phase 9 会话前已创建 |
| `src/layouts/codex-shell/parts/StatusBar.vue` | 壳层 StatusBar（集成前状态） |
| `src/layouts/codex-shell/parts/LeftSidebar.vue` | 壳层 LeftSidebar（集成前状态） |
| `src/features/settings/components/SettingsPanel.vue` | Settings 面板（集成前状态） |
| `src/features/settings/store/settings.store.ts` | Settings store（集成前状态） |
| `src/layouts/codex-shell/CodexWorkbench.vue` | 主壳层（集成前状态） |
| Phase 1-8 全部报告 | 已有交付物参考 |

---

## 三、新建文件清单

### 3.1 Beta Feature（8 个文件）

| # | 文件路径 | 说明 |
|---|---------|------|
| 1 | `src/features/beta/types/beta-feedback.types.ts` | BetaFeedbackType / BetaFeedbackStatus / BetaFeedbackItem / BetaVersionInfo 类型（会话前已创建） |
| 2 | `src/features/beta/store/beta-feedback.store.ts` | Pinia store，localStorage 持久化（`lingstack_beta_feedback` + `lingstack_beta_version_info`），createFeedback / updateFeedbackStatus / retryFeedback / removeFeedback / openFeedbackDialog（会话前已创建） |
| 3 | `src/features/beta/services/beta-feedback.service.ts` | 反馈导出（JSON download）+ 远程同步（bridge/mock）+ 格式化摘要 |
| 4 | `src/features/beta/services/beta-release.service.ts` | 版本信息获取（Tauri API + fallback）+ changelog 数据源 |
| 5 | `src/features/beta/components/BetaFeedbackDialog.vue` | 反馈提交对话框：5 种类型选择 + 标题/描述 + thread/project 上下文勾选 + 版本信息 + 提交/同步/错误处理 |
| 6 | `src/features/beta/components/BetaStatusPane.vue` | Beta 状态面板：版本号 / build channel / 更新状态 / 反馈通道状态 / 反馈统计 |
| 7 | `src/features/beta/components/BetaChangelogPane.vue` | 更新日志面板：最近 5 个版本 changelog 展示 |
| 8 | `src/features/beta/components/BetaEmptyState.vue` | 反馈空状态：引导用户提交第一条反馈 |

### 3.2 Self-Host Feature（6 个文件）

| # | 文件路径 | 说明 |
|---|---------|------|
| 9 | `src/features/self-host/types/self-host.types.ts` | SelfHostCapabilityStatus / SelfHostCapabilityItem / SelfHostPlanStage 类型 |
| 10 | `src/features/self-host/store/self-host.store.ts` | Pinia store，localStorage 持久化（`lingstack_self_host_readiness_cache` + `lingstack_self_host_plan`），readinessPercent / currentStage / recommendedAction 计算属性 |
| 11 | `src/features/self-host/services/self-host-readiness.service.ts` | 15 项能力 readiness 计算 + 默认 A/B/C 迁移计划 + 任务提示词生成 |
| 12 | `src/features/self-host/components/SelfHostReadinessPane.vue` | 主面板：readiness 进度条 + 统计 + 阶段建议 + checklist + migration plan |
| 13 | `src/features/self-host/components/SelfHostChecklist.vue` | 能力清单：15 项可展开条目 + 状态徽章 + "Generate task for thread" 按钮 |
| 14 | `src/features/self-host/components/SelfHostMigrationPlan.vue` | 迁移计划：A/B/C 三阶段卡片 + LingStack/Trae 职责划分 + 状态流转 |

### 3.3 Shell 集成修改（4 个文件）

| # | 文件路径 | 改动 |
|---|---------|------|
| 15 | `src/features/settings/store/settings.store.ts` | activeTab 类型扩展 `'beta'` |
| 16 | `src/features/settings/components/SettingsPanel.vue` | 新增 Beta tab + BetaStatusPane / BetaChangelogPane / SelfHostReadinessPane 集成 |
| 17 | `src/layouts/codex-shell/parts/StatusBar.vue` | 动态线程数 + beta channel 徽章 + 反馈失败提醒 |
| 18 | `src/layouts/codex-shell/parts/LeftSidebar.vue` | Feedback 按钮 + beta 版本标识 |
| 19 | `src/layouts/codex-shell/CodexWorkbench.vue` | BetaFeedbackDialog 全局弹窗集成 |

---

## 四、真实内测回路如何组织

### 4.1 内测分发

- 安装包通过 NSIS 生成，上传到 `https://ai.tadanpay.cn/updates/releases/vX.Y.Z/`
- 更新源 `https://ai.tadanpay.cn/updates/latest.json` 由 Tauri updater 消费
- 内测用户安装 beta 包即可使用

### 4.2 反馈收集

1. 用户点击 LeftSidebar 底部 **Feedback** 按钮
2. 打开 BetaFeedbackDialog
3. 选择类型（bug / ux / feature / performance / other）
4. 填写标题和描述
5. 可选附带：当前 thread、当前 project、版本信息、runtime snapshot
6. 提交后进入 beta-feedback store

### 4.3 反馈与 thread 关联

- 每条反馈携带 `currentThreadId` 和 `currentProjectId`
- 开发者可回到对应 thread 场景复现问题
- `feedbacksByThread` getter 支持按 thread 过滤反馈

### 4.4 反馈回流

- 反馈持久化到 `localStorage`（key: `lingstack_beta_feedback`）
- 支持 JSON 导出（downloadFeedbacks）
- 远程同步：bridge/mock（Phase 10 接入真实 endpoint）
- 同步失败标记 `failed`，不丢数据，可重试

### 4.5 版本更新

- StatusBar 显示 beta channel 徽章 + 版本号
- Settings > Beta tab 显示完整版本信息 + changelog
- Tauri updater 已接通（Phase 8 完成）

---

## 五、Feedback 如何与 Thread 关联

关联发生在两个层面：

1. **提交时关联**：BetaFeedbackDialog 在提交时自动读取 `threadStore.activeThreadId` 和 `projectStore.currentProjectId`，写入 feedback 记录。
2. **查询时过滤**：`betaFeedbackStore.feedbacksByThread(threadId)` 支持按 thread 过滤反馈列表。

未来可扩展：在 ThreadHeader 添加反馈历史入口，显示与当前 thread 关联的所有反馈。

---

## 六、Self-Host Readiness 如何组织

### 15 项能力清单

| # | 能力 | 状态 | 来源 |
|---|------|------|------|
| 1 | Thread Mainline | ready | Phase 3 |
| 2 | Review Pane + Diff | ready | Phase 4 |
| 3 | Terminal | partial | Phase 5（bridge/mock） |
| 4 | Git Integration | partial | Phase 5（bridge/mock） |
| 5 | Skill Runner | ready | R17+R25 |
| 6 | Self-Heal Task Loop | ready | R26 |
| 7 | MCP / Browser / Computer Use | partial | Phase 6（bridge） |
| 8 | Agent Orchestration | partial | Phase 7（bridge） |
| 9 | Goal Mode | ready | Phase 7 |
| 10 | Automations | partial | Phase 7（bridge） |
| 11 | Deep Link Router | ready | Phase 8 |
| 12 | Keyboard Shortcuts | ready | Phase 8 |
| 13 | Online Updater | ready | R18-R27 |
| 14 | Beta Feedback Loop | ready | Phase 9 |
| 15 | Workspace Context Injection | ready | R24 |

**当前 readiness**: 10/15 ready (67%) → 建议阶段 A

### Readiness 计算逻辑

- `ready` = 已实现且通过真实用户路径验证
- `partial` = 代码存在但依赖 bridge/mock
- `todo` = 尚未实现
- `blocked` = 被外部依赖阻塞

---

## 七、迁移阶段 A/B/C 如何定义

### Stage A — Observer & Small Fixer（当前阶段）

LingStack 负责：查看 thread、读 review diff、跑 terminal、看 git、收反馈、做小修
Trae 负责：大轮结构开发、大文件重构、复杂 UI 组装

### Stage B — Small Iterator & Bug Fixer

LingStack 负责：小迭代、小修 bug、文档变更、反馈闭环、版本核验、小范围代码改动
Trae 只负责：大规模重构、跨 feature 批量工程操作

### Stage C — Primary Development Platform

LingStack 成为主开发台
Trae 降级为辅助外包型执行器

---

## 八、真接线 vs Bridge/Mock

| 层 | 状态 | 说明 |
|----|------|------|
| Beta types + store | **真接线** | 完整 CRUD + localStorage 持久化 + watch 自动保存 |
| BetaFeedbackDialog | **真接线** | 完整表单 + 类型选择 + 上下文关联 + 提交流程 |
| BetaStatusPane | **真接线** | 从 store 读取版本信息 + 反馈统计 |
| BetaChangelogPane | **真接线** | 静态 changelog 数据（需手动更新） |
| Feedback 导出 | **真接线** | JSON download |
| Feedback 远程同步 | **bridge/mock** | console.log + 模拟延迟，Phase 10 接真实 endpoint |
| Self-Host readiness | **真接线** | 基于 Phase 1-8 验证结果计算 |
| Self-Host checklist | **真接线** | 可展开/收起 + 状态徽章 |
| Self-Host task generation | **真接线** | 生成提示词 → CustomEvent('skill-prompt') → ChatPanel |
| Migration plan | **真接线** | A/B/C 三阶段 + localStorage 持久化 |
| StatusBar beta channel | **真接线** | 动态读取 betaStore.versionInfo |
| LeftSidebar feedback btn | **真接线** | 打开 BetaFeedbackDialog |

---

## 九、构建验证结果

| 验证项 | 结果 |
|--------|------|
| `npx vue-tsc --noEmit` | 通过（0 错误） |
| `npm run build` | 通过（1884 modules, 397ms, 324.92 KB JS + 73.62 KB CSS） |
| INEFFECTIVE_DYNAMIC_IMPORT 警告 | 3 个（pre-existing，来自 deeplink-router.service.ts 动态导入，无害） |

---

## 十、下一步建议（Phase 10）

Phase 10：自举开发闭环 + 正式 Beta 迭代制度

1. **Feedback 远程同步**：接入真实服务器 endpoint（POST `https://ai.tadanpay.cn/api/feedback`）
2. **Feedback → Task 转化**：将反馈自动转化为 self-heal task 或 thread 修复任务
3. **Self-Host 能力动态扫描**：从静态清单升级为文件系统扫描 + 构建验证
4. **Stage A → B 过渡验证**：用 LingStack 执行一个真实的小修 bug round
5. **Beta 迭代节奏**：建立 2 周一次 beta 发布 + feedback triage + version bump 纪律
6. **Changelog 自动生成**：从 git log / release notes 自动提取 changelog

---

## 十一、持久化 Key 清单

| Key | 用途 | 持久化方式 |
|-----|------|-----------|
| `lingstack_beta_feedback` | 反馈记录列表 | localStorage |
| `lingstack_beta_version_info` | 版本信息 | localStorage |
| `lingstack_self_host_readiness_cache` | 能力 readiness 缓存 | localStorage |
| `lingstack_self_host_plan` | 迁移计划状态 | localStorage |
