# R4: AI 主链接入与工作区实用化增强 — 完成报告

> 生成时间：2026-07-02
> 阶段：vNext Round 4
> 目标：让 vNext 从"漂亮骨架"变成"真正可工作的 AI 工具"

---

## 一、Chat 面板接入真实 AI 对话

### 发现
`src/features/chat/ChatPanel.vue` + `src/services/chat/chat.service.ts` **已完整实现** SSE 流式 OpenAI 对话（含 System Prompt、AbortController、token 增量更新、错误处理、mock fallback），但被 `isBrowser()` 守卫强制阻断——浏览器的 dev 环境永远走 mock。

### 修复
```ts
// 之前: if (isBrowser()) → mock (永远不解禁)
// 之后: if (!config.apiKey || !config.apiKey.trim()) → mock (仅在未配置 Key 时 mock)
```
同时移除 `isBrowser` import。

### 效果
- 无 API Key → Mock 流式输出（dev 无 Key 时仍可用）
- 有 API Key → 真实 OpenAI 兼容 API + SSE 流式响应
- ChatPanel 复用现有 UI：空态 → 发送 → loading → 流式 tokens → 完成

> **修改文件:** `src/services/chat/chat.service.ts`（-4 行守卫，+6 行 Key 检查）

---

## 二、splitpanes 可调工作区布局

### 实现
安装 `splitpanes`，重写 `WorkspaceShell.vue`：

```
Splitpanes (horizontal)
├── Pane: FileTreePanel  (22% width, min 14%, max 40%)
└── Pane: Splitpanes (vertical)
    ├── Pane: EditorTabs + MonacoEditorPane  (68% height)
    └── Pane: TerminalPane  (32% height, min 8%, max 50%)
```

### 交互特性
- 文件树宽度可拖拽调整（col-resize cursor）
- 终端高度可拖拽调整（row-resize cursor）
- 分割条 hover/active 时变 brand 色
- 最小/最大尺寸边界约束
- 浅色主题自动适配

> **修改文件:** `src/features/workspace/components/WorkspaceShell.vue`（重写）
> **依赖:** `splitpanes`（已安装）

---

## 三、文件树右键能力

### 实现
新增 3 个组件：

| 文件 | 职责 |
|---|---|
| `FileTreeNode.vue` | 递归文件树节点 SFC（替代内联 `defineComponent` + inline template） |
| `FileTreeContextMenu.vue` | Teleport 到 body 的自定义右键菜单（桌面工具风格） |
| `FileTreePanel.vue` | 重写：接入新 TreeNode + ContextMenu，含 4 个操作 handler |

### 右键菜单能力

| 操作 | 目录上 | 文件上 | 实现 |
|---|---|---|---|
| 新建文件 | ✅ | ✅（父目录）| `TauriService.writeFile` + `ft.setRoot()` |
| 新建文件夹 | ✅ | ✅（父目录）| `TauriService.createDirectory` + `ft.setRoot()` |
| 重命名 | — | ✅ | `TauriService.rename` + `ft.setRoot()` |
| 删除（含确认） | ✅ | ✅ | `TauriService.delete` + `ft.setRoot()` |

### TauriService 新增方法
`createDirectory` / `rename` / `deleteEntry` — 全部含 Tauri IPC + 浏览器 mock 双路径。

### 交互特性
- 右键 → fixed 定位菜单（`Teleport` to body）
- 目录上右键：新建文件/文件夹 + 删除
- 文件上右键：新建文件/文件夹 + 重命名 + 删除
- 点击外部自动关闭
- 动画：`ctxFadeIn` scale+fade

> **新增文件:** `FileTreeNode.vue`、`FileTreeContextMenu.vue`
> **修改文件:** `FileTreePanel.vue`（重写）、`tauri.service.ts`（+3 FS 方法）

---

## 四、构建验证

```
vue-tsc --noEmit  →  零错误
vite build        →  3009 modules, 2.98s, exit 0
```

---

## 五、R4 完成度总结

| R4 目标 | 状态 | 说明 |
|---|---|---|
| Chat 接入真实 AI | ✅ | SSE streaming 就绪，移除 mock 阻断 |
| splitpanes 可调布局 | ✅ | 文件树 + 编辑器 + 终端三区拖拽可调 |
| 文件树右键 | ✅ | 新建文件/文件夹/重命名/删除 4 项 |

### 未启动（P1/P2 备选）
- 命令面板 (Ctrl+P/Ctrl+K)
- 原生桌面能力渐进迁移 (dialog/tray/recent projects/drag-drop)
- Rust backend `create_dir`/`rename`/`delete_entry` 命令需补齐

---

## 六、下一轮建议

1. **补齐 Rust backend FS 命令**（`create_dir`/`rename`/`delete_entry`）— 目前浏览器 mock 可用，Tauri 环境需 Rust 端实现
2. **命令面板接入** — Ctrl+P 快速文件/命令/技能搜索
3. **原生桌面能力第一项** — dialog（文件/目录选择对话框）
