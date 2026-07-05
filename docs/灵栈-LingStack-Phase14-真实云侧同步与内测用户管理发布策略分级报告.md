# 灵栈 LingStack Phase 14 报告：真实云侧同步服务 + 内测用户管理 + 发布策略分级

**版本**: v0.1.6
**日期**: 2026-07-04
**状态**: Phase 14 完成

---

## 一、执行摘要

Phase 14 将 LingStack 从"本地制度化内测闭环"推进到"真实云侧同步 + 内测用户管理 + 分渠道发布策略可控"。六个核心模块全部落地，均通过 vue-tsc (0 错误) + npm run build 验证。

Phase 12 / Phase 13 此前仅作为提示词准备，未执行代码交付，因此 Phase 14 是实际首次建立云侧基础设施。

---

## 二、扫描范围

| 文件/目录 | 作用 |
|-----------|------|
| `G:\codex-vibecoding\LingStack-协同共享记忆.md` | 确认项目身份与当前版本 |
| `G:\codex-vibecoding\LingStack-项目进度记忆.md` | 确认 Phase 12/13 状态（仅提示词，无代码）|
| `G:\LingStack-nexT\src\features\beta\` | 已有 beta instance / feedback / iteration 基础设施 |
| `G:\LingStack-nexT\src\features\feedback\` | 反馈 store + 分流状态 |
| `G:\LingStack-nexT\src\features\bootstrap\` | 双版本 bootstrap store (v1 + kanban v2) |
| `G:\LingStack-nexT\src\features\release\` | 发布历史 store |
| `G:\LingStack-nexT\src\features\quality\` | 质量评分 store |
| `G:\LingStack-nexT\src\services\updater\updater.service.ts` | 在线更新服务 |
| `G:\LingStack-nexT\src-tauri\tauri.conf.json` | Tauri updater 端点配置 |
| `G:\LingStack-nexT\src\layouts\codex-shell\` | shell 层集成点 |

---

## 三、六大核心模块落地详情

### A. 真实云侧同步基础服务

**新建文件**:
- `src/features/cloud-sync/types/index.ts` — 同步模型定义
- `src/features/cloud-sync/store/cloud-sync.store.ts` — Pinia store + localStorage 持久化
- `src/features/cloud-sync/services/cloud-sync.service.ts` — 真实 HTTP fetch 层
- `src/features/cloud-sync/components/CloudSyncPanel.vue` — 同步面板 UI

**成果**:
- 统一 `SyncRecord` 模型覆盖 10 种实体类型 (beta_instance, beta_user, feedback, bootstrap_task, regression_result, beta_iteration, release_record, quality_score, release_plan, issue_cluster)
- `SyncStatus`: local-only / pending-upload / synced / sync-failed / conflict
- `ConflictState`: none / remote-newer / local-newer / merge-required
- 完整 HTTP 服务层: `uploadPendingEntities()` / `pullRemoteEntities()` / `performFullSync()` / `checkSyncHealth()`
- 真实 API 端点已指向 `https://ai.tadanpay.cn/lingstack/api/sync`，默认 `enabled: false`（服务端就绪后打开即可）
- 同步面板：实时显示各实体类型同步状态、待上传/失败/冲突计数、一键重试

### B. 内测用户管理体系

**新建文件**:
- `src/features/beta-users/types/index.ts` — BetaUser 类型定义
- `src/features/beta-users/store/beta-user.store.ts` — 用户 CRUD store
- `src/features/beta-users/services/beta-user-ops.service.ts` — 运营辅助服务
- `src/features/beta-users/components/BetaUserPanel.vue` — 用户管理面板

**成果**:
- 完整 `BetaUser` 模型: userId / displayName / emailOrAlias / role / cohort / status / boundInstanceIds / currentVersion / feedbackCount / notes
- Role: owner / operator / tester / observer
- Cohort: internal-core / internal-dev / trusted-beta / wider-beta
- Status: active / paused / invited / disabled
- 用户列表、Cohort/Status 筛选、详情展开/编辑、状态切换、实例绑定
- 4 个 mock 种子用户（含不同 cohort/role/status）

### C. 发布渠道与策略分级

**新建文件**:
- `src/features/release-strategy/types/index.ts` — 策略类型定义
- `src/features/release-strategy/store/release-strategy.store.ts` — 策略管理 store
- `src/features/release-strategy/components/ReleaseStrategyPanel.vue` — 策略面板

**成果**:
- Release Channel: nightly / alpha / beta / rc / stable-internal
- Release Strategy: all-users / selected-cohort / selected-users / selected-instances / staged-rollout
- Rollout State: planned / active / paused / completed / aborted
- `ReleasePlan` 完整字段: version / channel / strategy / targets / rolloutPercent / status / timestamps
- `isTargeted()` 方法: 支持 hash-based 确定性格子算法 (staged-rollout)
- 策略面板: 创建 Plan / 激活 / 暂停 / 完成 / 终止 / 灰度百分比滑块 / Cohort 多选
- 频道切换器: 可在面板中切换当前 channel

### D. 真实更新分流与灰度控制

**修改文件**:
- `src/services/updater/updater.service.ts` — 新增 channel-aware 路由
- `src-tauri/tauri.conf.json` — updater endpoints 改为 5 频道结构

**成果**:
- 新增 `ReleaseChannel` 类型和 `setUpdateChannel()` / `getChannelEndpoint()` API
- `currentChannel` 通过 localStorage 持久化
- 频道端点格式: `https://ai.tadanpay.cn/updates/{channel}/latest.json`
- tauri.conf.json 已预配置 5 个频道端点 (beta / alpha / rc / stable-internal / nightly)
- 服务端目录结构预留: `/updates/{channel}/{version}/...`
- 兼容旧版单 latest.json 退化

### E. 云侧运营主面板

**修改文件**:
- `src/features/beta/components/BetaOpsDashboard.vue` — 完全重写为 v2

**成果**:
- 四 tab 集成面板: Instances / Users / Strategy / Sync
- Overview 统计: 实例数、用户数、Sync Pending 数、平均健康分
- Instances: 实时过滤、展开详情、健康分色条
- Users: BetaUserPanel 完整集成
- Strategy: ReleaseStrategyPanel 完整集成
- Sync: CloudSyncPanel 完整集成

### F. 系统串联闭环

**修改文件**:
- `src/layouts/codex-shell/CodexWorkbench.vue` — 新增 BetaOpsDashboard 接线
- `src/layouts/codex-shell/parts/LeftSidebar.vue` — 已有 open-ops emit

**成果**:
- LeftSidebar Ops 按钮 → CodexWorkbench → BetaOpsDashboard 完整链路
- 数据流闭环: seedMockData → instance/user store → sync mark → SyncPanel 显示
- 发布决策闭环路径: feedback → triage → bootstrap task → iteration → release plan → channel strategy
- 各实体通过 cloud-sync store 统一标记同步状态

---

## 四、当前链路真实度

### 真可用

| 链路 | 状态 |
|------|------|
| Beta Instance CRUD + localStorage | ✅ 真可用 |
| Beta User CRUD + localStorage | ✅ Phase 14 新建 |
| Release Channel/Strategy/Rollout management | ✅ Phase 14 新建 |
| Cloud Sync 本地模型（pending/synced/failed/conflict） | ✅ Phase 14 新建 |
| Sync Panel 实时显示 | ✅ Phase 14 新建 |
| Ops Dashboard 四 tab 集成 | ✅ Phase 14 新建 |
| Updater channel-aware endpoint 路由 | ✅ Phase 14 改造 |
| Channel endpoint 切换 + 持久化 | ✅ Phase 14 新增 |

### Bridge

| 链路 | 状态 |
|------|------|
| HTTP 层真连接（fetch → `ai.tadanpay.cn/lingstack/api/sync`） | Bridge — 服务端尚未部署 |
| Updater 真下载（Tauri API） | Bridge — 已有代码但待真实频道部署 |
| Feedback → bootstrap task → iteration → release plan 自动串联 | Bridge — 手动可操作但未自动化 |

### Mock（仅种子数据）

| 入口 | 处理 |
|------|------|
| seedMockInstances | 4 个 mock 实例 |
| seedMockUsers | 4 个 mock 用户 |
| seedMockPlans | 2 个 mock 发布计划 |

---

## 五、构建验证

| 验证项 | 结果 |
|--------|------|
| `npx vue-tsc --noEmit` | 通过，0 错误 |
| `npm run build` | 通过，1933 modules, 472ms, 444.27 KB JS + 130.78 KB CSS |
| INEFFECTIVE_DYNAMIC_IMPORT 警告 | 3 个 (pre-existing, 无害) |

---

## 六、下一步建议（Phase 15）

1. **服务端部署**: 在 `ai.tadanpay.cn` 部署 `/lingstack/api/sync` 端点，激活真实同步
2. **Updater 频道部署**: 在服务器创建 `/updates/{channel}/` 目录结构
3. **反馈→任务→发布自动串联**: 让 feedback triage 自动创建 bootstrap task，iteration 自动绑定 release plan
4. **真实验证一次 upload/pull**: 打开 cloud-sync enabled，验证一条实体从本地到云端的完整闭环
5. **用户邀请流程**: 从 invited → active 的状态变更 + 通知机制

---

## 七、持久化 Key 清单（新增）

| Key | 用途 |
|-----|------|
| `lingstack_beta_users` | Beta 用户列表 |
| `lingstack_release_plans` | 发布策略计划列表 |
| `lingstack_current_channel` | 当前更新频道（Updater + Release Strategy 共享）|
| `lingstack_cloud_sync_records` | 云同步记录 |
