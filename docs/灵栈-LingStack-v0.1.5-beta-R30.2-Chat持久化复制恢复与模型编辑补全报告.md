# 灵栈 LingStack v0.1.5 R30.2 — Chat 持久化 + 文本复制恢复 + 模型编辑补全 报告

> 日期：2026-07-03  
> 轮次：R30.2（产品基线修复轮）  
> 范围：Chat 会话持久化、文本复制恢复、模型编辑产品化

---

## 1. 根因分析

### 问题 1：切页面后对话丢失

- **根因**：[WorkbenchLayout.vue](file:///G:/LingStack-nexT/src/layouts/WorkbenchLayout.vue) 使用 `v-if / v-else-if` 切换视图
- 导致 `ChatPanel` 在切到 project/settings/skills/terminal 时被销毁
- 返回 chat 视图时重新挂载，`const messages = ref([])` 初始化为空数组

### 问题 2：聊天文本不可复制

- **根因**：R30 在 ChatPanel 对消息区域设置了 `user-select: none` + `-webkit-user-select: none`
- 同时在 `onMounted` 中添加了 `copy` 和 `cut` 事件的 `preventDefault()`
- 复制按钮也被移除

### 问题 3：模型配置只能删除不能编辑

- **根因**：[model-configs.store.ts](file:///G:/LingStack-nexT/src/features/settings/store/model-configs.store.ts) 已有 `updateConfig(id, patch)` 方法
- 但 [SettingsPanel.vue](file:///G:/LingStack-nexT/src/features/settings/components/SettingsPanel.vue) 未提供编辑入口
- 每个模型卡片只有"当前使用"标记和"删除"按钮

---

## 2. 改动文件清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/features/chat/store/chat-session.store.ts` | **新建** | Pinia 会话持久化 Store |
| `src/features/chat/ChatPanel.vue` | **修改** | 接入 session store、移除 copy 阻断、恢复复制按钮 |
| `src/features/settings/components/AddModelModal.vue` | **修改** | 新增 `editConfig` prop，支持编辑模式 |
| `src/features/settings/components/SettingsPanel.vue` | **修改** | 模型卡片新增"编辑"按钮 |

---

## 3. Chat 会话持久化方案（方案 A：chat-session store）

### 架构

```
ChatPanel.vue (consumes store)
  ↓
useChatSessionStore() (Pinia singleton)
  ↓ persist()
localStorage ('lingstack_chat_session')
```

### Store 状态

| 字段 | 类型 | 说明 |
|------|------|------|
| `messages` | `ref<DisplayMessage[]>` | 当前对话消息 |
| `inputText` | `ref<string>` | 输入框暂存文本 |
| `isSending` | `ref<boolean>` | 发送中状态 |
| `currentSampleId` | `ref<string \| null>` | 当前训练样本 ID |

### 持久化策略

- **即时持久化**：每次 `addMessage()`、`clearChat()`、stream 完成时自动写入 localStorage
- **流式保护**：streaming 中不持久化中间状态，只在完成时写入
- **恢复时清理**：加载时清除所有残留的 `isStreaming: true` 标记
- **重启恢复**：应用初始化时从 localStorage 加载最近一次会话

### 验证场景

1. 发送消息 → 切到「项目」→ 再切回「对话」→ 消息仍在
2. 发送消息 → 切到「设置/技能/终端」→ 再切回「对话」→ 消息仍在
3. 关闭并重启应用 → 最近一次对话自动恢复

---

## 4. 文本复制恢复方案

### 改动

1. **移除 CSS 阻断**：删除 `.chat-panel__content` 的 `user-select: none; -webkit-user-select: none`
2. **移除 JS 阻断**：删除 `onMounted` 中的 `copy`/`cut` 事件 `preventDefault`
3. **恢复复制按钮**：assistant 消息气泡旁添加 Copy 图标按钮
4. **复制状态反馈**：点击后图标切换为 Check，2 秒后恢复

### 复制实现

- 优先使用 `navigator.clipboard.writeText()`（现代 API）
- 降级方案：`document.execCommand('copy')`（兼容旧浏览器）

### 验收结果

- 能点击复制按钮复制 assistant 消息
- 能手动框选消息文本复制（Ctrl+C）
- 不影响聊天流式输出

---

## 5. 模型编辑接入方案

### 改动

1. **AddModelModal 编辑模式**：新增 `editConfig?: UserModelConfig` prop
   - 存在时：标题 →「编辑模型」，按钮 →「保存」
   - 自动预填：displayName、modelId、apiKey、baseUrl、apiFormat 等
   - 高级字段（modelFamily、contextWindow、toolCallBudget）同步预填
   - Tab 锁定到预填配置所在的 tab（不能切换到另一个 tab）

2. **提交逻辑**：调用 `mcStore.updateConfig(id, patch)` 增量更新

3. **SettingsPanel 编辑入口**：每个模型卡片新增 Pencil 编辑图标按钮

### 可编辑字段

- displayName
- apiKey
- modelId
- baseUrl（自定义模型）
- apiFormat（自定义模型）
- modelFamily、inputContextWindow、outputContextWindow、toolCallBudget（高级设置）

### 验收结果

- 模型卡片显示编辑按钮
- 点击编辑 → 弹窗预填当前配置
- 修改 displayName/modelId/apiKey 后保存成功
- 当前激活模型编辑后，聊天继续正常调用
- 删除功能不受影响

---

## 6. 验证结果

| 检查项 | 结果 |
|--------|------|
| `npx vue-tsc --noEmit` | ✓ 通过，0 errors |
| `npm run build` | ✓ 通过，built in 3.25s |

---

## 7. 剩余缺口

1. **多会话系统**：当前仅支持单一会话持久化，如需要多会话切换需扩展 store 结构
2. **会话历史列表**：暂时没有会话管理器 UI
3. **localStorage 容量**：长时间对话可能超过 5MB 限制，后续可迁移到 IndexedDB
4. **编辑模式 Tab 锁定**：编辑时不允许切换 provider/custom tab，只能在原配置所属类型中编辑
