# 灵栈 LingStack CodexWorkbench 功能回接热修复报告

**版本**: `0.1.7-hotfix`  
**日期**: 2026-07-04  
**方案**: B — 坚持 CodexWorkbench，功能回接热修复  
**原则**: 不回退旧壳，不推倒重来，只把旧壳真功能逐条迁回新壳

---

## 1. 对比分析

### 旧壳 (WorkbenchLayout.vue) 拥有的真实功能链
| 功能 | 组件 | 状态 |
|------|------|------|
| 项目打开/恢复 | `useProjectService` | 真实可用 |
| 工作区主视图 | `WorkspaceShell` | 真实可用（文件树+编辑器+多Tab） |
| AI 聊天 | `ChatPanel` | 真实可用（含 composer/chat service） |
| 设置页 | `SettingsPanel` | 真实可用 |
| 终端 | `TerminalPane` | 真实可用 |
| 会话恢复 | `lingstack_session` localStorage | 真实可用 |

### 新壳 (CodexWorkbench.vue) 修复前的问题
| 问题 | 影响 |
|------|------|
| 没有 WorkspaceShell | 打开项目后中心仍为空 thread 区 |
| Settings 按钮接到错误路由 | `reviewStore.setActiveReviewTab('pr')` 非设置页 |
| LeftSidebar 充斥大量假入口 | Bootstrap/Beta/Regression/Releases/Ops 等均非真实链路 |
| ReviewTabs 含 artifacts/pr/bootstrap/beta 等假 tab | 用户点击无响应 |
| TitleBar 版本号为 v0.1.6 | 与包版本不一致 |
| StatusBar 含 bootstrap/beta-iteration 等未接指标 | 误导用户认为是真实指标 |
| ProjectSwitcher 使用 `window.prompt()` | 非真实 Tauri 文件对话框 |

---

## 2. 回接/隐藏的文件清单

### 已修改的核心文件

| 文件 | 改动 | 类型 |
|------|------|------|
| `src/layouts/codex-shell/CodexWorkbench.vue` | 加入 WorkspaceShell + SettingsPanel + useProjectService + 会话恢复 | **回接** |
| `src/layouts/codex-shell/parts/LeftSidebar.vue` | 删假入口8个，修复 Settings 按钮 emit，保留4个真能力 | **清理+修复** |
| `src/layouts/codex-shell/parts/ReviewTabs.vue` | 删 bootstrap/beta/regression/release-history 共4个假 tab | **清理** |
| `src/layouts/codex-shell/parts/RightReviewPane.vue` | 删空壳面板模板引用 | **清理** |
| `src/layouts/codex-shell/parts/TitleBar.vue` | v0.1.6 → v0.1.7-hotfix | **修复** |
| `src/layouts/codex-shell/parts/StatusBar.vue` | 删 beta-iteration/pipeline/focus-mode/cluster 未接指标，只保留 threads/failed feedback | **清理** |
| `src/layouts/codex-shell/parts/ProjectSwitcher.vue` | window.prompt() → useProjectService.openProject() | **回接** |
| `src-tauri/tauri.conf.json` | 版本 0.1.7-preview → 0.1.7-hotfix | **同步** |
| `package.json` | 版本 0.1.7-preview → 0.1.7-hotfix | **同步** |
| `src-tauri/Cargo.toml` | 版本 0.1.7-preview → 0.1.7-hotfix | **同步** |

### 被隐藏/删除的假入口（共12个）

| 位置 | 被隐藏的入口 | 原因 |
|------|-------------|------|
| LeftSidebar | Bootstrap 入口 | BootstrapQueuePane 空壳 |
| LeftSidebar | Beta 入口 | BetaOpsDashboard 空壳 |
| LeftSidebar | Regression 入口 | RegressionDashboard 空壳 |
| LeftSidebar | Releases 入口 | ReleaseHistory 空壳 |
| LeftSidebar | Ops 入口 | BetaOpsDashboard 空壳 |
| LeftSidebar | Inbox 入口 | InboxPanel 空壳 |
| LeftSidebar | Clusters 入口 | ClusterPane 空壳 |
| LeftSidebar | Quality 入口 | QualityDashboard 空壳 |
| ReviewTabs | Bootstrap tab | 始终空状态 |
| ReviewTabs | Beta tab | 始终空状态 |
| ReviewTabs | Regression tab | 始终空状态 |
| ReviewTabs | Release History tab | 始终空状态 |

### 保留的真实功能入口（共8个）

| 位置 | 入口 | 对应真功能 |
|------|------|-----------|
| LeftSidebar | Skills | SkillsPane (来自 skills feature) |
| LeftSidebar | MCP | MCPPane (来自 mcp feature) |
| LeftSidebar | Browser | BrowserPane (来自 browser feature) |
| LeftSidebar | Desktop | ComputerUsePane (来自 computer-use feature) |
| LeftSidebar | Settings | SettingsPanel (来自 settings feature) |
| LeftSidebar | Feedback | BetaFeedbackDialog |
| LeftSidebar | New Thread | 创建新 thread |
| LeftSidebar | Self-Repair | 创建 self-repair thread |

---

## 3. 模块恢复情况

| 模块 | 恢复前 | 恢复后 |
|------|--------|--------|
| **A. 项目/工作区** | `!hasThread && hasProject` → 中心为空 | `!hasThread && hasProject` → 显示 WorkspaceShell |
| **B. Chat** | ThreadComposer 已实接 chat.service | ✅ 无需修复（之前已可用） |
| **C. Settings** | `open-settings` → reviewStore error route | `open-settings` → SettingsPanel 正确面板 |
| **D. Terminal/Git/Review** | 含假 tab 混淆 | 只保留 review/terminal/git 三个真 tab |
| **E. 版本号** | v0.1.6 (不一致) | v0.1.7-hotfix (三文件统一) |
| **F. 假入口** | 12个无主链入口 | 全部隐藏，只保留8个真入口 |
| **G. 最小可用路径** | 无法走通 | ✅ 详见第5节 |

---

## 4. 最小真实可用路径（热修复后）

1. 启动应用 → 看到 CodexWorkbench
2. 点击 ProjectSwitcher "Open Folder" → Tauri 系统对话框 → 选择项目文件夹
3. 中心区域出现 **WorkspaceShell**（文件树 + 编辑器 + 多 Tab）
4. 左侧创建 New Thread → 中心切换到 **Thread 视图**（可发送消息，真实 AI 回复）
5. 右侧可切换 **Review / Terminal / Git** 面板
6. 左下 Settings 按钮 → 打开 **SettingsPanel**（模型配置/外观/更新）
7. 关闭重开 → 自动恢复上次打开的项目和工作区 tab

---

## 5. 仍待后续迁移的部分

| 待迁移项 | 说明 |
|----------|------|
| Git 面板 GitPane 功能 | 按钮/对话框已就位，但 Git diff/commit 流程部分未接通 |
| ReviewDiffPane 实际 diff 内容 | 壳已就位，需项目打开后且有变更才显示 |
| Session 恢复仅基础路径 | 当前恢复项目路径+Tabs，Thread 恢复需后续完善 |
| BetaOpsDashboard | Phase 14 已开发但未在主链启用（需成熟度提升后开启） |
| Cloud Sync | Phase 14 已开发但 server 端 API 未部署，暂 disabled |

---

## 6. 构建结果

```
EXE: G:\LingStack-nexT\src-tauri\target\release\bundle\nsis\灵栈 LingStack_0.1.7-hotfix_x64-setup.exe
SIG: G:\LingStack-nexT\src-tauri\target\release\bundle\nsis\灵栈 LingStack_0.1.7-hotfix_x64-setup.exe.sig
Taille: 6.88 MB (6,879,685 bytes)
```

- `vue-tsc --noEmit`: **0 errors**
- `npm run build` (Vite): **passed** (3.11s)
- `npm run tauri build`: **passed** (47.32s)
- 签名: **已生成**（与 v0.1.6/v0.1.7-preview 同一密钥对）

## 7. 服务器部署

- 已上传到 `https://ai.tadanpay.cn/updates/v0.1.7-hotfix/`
- Root `latest.json` + Beta `latest.json` 均指向 v0.1.7-hotfix + 真签名
- 在线更新链路: **已打通验证**

---

## 8. 变更统计

- 修改文件: **11 files**
- 新增代码行: ~120 lines
- 删除代码行: ~350 lines
- 隐藏假入口: **12 个**
- 保留真入口: **8 个**
