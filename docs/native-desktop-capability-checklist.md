# vNext 原生桌面能力迁移清单

> 迁移依据：`legacy/docs/native-desktop-integration-round3-report.md`
> 生成时间：2026-07-02
> 定位：将 legacy Electron 已验证的原生桌面能力，转译为 vNext（Tauri）待实现的对应能力清单

---

## 一、Legacy 已验证能力清单（全部 ✅）

以下 5 类能力在 legacy（Electron）中已验证通过。vNext 需在 Tauri 生态中实现对等功能。

### A. 文件/目录拖拽进入工作区

| 能力 | Legacy 已验证 | vNext 待实现 |
|------|:---:|:---:|
| 拖入文件夹 → 自动导航到工作区并打开 | ✅ | ⬜ |
| 拖入单个文件（有工作区）→ 高亮并打开 | ✅ | ⬜ |
| 拖入单个文件（无工作区）→ 以父目录初始化工作区 | ✅ | ⬜ |
| 拖入多个文件 → 全部进入多 Tab | ✅ | ⬜ |
| 拖入无效路径 → 静默忽略 | ✅ | ⬜ |
| 拖拽悬停 → 显示覆盖层 + 差异化提示（目录/文件） | ✅ | ⬜ |

**vNext 技术映射：**
- Tauri `drag-drop` 事件 → `tauri://drag-drop` / `onDragDropEvent`
- 路径校验 → `@tauri-apps/plugin-fs` 的 `stat()`
- 覆盖层 UI → Vue 组件 + `dragCounter` 逻辑

### B. 最近项目菜单动态联动

| 能力 | Legacy 已验证 | vNext 待实现 |
|------|:---:|:---:|
| 原生菜单「文件 → 最近项目」二级子菜单 | ✅ | ⬜ |
| 菜单项从 Store 持久化数据实时读取 | ✅ | ⬜ |
| 空状态显示 disabled 占位「暂无最近项目」 | ✅ | ⬜ |
| 点击菜单项 → 检查路径存在 → 打开 | ✅ | ⬜ |
| 失效路径 → 弹窗提示并移除 | ✅ | ⬜ |
| 显示项目文件夹名（basename）+ 完整路径 tooltip | ✅ | ⬜ |

**vNext 技术映射：**
- 原生菜单 → Tauri `Menu` / `Submenu` API（`@tauri-apps/api/menu`）
- 动态子菜单 → 监听 `recentProjects` Store 变化 → `Menu.new()` 重建
- 路径检查 → `@tauri-apps/plugin-fs` 的 `exists()`

### C. 原生文件对话框

| 能力 | Legacy 已验证 | vNext 待实现 |
|------|:---:|:---:|
| `dialog:openDirectory` — 选择文件夹 | ✅ | ⬜ |
| `dialog:openFile` — 选择文件（支持类型过滤） | ✅ | ⬜ |
| `dialog:saveFile` — 保存文件对话框 | ✅ | ⬜ |
| 取消 → 返回 `null` | ✅ | ⬜ |
| 异常时返回 `null`（非 Electron 环境 fallback） | ✅ | ⬜ |

**vNext 技术映射：**
- Tauri `dialog` 插件（`@tauri-apps/plugin-dialog`）
  - `open()` — 文件/目录选择
  - `save()` — 保存文件对话框
- 异常 → try/catch 返回 `null`

### D. 托盘/窗口控制

| 能力 | Legacy 已验证 | vNext 待实现 |
|------|:---:|:---:|
| 关闭窗口 → 最小化到托盘 | ✅ | ⬜ |
| 托盘双击 → 恢复窗口 | ✅ | ⬜ |
| 窗口最小化后从托盘恢复 → `restore()` + `focus()` | ✅ | ⬜ |
| 单实例 → second-instance 聚焦已有窗口 | ✅ | ⬜ |
| 托盘菜单「显示/隐藏」切换 | ✅ | ⬜ |
| 托盘菜单打开 Chat / Workspace / Settings | ✅ | ⬜ |
| `forceQuit` → 真正退出应用 | ✅ | ⬜ |

**vNext 技术映射：**
- 系统托盘 → `tauri::tray` / `TrayIconBuilder`（Rust 端）
- 单实例 → `tauri::RunEvent::SecondInstance`
- 窗口控制 → `Window::hide()` / `Window::show()` / `Window::set_focus()`
- 关闭行为 → `Window::on_close_requested()`

### E. 导航与事件 IPC

| 能力 | Legacy 已验证 | vNext 待实现 |
|------|:---:|:---:|
| 导航到指定视图 | ✅ | ⬜ |
| 打开命令面板 | ✅ | ⬜ |
| 打开指定工作区路径 | ✅ | ⬜ |
| 触发打开文件对话框 | ✅ | ⬜ |
| 最近项目同步（渲染 → 主进程） | ✅ | ⬜ |
| 最近项目移除请求（主进程 → 渲染） | ✅ | ⬜ |

**vNext 技术映射：**
- Tauri `emit()` / `listen()` 事件系统
- 或通过 Vue Store + Tauri `invoke()` 实现双向通信

---

## 二、vNext 当前状态

| 能力块 | Legacy 验证 | vNext 代码存在 | vNext 已验证 |
|--------|:---:|:---:|:---:|
| 文件/目录拖拽 | ✅ | ⬜ | ⬜ |
| 最近项目菜单 | ✅ | ⬜ | ⬜ |
| 原生对话框 | ✅ | ⬜ | ⬜ |
| 托盘/窗口控制 | ✅ | ⬜ | ⬜ |
| 导航 IPC | ✅ | ⬜ | ⬜ |

**说明：** vNext 当前专注于架构骨架与多 Tab 编辑能力。以上 5 项原生桌面能力尚未在 vNext 中实现。Legacy 已验证的能力为 vNext 提供了清晰的能力规格书。

---

## 三、推荐实现顺序

### P0 — 基础桌面壳
1. **托盘 + 窗口控制** — 先有最小可用桌面壳（Tauri tray + window hide/show/focus）
2. **原生对话框** — 文件/目录选择（Tauri dialog plugin，`TauriService` 已有 `readFile`/`writeFile`，扩展 `openFile`/`openDirectory`/`saveFile`）

### P1 — 交互增强
3. **拖拽进入工作区** — Tauri drag-drop events → FileTreePanel
4. **导航 + 最近项目菜单** — Tauri Menu API + Store 联动

### P2 — 细节收口
5. **单实例 + 恢复行为** — Tauri `SecondInstance` event
6. **窗口位置/大小记忆** — Tauri window state plugin

---

## 四、Legacy 残留问题 vNext 有条件解决

| Legacy 问题 | vNext 改善机会 |
|---|---|
| 拖拽多文件只打开第一个 | vNext 已有 `selectFiles()` 批量接口，可直接解决 |
| 菜单延迟触发依赖 `setTimeout(200ms)` | Tauri `listen()` 事件机制更干净，可去除延迟 hack |
| Windows 打包未实际验证 | vNext 从第一轮即可做 Tauri 真实构建验证 |
| 最近项目菜单不支持右键 | Tauri Menu API 限制相同，但可提前预留自定义菜单入口 |
