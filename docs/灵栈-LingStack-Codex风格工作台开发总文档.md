# 灵栈 LingStack Codex 风格工作台开发总文档

> 用途：供 Trae / Codex / 其他协同助手统一阅读，用于将 LingStack 从当前半成品桌面 AI 工具重构为 Codex 风格桌面 AI 工作台。
> 
> 项目主目录：`G:\LingStack-nexT`
> 
> 文档定位：这是产品结构、状态架构、组件拆分、开发顺序、验收标准合一的总文档，不是单轮提示词。

---

## 1. 项目目标

LingStack 后续不再继续沿“普通聊天工具 + 若干功能页”的方向演化。

新的唯一主线是：

> 做成一个像 Codex Desktop 一样，以项目、线程、代码变更审查、终端执行、Git 工作流、技能调用为核心的桌面 AI Agent 工作台。

这意味着：

- 不是网页聊天工具
- 不是管理后台
- 不是 IDE 壳子拼装页
- 不是多页面切来切去的工作流

而是：

- thread-first
- project-scoped
- review-first
- terminal-aware
- git-aware
- workspace-aware
- desktop-native

---

## 2. 当前项目必须纠正的问题

当前 LingStack 旧结构里已经暴露出以下错误方向，后续开发必须整体纠偏：

1. 把主界面做成“对话页 / 设置页 / 项目页”割裂式页面
2. Chat 会话依附于组件生命周期，切页后消息丢失
3. 缺少真正的 review pane，导致“改代码”和“审查代码”分离
4. 左栏仍然偏导航，不是项目与线程调度中心
5. 右栏能力不足，无法承担 diff / terminal / git / artifact / comment 主链
6. 模型配置、线程状态、终端状态、项目状态没有统一状态源
7. command bar、chat、workspace 之间入口重复或冲突
8. 产品气质更像“功能集合页”，而不像原生桌面 AI 工作台

后续所有开发都要围绕“整体重构为 Codex 风格工作台”展开，而不是在旧布局上继续缝补。

---

## 3. 技术栈与总架构原则

### 3.1 技术栈
继续沿用现有主栈，不切换框架：

- Tauri 2
- Vue 3
- TypeScript
- Vite
- Pinia
- Monaco Editor
- xterm.js

### 3.2 架构原则

#### 原则 A：单壳层主工作台
主工作台不回退为多路由网页结构，而应继续使用：

- 单壳层 Workbench
- store 驱动当前视图
- 线程与审查流为主轴

#### 原则 B：状态脱离组件本地 ref
以下状态都不能再仅保存在组件本地：

- thread 消息
- composer 草稿
- 当前 active thread
- 当前 project
- review pane 状态
- terminal 执行状态
- git 变更状态
- approvals
- model 激活状态

#### 原则 C：工作流优先于页面
用户不是在“切页面”，而是在一个持续工作流里切换焦点区：

- 左栏切项目 / 线程
- 中栏看 thread
- 右栏看 review / terminal / git

#### 原则 D：Review Pane 是主结构，不是附属结构
代码改动、差异对比、批注、接受、回滚、stage、commit，必须集中在右栏，不再散落在消息流里。

#### 原则 E：一条统一主链
LingStack 后续所有任务都要能落回这一条统一主链：

`用户指令 -> thread -> 工具执行 -> 日志回流 -> 代码变更 -> review -> stage/revert -> git -> 继续`

---

## 4. 目标目录结构

Trae 必须按以下目录进行重组，不要继续在现有零散布局与旧组件基础上堆功能：

```txt
G:\LingStack-nexT\src
├─ app
│  ├─ App.vue
│  ├─ providers
│  └─ boot
├─ layouts
│  └─ codex-shell
│     ├─ CodexWorkbench.vue
│     ├─ parts
│     │  ├─ TitleBar.vue
│     │  ├─ TopStatusBar.vue
│     │  ├─ LeftSidebar.vue
│     │  ├─ ProjectSwitcher.vue
│     │  ├─ ThreadSearchBox.vue
│     │  ├─ ThreadList.vue
│     │  ├─ ThreadListItem.vue
│     │  ├─ CenterThreadPane.vue
│     │  ├─ ThreadHeader.vue
│     │  ├─ ThreadComposer.vue
│     │  ├─ RightReviewPane.vue
│     │  ├─ ReviewTabs.vue
│     │  ├─ StatusBar.vue
│     │  └─ EmptyState.vue
├─ features
│  ├─ projects
│  │  ├─ store
│  │  ├─ services
│  │  ├─ components
│  │  └─ types
│  ├─ threads
│  │  ├─ store
│  │  │  ├─ thread.store.ts
│  │  │  ├─ thread-session.store.ts
│  │  │  └─ thread-search.store.ts
│  │  ├─ services
│  │  ├─ components
│  │  └─ types
│  ├─ chat
│  │  ├─ store
│  │  │  ├─ chat-session.store.ts
│  │  │  └─ composer.store.ts
│  │  ├─ services
│  │  ├─ components
│  │  └─ types
│  ├─ review
│  │  ├─ store
│  │  ├─ services
│  │  ├─ components
│  │  └─ types
│  ├─ terminal
│  │  ├─ store
│  │  ├─ services
│  │  ├─ components
│  │  └─ types
│  ├─ git
│  │  ├─ store
│  │  ├─ services
│  │  ├─ components
│  │  └─ types
│  ├─ settings
│  ├─ skills
│  ├─ mcp
│  ├─ browser
│  ├─ computer-use
│  ├─ approvals
│  └─ workspace
├─ services
│  ├─ runtime
│  ├─ shell
│  ├─ tauri
│  ├─ persistence
│  └─ adapters
├─ shared
│  ├─ ui
│  ├─ tokens
│  ├─ utils
│  ├─ types
│  └─ constants
└─ styles
   ├─ tokens
   ├─ themes
   ├─ base.css
   └─ codex-shell.css
```

---

## 5. 主工作台总布局

### 5.1 总结构

```txt
┌─────────────────────────────────────────────────────────────────────────────┐
│ TitleBar / TopStatusBar                                                    │
├───────────────┬──────────────────────────────────────┬──────────────────────┤
│ LeftSidebar   │ CenterThreadPane                     │ RightReviewPane      │
│               │                                      │                      │
│ 项目切换       │ ThreadHeader                         │ Review Tabs          │
│ Thread 搜索    │ Message Timeline                     │ Diff / Comments      │
│ Thread 列表    │ Tool Logs / Result Blocks            │ Terminal             │
│ Skills         │ Composer                             │ Git / PR / Artifacts │
│ Settings       │                                      │                      │
├───────────────┴──────────────────────────────────────┴──────────────────────┤
│ StatusBar                                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 宽度策略

- 左栏默认：`280px`
- 左栏收起：`60px`
- 左栏最小：`240px`
- 中栏最小：`620px`
- 右栏默认：`420px`
- 右栏最小：`320px`
- 右栏可收起，但不能永久缺席

---

## 6. 全局窗口与壳层规范

### 6.1 Window
Tauri 原生窗口必须支持：

- Windows 原生最小化 / 最大化 / 关闭
- 可拖拽窗口头部
- 最小尺寸限制：`1280 x 800`
- 系统 Snap 吸附
- 单窗口优先，多窗口后续再扩展

### 6.2 TitleBar
文件：`TitleBar.vue`

包含：

- App 名称：`灵栈 LingStack`
- 当前版本号弱展示
- 当前模式标签：`Local / Worktree / Cloud`
- 线程运行状态指示点
- 窗口控制按钮

禁止放：

- 大 logo 横幅
- 品牌宣传标语
- 无关信息卡

### 6.3 TopStatusBar
文件：`TopStatusBar.vue`

包含：

- 当前项目路径
- 当前线程标题
- 当前模型名
- Agent 状态
- Runtime 状态
- Goal progress row（有 goal 时显示）
- Context 使用提示
- 右上角 Settings / Profile 入口

状态文案统一建议：

- `Model: ...`
- `Agent: Ready / Running / Paused / Waiting`
- `Runtime: Online / Local / Restricted`
- `Goal: xx%`

---

## 7. 左侧永久侧边栏开发规范

### 7.1 LeftSidebar 分层
文件：`LeftSidebar.vue`

左栏拆成以下 6 层：

1. 当前项目切换区
2. 新建 thread 按钮
3. thread 搜索框
4. thread 列表区
5. 功能入口区（skills / plugins / mcp / browser / automations）
6. 底部设置区

### 7.2 ProjectSwitcher
文件：`ProjectSwitcher.vue`

功能：

- 显示当前项目名
- 显示项目路径简写
- 切换最近项目
- 打开本地目录
- 预留远程目录/SSH/Worktree 项目

数据结构：

```ts
interface ProjectItem {
  id: string
  name: string
  path: string
  kind: 'local' | 'worktree' | 'remote'
  lastOpenedAt: string
  branch?: string
  remoteHost?: string
}
```

### 7.3 New Thread Button
点击后流程：

1. 打开 `NewThreadModal`
2. 选择模式：`Local / Worktree / Cloud`
3. 选择项目上下文
4. 创建 thread
5. 左栏新增 thread
6. 中栏自动聚焦 composer

### 7.4 Thread Search
文件：`ThreadSearchBox.vue`

支持：

- 搜索 thread 标题
- 搜索项目路径
- 搜索分支名
- 搜索摘要文本

快捷键：

- `Ctrl+G` 聚焦搜索框
- 上下键选择结果
- Enter 打开 thread
- Esc 退出搜索态

### 7.5 Thread List
文件：`ThreadList.vue`

每个 thread item 显示：

- 标题
- 最近时间
- 当前模式标签
- 所属项目/分支
- 状态标签
- pinned 状态
- hover 操作

状态类型：

```ts
type ThreadStatus =
  | 'idle'
  | 'running'
  | 'waiting_approval'
  | 'waiting_input'
  | 'ready_review'
  | 'paused'
  | 'failed'
  | 'done'
```

hover 操作：

- Rename
- Pin / Unpin
- Archive
- Delete
- Copy Deep Link

### 7.6 左栏附加入口
包含：

- Skills
- Plugins
- Automations
- MCP / Integrations
- Browser
- Remote Connections

### 7.7 左栏底部
包含：

- Settings
- Profile
- 当前环境小状态
- 可选：同步/连接状态提示

---

## 8. 中间 Thread 主面板开发规范

### 8.1 CenterThreadPane
文件：`CenterThreadPane.vue`

结构：

1. ThreadHeader
2. MessageTimeline
3. ThreadComposer

### 8.2 ThreadHeader
文件：`ThreadHeader.vue`

包含：

- 当前 thread 标题
- 所属项目
- 模式标签
- 当前状态
- 最近活动时间
- goal progress row
- 动作按钮：
  - Pause
  - Resume
  - Stop
  - Rename
  - Open Review
  - Open Terminal

### 8.3 Message Timeline
定义统一消息类型：

```ts
type ThreadMessageType =
  | 'user'
  | 'assistant'
  | 'system'
  | 'tool_log'
  | 'command'
  | 'diff'
  | 'artifact'
  | 'approval'
  | 'plan'
  | 'goal'
  | 'review_comment'
```

数据结构：

```ts
interface DisplayMessage {
  id: string
  threadId: string
  type: ThreadMessageType
  role?: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  streaming?: boolean
  error?: boolean
  meta?: {
    modelName?: string
    toolName?: string
    command?: string
    filePath?: string
    diffId?: string
    artifactId?: string
    exitCode?: number
    durationMs?: number
  }
}
```

### 8.4 消息组件拆分

```txt
chat/components/
├─ UserMessageBlock.vue
├─ AssistantMessageBlock.vue
├─ SystemMessageBlock.vue
├─ ToolLogBlock.vue
├─ CommandBlock.vue
├─ DiffMessageBlock.vue
├─ ArtifactMessageBlock.vue
├─ ApprovalBlock.vue
├─ PlanBlock.vue
└─ GoalProgressBlock.vue
```

### 8.5 渲染规则

#### 用户消息
- 右侧弱底色块
- 支持复制
- 后续支持编辑重发

#### Assistant 消息
- 左侧主体内容
- 支持选中复制
- 支持继续追问
- 支持“作为任务继续执行”

#### ToolLog
- 等宽字体
- 默认长日志折叠
- 可展开全部
- 显示时间、退出码、来源工具

#### DiffMessage
- 显示文件数
- 显示增删统计
- 点击跳到右栏对应 diff

#### ApprovalMessage
- 强高亮
- 提供 Allow once / Deny / 查看详情

### 8.6 ThreadComposer
文件：`ThreadComposer.vue`

必须支持：

- 多行输入
- Enter 发送
- Shift+Enter 换行
- Stop 按钮
- slash commands
- skills 调用
- 文件拖拽/附件
- 草稿持久化
- 当前模式提示
- 当前 context 摘要提示

状态结构：

```ts
interface ComposerState {
  draft: string
  mode: 'ask' | 'agent' | 'plan' | 'review'
  attachments: ComposerAttachment[]
  canSend: boolean
  isSending: boolean
}
```

操作按钮：

- Send
- Stop
- Attach
- Slash hint
- Current mode
- Context summary

---

## 9. 右侧 Review Pane 开发规范

### 9.1 RightReviewPane
文件：`RightReviewPane.vue`

采用 tab 结构：

- Review
- Terminal
- Git
- Artifacts
- PR

### 9.2 Review Tab
文件：`ReviewDiffPane.vue`

包含：

- 文件列表
- 变更统计
- diff viewer
- inline comment
- stage/revert

数据结构：

```ts
interface ReviewFileDiff {
  id: string
  filePath: string
  status: 'added' | 'modified' | 'deleted' | 'renamed'
  additions: number
  deletions: number
  hunks: ReviewHunk[]
}
```

```ts
interface ReviewHunk {
  id: string
  header: string
  lines: ReviewLine[]
}
```

```ts
interface ReviewLine {
  lineType: 'context' | 'add' | 'delete'
  oldNumber?: number
  newNumber?: number
  content: string
}
```

### 9.3 Inline Comment
文件：`InlineCommentEditor.vue`

功能：

- 对某行/某 hunk 写评论
- 保存后写回当前 thread
- 自动形成 review_comment 消息
- 后续可驱动 AI 二次修复

### 9.4 Terminal Tab
文件：`TerminalPane.vue`

行为：

- 与当前 thread 绑定
- 实时命令输出
- 清屏
- 停止进程
- 展示退出码
- 展示执行时长

数据结构：

```ts
interface TerminalEntry {
  id: string
  threadId: string
  command: string
  cwd: string
  startedAt: string
  finishedAt?: string
  exitCode?: number
  status: 'running' | 'done' | 'failed' | 'killed'
  output: string
}
```

### 9.5 Git Tab
文件：`GitPane.vue`

包含：

- 当前分支
- 未提交变更数
- stage all
- revert all
- commit message 生成
- commit
- push
- create branch
- create PR（预留）

### 9.6 Artifacts Tab
包含：

- PDF 预览
- 文档预览
- 图片预览
- 导出文件列表

---

## 10. Settings 体系重构规范

Settings 必须从“普通设置页”升级为 Codex 风格分区。

建议 section：

1. General
2. Appearance
3. Models
4. Agent
5. Keyboard Shortcuts
6. Integrations / MCP
7. Skills
8. Terminal & Sandbox
9. Browser / Computer Use
10. Memories / Context
11. Updates

### 10.1 Models 页
必须支持：

- 模型列表
- 当前激活模型
- 新增模型
- 编辑模型
- 删除模型
- 切换激活模型

说明：
当前 store 已有 `updateConfig()`，因此 UI 必须正式接出“编辑模型”能力，不再只有删除。

### 10.2 Agent 页
配置：

- 系统行为偏好
- 自定义规则
- 项目级规则
- AGENTS.md 入口
- skill 加载状态
- 默认执行模式

### 10.3 Keyboard Shortcuts
必须支持：

- 搜索命令
- 修改快捷键
- 重置默认快捷键

### 10.4 Integrations / MCP
包含：

- 已连接 MCP 列表
- OAuth 状态
- 启用/停用
- 错误状态

---

## 11. 状态管理设计

### 11.1 必建 Store 清单

```txt
navigation.store.ts
project.store.ts
thread.store.ts
thread-session.store.ts
thread-search.store.ts
chat-session.store.ts
composer.store.ts
review.store.ts
terminal.store.ts
git.store.ts
settings.store.ts
model-configs.store.ts
skills.store.ts
mcp.store.ts
approval.store.ts
runtime.store.ts
```

### 11.2 核心状态职责

#### project.store
管理：
- 当前项目
- 最近项目
- 模式
- 分支

#### thread.store
管理：
- thread 列表
- activeThreadId
- thread 状态
- 搜索结果

#### thread-session.store
管理：
- 每个 thread 的消息
- 恢复状态
- 持久化
- deep link

#### composer.store
管理：
- 输入草稿
- 附件
- 发送状态
- 当前输入模式

#### review.store
管理：
- 当前 diff
- 当前文件
- 当前 hunk
- 评论列表

#### terminal.store
管理：
- 终端实例
- 命令历史
- 输出缓存

#### git.store
管理：
- branch
- changed files
- staged files
- commit draft

---

## 12. 持久化策略

### 12.1 必须持久化的内容

- 最近项目
- 当前项目
- thread 列表
- 当前 active thread
- 每个 thread 的消息
- composer draft
- 当前激活模型
- 模型配置
- settings
- 面板展开状态
- terminal 历史（最近若干条）
- review pane 最后打开 tab

### 12.2 存储建议
短期可以继续 localStorage，长期建议迁移为 Tauri 本地文件存储。

建议目录：

```txt
%APPDATA%/LingStack/
├─ settings.json
├─ projects.json
├─ threads/
│  ├─ thread-1.json
│  ├─ thread-2.json
├─ review/
├─ terminal/
└─ cache/
```

---

## 13. 端到端交互链路设计

### 13.1 启动流程
1. 启动窗口
2. 读取 settings
3. 读取 models
4. 读取最近项目
5. 读取 thread 列表
6. 恢复上次 active thread
7. 恢复 composer draft
8. 初始化 runtime
9. 初始化 skills / MCP / integrations
10. 初始化 terminal runtime
11. 渲染 CodexWorkbench

### 13.2 打开项目流程
1. 用户点击 Open Folder
2. 选择本地目录
3. 创建或切换当前 project
4. 读取 Git 信息
5. 载入该项目历史 threads
6. 中栏保持当前 thread 或创建新 thread
7. 右栏准备 review / git / terminal

### 13.3 新建线程流程
1. 点击 New Thread
2. 选择 Local / Worktree / Cloud
3. 输入初始 prompt
4. 创建 thread
5. 左栏新增 thread item
6. 中栏进入该 thread
7. composer 聚焦
8. 发送第一条消息

### 13.4 用户发起任务流程
1. 用户在 composer 输入
2. 写入当前 thread message
3. thread 状态改为 running
4. 生成 tool execution plan
5. 执行 shell / file / git / browser / skill 等动作
6. 实时回流消息与日志
7. 如有文件变更，写入 review.store
8. 右栏 review pane 高亮
9. 用户 review
10. 继续修改 / 接受 / stage / revert

### 13.5 审批流程
1. 某动作需要高权限
2. 生成 approval message
3. 中栏显示审批卡片
4. 用户点击 allow/deny
5. 结果写回 approval.store
6. 线程继续或中断

### 13.6 停止流程
1. 用户点击 Stop
2. 当前运行 tool 终止
3. terminal.store 标记 killed
4. thread 状态转为 paused 或 waiting_input
5. 中间结果保留

### 13.7 Review 流程
1. thread 产生 diff
2. review.store 载入 diff
3. 右栏自动跳转 Review tab
4. 用户逐文件审查
5. 可 comment / stage / revert
6. comment 回流到 thread
7. AI 再次修复

### 13.8 Git 提交流程
1. review 完成
2. 打开 Git tab
3. 生成 commit draft
4. 用户编辑 commit message
5. 执行 commit
6. 需要时 push
7. 后续扩展 create PR

---

## 14. Thread、多会话与记忆设计

### 14.1 Thread 独立性
每个 thread 必须独立保存：

- 标题
- 项目
- 模式
- 消息
- review 状态
- terminal 历史
- composer 草稿
- 运行状态

### 14.2 Thread 持久化要求
切换：

- 项目
- 设置
- 技能
- 终端
- review tab

都不能导致 thread 消息丢失。

关闭应用后重新打开：

- 最近 thread 可恢复
- 最近消息可恢复
- 当前 draft 可恢复

### 14.3 Memories
首版优先做：

- 项目规则缓存
- 最近 thread 上下文缓存
- 当前活跃项目摘要缓存

不要先做夸张“记忆库 UI”，先做可靠上下文层。

---

## 15. 视觉系统规范

### 15.1 主题
必须支持：

- light
- dark

不要大面积营销渐变，不要做成官网感。

### 15.2 Token 命名建议

```txt
--ls-bg-app
--ls-bg-panel
--ls-bg-elevated
--ls-bg-hover
--ls-border-soft
--ls-border-strong
--ls-text-primary
--ls-text-secondary
--ls-text-muted
--ls-accent
--ls-success
--ls-warning
--ls-danger
--ls-radius-sm
--ls-radius-md
--ls-radius-lg
--ls-space-1 ~ --ls-space-9
```

### 15.3 字体
- UI：系统无衬线
- Code：JetBrains Mono / Cascadia Mono 等宽字体

### 15.4 动效
只允许轻量动效：

- hover
- fade
- collapse
- pane resize
- progress shimmer

禁止花哨过度动效。

---

## 16. 需要重点替换/重构的现有文件

以下文件不能继续只做微调，Trae 应按新结构重构：

- `G:\LingStack-nexT\src\layouts\WorkbenchLayout.vue`
- `G:\LingStack-nexT\src\features\chat\ChatPanel.vue`
- `G:\LingStack-nexT\src\features\settings\components\SettingsPanel.vue`
- `G:\LingStack-nexT\src\layouts\parts\CommandBar.vue`
- `G:\LingStack-nexT\src\layouts\parts\ProjectPanel.vue`
- `G:\LingStack-nexT\src\layouts\parts\TopBar.vue`

原则：

- 不继续往旧 `WorkbenchLayout` 堆功能
- 升级为新 `CodexWorkbench`
- 旧 Chat 输入逻辑并入 `ThreadComposer`
- 旧 Settings 重做为分区式结构
- 右侧 review pane 建新模块，不再用占位壳层

---

## 17. Trae 执行要求

### 17.1 不准这样做
- 不准继续做“对话页 / 设置页 / 项目页”割裂页面
- 不准让 review pane 继续缺席
- 不准把 thread 状态继续保存在组件局部 ref
- 不准只做 UI 壳层不接状态
- 不准新增一套平行 store
- 不准保留旧壳层和新壳层长期并存

### 17.2 必须这样做
- 建立新的 `CodexWorkbench` 主壳层
- 左中右三栏一次性搭好
- 线程体系先落地
- thread 持久化先落地
- review pane 先占位并接真实状态
- git / terminal / diff 统一进入右栏
- settings 分区化
- store 单一真相源

---

## 18. 分阶段开发顺序

### Phase 1：壳层重构
先做：

1. `CodexWorkbench.vue`
2. `TitleBar.vue`
3. `TopStatusBar.vue`
4. `LeftSidebar.vue`
5. `CenterThreadPane.vue`
6. `RightReviewPane.vue`
7. `StatusBar.vue`

目标：
先把工作台骨架立住。

### Phase 2：状态基线
再做：

1. `project.store.ts`
2. `thread.store.ts`
3. `thread-session.store.ts`
4. `composer.store.ts`
5. `review.store.ts`
6. `terminal.store.ts`
7. `git.store.ts`

目标：
所有关键状态脱离组件本地 ref。

### Phase 3：Thread 主链
再做：

1. ThreadList
2. ThreadHeader
3. MessageTimeline
4. ThreadComposer
5. Thread 持久化

目标：
切页不丢、重启可恢复。

### Phase 4：Review 主链
再做：

1. Diff viewer
2. File list
3. Inline comment
4. Stage / revert
5. comment 回流 thread

目标：
形成真正的审查链。

### Phase 5：Terminal + Git
再做：

1. Terminal runtime state
2. Git pane
3. commit / branch / stage / revert 流程

### Phase 6：Skills / MCP / Browser / Computer Use
最后补：

1. 技能入口
2. MCP 状态入口
3. Browser 入口
4. Computer Use 入口
5. Automations 入口

---

## 19. 验收标准

### 19.1 第一轮壳层验收
必须看到：

- 顶部状态栏
- 左侧 thread-first sidebar
- 中栏 thread 主面板
- 右栏 review pane
- 底部状态栏
- 整体明显更像 Codex，而不是聊天工具

### 19.2 第二轮功能验收
必须通过：

1. 新建 thread
2. 切换 thread
3. thread 内容不丢
4. 右栏可打开 review
5. terminal tab 可切换
6. git tab 可展示
7. 模型设置可编辑
8. 聊天文本可复制
9. composer 草稿不丢
10. 重启后恢复最近 thread

### 19.3 第三轮产品验收
必须闭合完整链路：

`项目 -> thread -> 输入 -> 执行 -> 日志 -> diff -> review -> git -> 继续`

如果这一条链路没闭合，就不算仿 Codex 成功。

---

## 20. 最终标准

Trae 最终开发出来的 LingStack，不应该再像“带项目侧栏的聊天工具”，而应该像：

> 一个真正围绕线程、项目、代码变更审查、终端执行、Git 工作流和技能调用组织起来的 Codex 风格桌面 AI Agent 工作台。