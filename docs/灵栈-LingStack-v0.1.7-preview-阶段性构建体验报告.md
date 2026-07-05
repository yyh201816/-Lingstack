# 灵栈 LingStack v0.1.7-preview 阶段性构建体验报告

**版本**: v0.1.7-preview
**构建时间**: 2026-07-04
**构建方式**: `npm run tauri build`
**状态**: 构建通过，安装包已生成

---

## 一、本次构建基于哪些已落地 Phase

| Phase | 内容 | 状态 |
|-------|------|------|
| Phase 1 (R35) | CodexWorkbench 壳层（15 组件 + 三栏布局） | ✅ 已落地 |
| Phase 2 (R36) | 核心 Stores 重构（9 stores + 10 组件接线） | ✅ 已落地 |
| Phase 3 (R37) | Thread 主链（ThreadHeader 9 action + Composer 流式 + 持久化） | ✅ 已落地 |
| Phase 4 (R38) | Review Pane + Diff 主链（6 组件 + diff + comment/stage/revert + 双向联动） | ✅ 已落地 |
| Phase 5 (R39) | Terminal + Git 主链（5 terminal 组件 + 5 git 组件 + 桥接） | ✅ 已落地 |
| Phase 7 (R40) | Agent Orchestration + Goal Mode + Automations | ✅ 已落地 |
| Phase 8 (R40) | Polish + Deep Link + Keyboard Shortcuts + Release Hardening | ✅ 已落地 |
| **R26 系列** | Self-heal v2 + 全量扫描 + 审计 + 收口 | ✅ 已落地 |
| **Phase 9** | Beta feedback + version identity + self-host migration | ✅ 已落地 |
| **Phase 10** | Bootstrap governance + gate/regression/iteration | ✅ 已落地（shell 已降级） |
| **Phase 11** | 真实项目接管 + thread-bound self-repair task | ✅ 已落地 |
| **Phase 14** | Cloud sync + beta user + release strategy | ✅ 已落地（本地层，HTTP 桥接） |

**不在此构建**：Phase 12/13 仅为提示词准备，无代码交付。

---

## 二、当前包里真正能看到的变化

### 2.1 整体 UI 架构：Codex 风格三栏工作台

- **左栏 280px**: 项目切换器 + Thread 列表 + 工具入口（Skills / MCP / Browser / Computer Use / Goals / Automations / Feedback / Bootstrap / Self-Repair / Ops）
- **中央 (flex 1)**: Thread 时间线 + ThreadHeader（项目绑定、任务类型显示、Goal/Result 摘要）+ Composer 输入
- **右栏 420px**: Review Tabs（Review / Terminal / Git），Artifacts 和 PR 已按 Phase 11 规则隐藏
- **顶部 32px**: TopStatusBar — 显示项目路径、线程信息、任务类型 badge
- **底部 28px**: StatusBar

### 2.2 Thread-first 工作流

- 新建 Thread 自动绑定当前项目
- 三种任务类型: Chat / Self-Repair / Code Review
- Self-Repair 按钮一键创建绑定的自修复任务线程
- Timeline 支持 task_status 消息类型（任务生命周期: pending → running → review → done → failed）
- ThreadHeader 显示 task goal 和 result summary
- 所有状态通过 localStorage 持久化，关闭再打开可恢复

### 2.3 右侧工作面板完整度

- **Review/Diff**: 支持 diff set、文件选择、行级 comment、stage/revert
- **Terminal**: xterm.js 双主题，真 shell 接入
- **Git**: 文件状态 + 操作 + review↔git 桥接

### 2.4 工作台状态一致性

- 项目路径在 TopStatusBar / Thread / Store / Composer 中一致
- Deep Link 路由（deeplink-router.service.ts）
- Keyboard Shortcuts（command-registry.service.ts）
- 最近项目恢复（localStorage）
- Chat 上下文注入（Workspace Context 含 threadId / taskType / taskScope）

### 2.5 内测运营面板（Phase 14 新增）

- **Instances 面板**: 实例管理（在线/离线/健康分/版本/频道）
- **Users 面板**: Beta 用户管理（role/cohort/status/绑定设备）
- **Strategy 面板**: 发布频道与策略分级（5 频道 × 5 策略 × 灰度控制）
- **Sync 面板**: 云同步状态（10 实体类型 × 同步状态机）

---

## 三、模块真实度分类

### 真可用

| 模块 | 说明 |
|------|------|
| 三栏工作台 (CodexWorkbench) | 左/中/右 完整布局，可切换 |
| Thread 主链 | 创建/切换/持久化/恢复 |
| Thread Task Type | chat / self_repair / code_review |
| ThreadHeader | Goal + Result 显示 |
| TopStatusBar | 项目/线程/任务 badge |
| Review Pane + Diff | diff 数据 + 评论 + stage/revert |
| Terminal Pane | xterm.js 双主题 |
| Git Pane | 文件状态 + 操作 |
| Settings | 模型/服务商/更新配置 |
| 快捷键体系 | command-registry.service.ts |
| Deep Link | deeplink-router.service.ts |
| 最近项目恢复 | localStorage 持久化 |
| Chat 上下文注入 | WorkspaceContext 含 task 字段 |
| Skill Runner | 5 本地 skill 联通 |
| Self-Heel Task Board | 任务解析 + 状态管理 |
| Beta Instance Store | 实例 CRUD + 健康分 |
| Feedback Store + Inbox | 反馈收集 + 分流 |
| Bootstrap Task Board | 看板式任务管理 |
| Release History | 发布记录管理 |
| Cloud Sync Store (本地) | 10 实体 × 同步状态机 |
| Beta User Store | 用户 CRUD + cohort/status |
| Release Strategy Store | 频道/策略/灰度 |
| Ops Dashboard v2 | Instances/Users/Strategy/Sync 四 tab |

### Bridge（有真实代码但端到端路径不完整）

| 模块 | 说明 |
|------|------|
| Cloud Sync HTTP 层 | fetch 层已建，但服务端 `ai.tadanpay.cn/lingstack/api/sync` 待部署 |
| Updater 频道分流 | channel-aware 路由已建，tauri.conf 已配 5 频道，但服务器频道目录待部署 |
| Self-repair 自动代码修改 | 任务模板 + timeline + review 就位，但实际自动改代码仍是手动/桥接 |
| Agent Orchestration | 编排框架就位，但真实 agent 执行链待端到端验证 |
| Goals / Automations | stores + services 存在，但真实工作计划尚未闭环 |

### Mock / 种子数据

| 入口 | 说明 |
|------|------|
| Beta Instances | 4 个 mock 实例 |
| Beta Users | 4 个 mock 用户 |
| Release Plans | 2 个 mock 计划 |
| Feedback | mock 反馈条目 |

---

## 四、构建结果

| 项目 | 结果 |
|------|------|
| `npx vue-tsc --noEmit` | ✅ 0 错误 |
| `npm run build` | ✅ 1933 modules, 444.27 KB JS + 130.78 KB CSS, 465ms |
| `npm run tauri build` | ✅ Rust release 编译 55.59s, EXE + NSIS 安装包 |
| 安装包大小 | 3.97 MB |
| 签名状态 | ⚠️ 无签名（preview 构建，缺少 TAURI_SIGNING_PRIVATE_KEY） |

### 安装包

- **主产物**: `release\灵栈-LingStack-v0.1.7-preview-setup.exe` (3.97 MB)
- **原始位置**: `src-tauri\target\release\bundle\nsis\灵栈 LingStack_0.1.7-preview_x64-setup.exe`

---

## 五、Smoke Test（待人工执行）

本轮为 headless 构建环境，无法直接启动 GUI 应用。以下是建议的验收路径：

1. 安装 `release\灵栈-LingStack-v0.1.7-preview-setup.exe`
2. 启动后验证三栏布局完整可见
3. 新建 Thread → 确认自动绑定当前项目
4. 切换右侧 Review / Terminal / Git Tab
5. 进入 Settings 确认可访问
6. 点击 Self-Repair 创建自修复线程
7. 打开 Ops 面板查看 Instances/Users/Strategy/Sync 四 tab
8. 关闭再打开，验证 thread 恢复
9. 观察无白屏、崩溃或报错

---

## 六、下一步建议

**优先做体验修正**:
1. 安装并完整走一遍 smoke test
2. 记录体验中发现的任何 UI 问题或不一致
3. 如果体验过关，继续推进 Phase 15（服务端部署 sync + updater 频道）
4. 如果发现问题，优先修体验 bug 再推新功能
