# 灵栈 LingStack v0.1.5 — Tauri 发布 + IndexedDB + 多会话 + Tool 扩展 报告

> 日期：2026-07-03  
> 范围：Tauri build 部署、IndexedDB 迁移、多会话系统、Tool Runtime 文件工具扩展

---

## 1. Tauri Build + 服务器部署

- **安装包**：`灵栈 LingStack_0.1.5_x64-setup.exe`（编译耗时 44.6s）
- **部署路径**：`https://ai.tadanpay.cn/updates/v0.1.5/`
- **latest.json**：已更新，签名与 .sig 文件匹配

---

## 2. localStorage → IndexedDB 迁移

### 问题
localStorage 有 5MB 上限，长对话 + 多会话会溢出。

### 方案
新建 [indexed-db.ts](file:///G:/LingStack-nexT/src/features/chat/store/indexed-db.ts) — 轻量 IndexedDB 封装：
- 自动打开数据库（版本 2）
- 异步 get/put/delete/getAll/getAllKeys
- 两个 ObjectStore：`sessions`（会话数据）、`meta`（元数据）

### 迁移策略
- 首次启动时自动检测 `localStorage` 中的旧数据（key: `lingstack_chat_session`）
- 迁移为 IndexedDB 中的新会话（标题自动生成）
- 迁移完成后清除 localStorage 旧数据

---

## 3. 多会话系统

### Store 扩展
[chat-session.store.ts](file:///G:/LingStack-nexT/src/features/chat/store/chat-session.store.ts) 全面重写：

- **会话列表**：`sessions: ChatSessionMeta[]`（id、title、createdAt、updatedAt、messageCount、lastPreview）
- **活跃会话**：`activeSessionId` → 独立的消息/输入/发送状态
- **操作**：`createSession()`、`switchSession(id)`、`deleteSession(id)`、`renameSession(id, title)`
- **持久化**：每次会话切换/消息变更自动写入 IndexedDB

### UI
ChatPanel 新增会话侧边栏：
- Header 新增会话菜单按钮（MessageSquare 图标 + 会话计数 badge）
- 侧边栏：会话列表 + 新建按钮 + 双击重命名 + 悬停删除
- 当前活跃会话高亮
- 遮罩层点击关闭

---

## 4. Tool Runtime 扩展

### 新增工具
[builtin-tools.ts](file:///G:/LingStack-nexT/src/features/tools/builtin-tools.ts) 新增 2 个 workspace-aware 工具：

| 工具 | 触发关键词 | 功能 |
|------|-----------|------|
| `read_file` | 当前文件、这个文件、打开的文件、查看代码、文件内容 | 读取工作区当前活跃文件内容（最大 4000 字符截断） |
| `list_files` | 项目文件、文件列表、目录结构、看看项目 | 列出项目文件树（最多 50 个文件） |

### 架构变更
- `ToolDefinition.execute()` 签名扩展：新增可选 `context?: ToolContext` 参数
- `ToolContext` 类型新增 `activeFileContent?: string` 字段
- `detectToolTriggers()` 新增可选 `context` 参数
- [chat.service.ts](file:///G:/LingStack-nexT/src/services/chat/chat.service.ts) 的 `sendChatMessage()` 将 `WorkspaceContext` 传递给 `detectToolTriggers()`

---

## 5. 改动文件清单

| 文件 | 变更 |
|------|------|
| `src/features/chat/store/indexed-db.ts` | **新建** — IndexedDB 封装 |
| `src/features/chat/store/chat-session.store.ts` | **重写** — IndexedDB + 多会话 |
| `src/features/chat/ChatPanel.vue` | 多会话侧边栏 UI + init() |
| `src/features/tools/builtin-tools.ts` | 新增 read_file / list_files 工具 |
| `src/features/tools/tool-runtime.types.ts` | ToolContext 新增 activeFileContent |
| `src/services/chat/chat.service.ts` | 传递 context 给 detectToolTriggers |

---

## 6. 验证结果

| 检查项 | 结果 |
|--------|------|
| `npx vue-tsc --noEmit` | ✓ 通过 |
| `npm run build` | ✓ 通过，3.4s |
| `npm run tauri build` | ✓ 通过，44.6s |
| 安装包部署 | ✓ 已上传 |
| latest.json | ✓ 已更新（含正确签名） |

---

## 7. 剩余缺口

- 文件树扫描需要 Tauri 后端支持（`list_files` 当前依赖前端文件树缓存）
- 会话标题自动生成较简单，可优化
- `read_file` 当前只读活跃文件，后续可扩展指定路径读取
