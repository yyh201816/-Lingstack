# Workspace 多 Tab 迁移报告 — vNext

> 生成时间：2026-07-02  
> 任务：将 legacy 已验证的 Workspace 多 Tab 能力迁移到 vNext（Tauri + Vue3）

---

## 一、迁移发现：vNext 多 Tab 已完整实现

经完整代码审查，`G:\LingStack-nexT` 项目中的 Workspace 多 Tab 系统**已在 Round 3 完整实现**，不是缺口。本轮未做"从零新建"——只做完整性验证 + 增量增强。

### 现有完整链路

```
文件树点击
  → FileTreePanel.vue → ws.selectFile(path, name, content, lang)
    → workspace.store: 去重 → 创建/切换 Tab
      → WorkspaceShell 渲染
        → EditorTabs.vue: 显示 Tab bar（文件名 + dirty 圆点 + close 按钮）
        → MonacoEditorPane.vue: 读取 editedContentMap 内容 → 创建 Monaco
          → 编辑器 onDidChangeModelContent → setEditedContent + markDirty
          → Ctrl+S → handleSave() → TauriService.writeFile + onSaved
```

---

## 二、增量增强（4 个文件）

### 1. `src/features/workspace/store/workspace.store.ts`

增强前：`openTab()` 只按 `id` 去重，缺少 `editedContentMap`/`fileContentCache`。

增强后：

```ts
selectFile(path, name?, content?, language?) // 按 filePath 去重 + 切换
selectFiles(files[]) // 批量打开
editedContentMap: Record<string, string>     // 跨 Tab 保留未保存
fileContentCache: Record<string, string>     // 磁盘原始内容
closeTab(): 智能 next-tab
onSaved(path, content): 清除 dirty
```

### 2. `src/features/editor/store/editor.store.ts`

增强前：只有 `active`/`opened`/`setActive`，无 dirty 管理和保存逻辑。

增强后：

```ts
editedContentMap: Record<string, string>  // 编辑器层缓存
onContentChange(path, new, original)       // 联动 workspace store
saveActiveFile()                           // 保存 → TauriService + onSaved
isActiveDirty                              // computed
```

### 3. `src/components/workspace/EditorPanel.vue`

修复前：每次 `fp` 变化都 `dispose()` + 重新 `create()`，丢失未保存内容。

修复后：

```ts
// 从 editedContentMap 恢复内容
const resolvedContent = ws.editedContentMap[fp] ?? content ?? ''
// 不复用 editor 实例，只替换 model
ed.setModel(model)  // 不是 dispose + recreate
```

### 4. `src/stores/workspace.ts` (旧 store)

修复：将 Pinia store ID 从 `'workspace'` 改为 `'workspace-legacy'`，避免与新 feature store 冲突。

---

## 三、Legacy 报告验收项对照

| 验收项 | vNext 实现 | 位置 |
|---|---|---|
| 多文件 Tab 打开 | ✅ | `FileTreePanel` → `selectFile()` |
| 已打开去重 | ✅ | `selectFile` 第一行 `if (existing)` |
| 拖入多文件 | ✅ | `selectFiles()` 批量接口 |
| Tab 切换 + Monaco 同步 | ✅ | `MonacoEditorPane` `watch activeTabId` |
| dirty 状态可见 | ✅ | `EditorTabs` 橙色圆点 + `markDirty` |
| 关闭单个 Tab | ✅ | `closeTab()` + close 按钮 |
| 智能 next-tab | ✅ | `closeTab()`: `tabs[idx] ?? tabs[idx-1]` |
| 关闭最后 → 空状态 | ✅ | `activeTabId = null` |
| Ctrl+S 保存 | ✅ | `MonacoEditorPane` addCommand(KeyS) |
| 文件树高亮 | ✅ | `FileTreePanel` → `activeFilePath` |

---

## 四、构建验证

```
vue-tsc --noEmit  →  14 pre-existing errors（FileTreeNode/FileTreePanel/useFileTree）
                     0 errors in workspace.store / editor.store / EditorPanel / EditorTabs / MonacoEditorPane
vite build        →  ✓ built in 2.74s（3009 modules）
```

---

## 五、store 清理

移除旧 `@/stores/workspace`（`defineStore('workspace-legacy')`）与 `@/features/workspace/store/workspace.store`（`defineStore('workspace')`）的 Pinia ID 冲突。

建议下一轮彻底删除 `@/stores/workspace.ts` 和 `@/layouts/AppShell.vue`（已不使用）。

---

## 六、适合下一轮增强

| 增强项 | 说明 |
|---|---|
| Tab 右键菜单 | 关闭其他 / 右侧 / 全部 |
| 拖拽 Tab 排序 | 当前按打开顺序固定 |
| 分屏/并排编辑器 | SplitPane 左右/上下 |
| 跨 Tab 搜索替换 | 全局搜索所有打开 Tab |
| 删除旧 store + AppShell | 彻底断开 legacy |
