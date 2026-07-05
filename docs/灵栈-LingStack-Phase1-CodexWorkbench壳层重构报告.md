# Phase 1: CodexWorkbench 壳层重构报告

**日期**: 2026-07-04  
**版本**: v0.1.6  
**轮次**: Phase 1 (R35)  
**基线文档**: 灵栈-LingStack-Codex风格工作台开发总文档.md

---

## 一、本轮扫描的旧文件

| 文件 | 扫描结果 | 本轮处理 |
|------|---------|---------|
| `src/app/App.vue` | 主入口，引用 WorkbenchLayout | **已切换** 到 CodexWorkbench |
| `src/layouts/WorkbenchLayout.vue` | 旧主壳层：TopBar+SidebarNav+ProjectPanel+Main+CommandBar+StatusBar | **保留不删**，不再作为主入口 |
| `src/features/chat/ChatPanel.vue` | 旧聊天面板 | **保留**，暂未被新壳层挂载 |
| `src/features/settings/components/SettingsPanel.vue` | 设置面板 | **保留**，待 Phase 2 接入 |
| `src/layouts/parts/CommandBar.vue` | 旧命令栏 | **保留**，待后续对接 |
| `src/layouts/parts/ProjectPanel.vue` | 旧项目面板 | **保留**，待后续对接 |
| `src/layouts/parts/TopBar.vue` | 旧顶栏 | **保留**，已被新的 TitleBar+TopStatusBar 替代 |

---

## 二、新建文件清单

### 主壳层 (1 文件)
| 文件 | 说明 |
|------|------|
| `src/layouts/codex-shell/CodexWorkbench.vue` | Codex 风格三栏主壳层，含顶部/左栏/中栏/右栏/底部五区布局 |

### 顶部壳层 (2 文件)
| 文件 | 说明 |
|------|------|
| `src/layouts/codex-shell/parts/TitleBar.vue` | 品牌区(灵栈 LingStack v0.1.6) + 模式标签(Local) + 状态指示(idle/running) + 窗口控制区预留 |
| `src/layouts/codex-shell/parts/TopStatusBar.vue` | 项目路径 + 线程标题 + 模型名 + Agent状态 + Runtime状态 + Goal进度占位 |

### 左栏 thread-first (6 文件)
| 文件 | 说明 |
|------|------|
| `src/layouts/codex-shell/parts/LeftSidebar.vue` | 左栏容器：ProjectSwitcher + NewThread + SearchBox + ThreadList + 功能入口 + Settings |
| `src/layouts/codex-shell/parts/ProjectSwitcher.vue` | 当前项目名/路径显示 + Open Folder 按钮 |
| `src/layouts/codex-shell/parts/ThreadSearchBox.vue` | 搜索框 + G 快捷键提示 |
| `src/layouts/codex-shell/parts/ThreadList.vue` | 线程列表容器 (Phase 1: 含 3 条 mock 数据) |
| `src/layouts/codex-shell/parts/ThreadListItem.vue` | 单条线程项：标题 + 状态圆点 + 项目名 + 更新时间 + 置顶标记 |
| `src/layouts/codex-shell/parts/EmptyState.vue` | 通用空状态占位组件 |

### 中栏 thread pane (3 文件)
| 文件 | 说明 |
|------|------|
| `src/layouts/codex-shell/parts/CenterThreadPane.vue` | 中栏容器：ThreadHeader + Message Timeline占位 + ThreadComposer |
| `src/layouts/codex-shell/parts/ThreadHeader.vue` | 线程标题 + 状态标签(7色) + 操作按钮(暂停/停止/打开Review) |
| `src/layouts/codex-shell/parts/ThreadComposer.vue` | Ask/Agent 模式切换 + 输入框 + 发送按钮 (Enter发送/Shift+Enter换行) |

### 右栏 review pane (2 文件)
| 文件 | 说明 |
|------|------|
| `src/layouts/codex-shell/parts/RightReviewPane.vue` | 右栏容器 + ReviewTabs + 5个tab占位面板(Review/Terminal/Git/Artifacts/PR) |
| `src/layouts/codex-shell/parts/ReviewTabs.vue` | tab 切换组件 |

### 底部 (1 文件)
| 文件 | 说明 |
|------|------|
| `src/layouts/codex-shell/parts/StatusBar.vue` | Local环境 + Threads计数 + Terminal状态 + 版本号 v0.1.6 |

**合计新建**: 15 个 .vue 文件，1 个目录 (`layouts/codex-shell/`)

---

## 三、主入口切换详情

**改动文件**: `src/app/App.vue`

```
- import WorkbenchLayout from '@/layouts/WorkbenchLayout.vue'
+ import CodexWorkbench from '@/layouts/codex-shell/CodexWorkbench.vue'

- <WorkbenchLayout />
+ <CodexWorkbench />
```

旧 `WorkbenchLayout.vue` 保留不删，仅不再作为主入口。

---

## 四、三栏壳层组织方式

```
CodexWorkbench.vue
 TitleBar              # 40px 品牌栏
 TopStatusBar          # 32px 状态栏
 body (flex row)
    LeftSidebar       # 280px (可收起至 60px)
       ProjectSwitcher
       New Thread 按钮
       ThreadSearchBox
       ThreadList  ThreadListItem  N
       Tools 入口 (Skills/Plugins/MCP/Browser)
       Settings + 版本信息
    CenterThreadPane  # flex:1 (min 620px)
       ThreadHeader
       Message Timeline (占位)
       ThreadComposer
    RightReviewPane   # 420px (可关闭)
        ReviewTabs
        5个tab占位面板
 StatusBar             # 28px 底部状态栏
```

---

## 五、旧模块暂挂载情况

| 位置 | 当前状态 | Phase 2 计划 |
|------|---------|-------------|
| 中栏 Message Timeline | EmptyState 占位 | 挂载旧 ChatPanel 或新消息组件 |
| 左栏 ThreadList | 3 条硬编码 mock 数据 | 对接 chat-session.store (IndexedDB 多会话) |
| 左栏 ProjectSwitcher | 静态 "No Project" | 对接 workspace.store |
| 顶部 TopStatusBar | 全部硬编码默认值 | 对接 model-configs.store、agent runtime |
| 右栏所有 tab | 占位文字 | Phase 5+: diff viewer/terminal/git 真实数据 |
| 功能入口 (Skills/MCP等) | 纯静态按钮 | Phase 3+: 对接路由/弹窗 |

---

## 六、刻意留到 Phase 2 的内容

按照严格范围边界，以下内容**本轮未做**：

1. **不挂载旧 ChatPanel**  中栏 Timeline 区仅为占位，未接入聊天能力
2. **不做 store 连接**  顶部/左栏数据全部 mock，未对接 chat-session.store、workspace.store
3. **不做 diff viewer**  右栏 Review tab 仅为占位
4. **不做 terminal**  右栏 Terminal tab 仅为占位
5. **不做 git**  右栏 Git tab 仅为占位  
6. **不做 browser/computer use**
7. **不做 thread 持久化连接**
8. **不做完整的消息类型渲染**

保留以上内容给 Phase 2，"核心 stores 连接 + 中栏 Chat 挂载"。

---

## 七、构建验证结果

| 检查项 | 结果 |
|--------|------|
| `npx vue-tsc --noEmit` |  通过 (exit 0) |
| `npm run build` |  通过 (205ms) |
| 模块数 | 67 (仅壳层组件，无 Monaco 等重型依赖) |
| CSS 大小 (gzip) | 5.55 KB |
| JS 大小 (gzip) | 73.77 KB |

---

## 八、新壳层验证清单

| 验收项 | 状态 |
|--------|------|
| 新主入口已是 CodexWorkbench |  |
| 界面已是左中右三栏 |  |
| 顶部和底部状态栏都存在 |  |
| 左栏不是旧窄 icon 导航条 |  (280px thread-first 结构) |
| 右栏 review pane 已真实存在 |  (420px, 5个tab) |
| 中栏看起来是 thread pane |  (Header+Timeline+Composer) |
| 右栏看起来是 review/terminal/git 区 |  |
| 左栏项目与线程层级关系清楚 |  |
| vue-tsc 通过 |  |
| npm run build 通过 |  |

---

## 九、下一步建议 (Phase 2)

1. **核心 stores 连接**：TopStatusBar  model-configs.store, LeftSidebar  chat-session.store, ProjectSwitcher  workspace.store
2. **中栏 Chat 挂载**：将旧 ChatPanel 或新的消息组件挂入 CenterThreadPane Timeline 区
3. **Thread 增删改**：LeftSidebar 的 New Thread / Delete / Rename 对接 store
4. **Settings 接入**：左栏 Settings 按钮  旧 SettingsPanel 弹窗
5. **右栏 Review 基础**：挂载最小 diff 显示能力
