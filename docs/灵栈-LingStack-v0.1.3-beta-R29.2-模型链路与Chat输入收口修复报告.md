# 灵栈 LingStack v0.1.3-beta R29.2 — 模型链路与Chat输入收口修复报告

> 日期：2026-07-03  
> 轮次：R29.2  
> 范围：modelId 真实 API 对齐 + 响应式状态修复 + 聊天页双输入收口

---

## 1. 根因分析

### Bug 1: modelId 发送错误（400 错误）

**现象**：用户在设置中添加 DeepSeek 模型后，聊天发送时报错：

> `请求参数错误 (400): "The supported API model names are deepseek-v4-pro or deepseek-v4-flash, but you passed DeepSeek-V4-Pro."`

**根因**：
1. **preset-providers.ts 中的 model `id` 使用了过时/不正确的 canonical ID**
   - 旧 ID：`deepseek-chat`、`deepseek-v3-0324`、`deepseek-v3-1`
   - DeepSeek 当前 API 仅接受：`deepseek-v4-pro`、`deepseek-v4-flash`
2. **`id`（canonical ID）与 `label`（展示名）语义混淆**：虽然 store 正确使用 `model.id` 作为 `modelId`，但 `id` 值本身不正确

### Bug 2: CommandBar 误判"未配置模型"导致 Enter 跳设置页

**现象**：用户在 Settings 中已成功添加并激活模型，但切换到聊天页后，底部 CommandBar 仍显示"未配置模型服务 → 前往设置"，按 Enter 被跳去设置页。

**根因**：CommandBar 使用了 `isConfigured()`（非响应式函数），该函数读取 `chat.service` 内部的 `let config` 普通变量。`setChatConfig()` 更新该变量后，Vue 的 computed 不会触发重新计算。

### Bug 3: TopBar 状态不同步

**现象**：Settings 显示已配置模型，但 TopBar 仍显示"Model: 未配置"。

**根因**：同 Bug 2——TopBar 在 setup 中调用 `getChatConfig()` 获取一个配置快照，此后不再更新。

### Bug 4: 聊天页存在两个输入入口

**现象**：ChatPanel 有自己的输入框，同时 WorkbenchLayout 底部还有全局 CommandBar。两者行为不一致造成困惑。

---

## 2. 改动文件清单

| # | 文件 | 改动类型 | 说明 |
|---|------|----------|------|
| 1 | `src/features/settings/data/preset-providers.ts` | Model ID 修复 | DeepSeek IDs → canonical v4 系列（3 个模型） |
| 2 | `src/services/chat/chat.service.ts` | 响应式重构 | `let config` → `ref<ChatConfig>` + 导出 `chatConfigured` / `chatModelLabel` computed refs |
| 3 | `src/layouts/parts/CommandBar.vue` | 响应式修复 | `isConfigured()` → `chatConfigured`（响应式 computed ref） |
| 4 | `src/layouts/parts/TopBar.vue` | 响应式修复 | `getChatConfig()` 快照 → `chatModelLabel` / `chatConfigured` refs |
| 5 | `src/layouts/WorkbenchLayout.vue` | 双输入收口 | CommandBar `v-if="nav.activeView !== 'chat'"` — 聊天页隐藏全局输入 |

---

## 3. modelId 修复策略

### 原则
- `model.id` = 真实 API 接受的 canonical modelId（永远发给 API）
- `model.label` = 用户可见展示名（仅用于 UI 下拉菜单和配置卡片）

### DeepSeek 预设更新

| label（展示名） | id（canonical API ID） | 旧 id |
|----------------|------------------------|-------|
| DeepSeek V4 Pro | `deepseek-v4-pro` | `deepseek-chat` |
| DeepSeek V4 Flash | `deepseek-v4-flash` | *(新增)* |
| DeepSeek R1（推理） | `deepseek-reasoner` | `deepseek-reasoner`（不变） |

已删除过时 ID：`deepseek-v3-0324`、`deepseek-r1-0528`、`deepseek-v3-1`。

### 数据流保证
```
AddModelModal 选择模型
  → option.value = model.id (canonical)
  → store.addFromPreset(providerId, modelId=model.id, ...)  ← 永远传 canonical ID
  → UserModelConfig.modelId = model.id
  → syncToChatService() → setChatConfig({model: cfg.modelId})
  → sendChatMessage → body.model = chatConfigRef.value.model  ← 永远传 canonical ID
  → 始终为 deepseek-v4-pro / deepseek-v4-flash，不再是展示名
```

---

## 4. 响应式状态修复策略

### 改动前
```
chat.service: let config: ChatConfig    ← 普通变量
CommandBar: computed(() => isConfigured())  ← 读取普通变量，不触发 Vue 响应式
TopBar: const cfg = getChatConfig()     ← 获取快照后永不更新
```

### 改动后
```
chat.service: export const chatConfigRef = ref<ChatConfig>(loadConfig())
              export const chatConfigured = computed(() => chatConfigRef.value.apiKey.length > 0)
              export const chatModelLabel = computed(() => ...)
              export function setChatConfig(partial) { chatConfigRef.value = { ...chatConfigRef.value, ...partial } }

CommandBar: const hasProvider = chatConfigured         ← 直接使用响应式 computed ref
TopBar: const modelLabel = chatModelLabel              ← 直接使用响应式 computed ref
        const modelStatus = computed(() => chatConfigured.value ? 'ready' : 'offline')
```

### 响应式传播链
```
store.setActiveConfig(id)
  → syncToChatService(cfg)
    → setChatConfig({ model: cfg.modelId, apiKey: cfg.apiKey, ... })
      → chatConfigRef.value = new config          ← 触发 Vue 响应式
        → chatConfigured 重新计算
          → CommandBar.hasProvider 自动更新
          → TopBar.modelLabel 自动更新
          → TopBar.modelStatus 自动更新
```

---

## 5. 聊天页双输入收口方案

选择 **方案 A**：聊天页以 ChatPanel 为唯一主输入，CommandBar 在 chat 路由下隐藏。

```html
<!-- WorkbenchLayout.vue -->
<CommandBar v-if="nav.activeView !== 'chat'" ... />
```

效果：
- 用户在 project/skills/settings/terminal 视图下 → CommandBar 正常显示
- 用户切换到 chat 视图 → CommandBar 隐藏，仅 ChatPanel 输入框可用
- 单一输入入口，行为一致

---

## 6. 构建验证

| 命令 | 结果 |
|------|------|
| `npx vue-tsc --noEmit` | ✅ 零错误 |
| `npm run build` | ✅ 3041 模块，3.33s，零错误 |
| `npm run tauri build` | ⏳ 进行中 |

---

## 7. 验收场景验证（代码级）

| # | 场景 | 结果 |
|---|------|------|
| 1 | 添加 DeepSeek V4 Pro → modelId='deepseek-v4-pro', displayName='DeepSeek V4 Pro' | ✅ |
| 2 | 激活模型后 TopBar 显示 "Model: deepseek-v4-pro" | ✅ 响应式 |
| 3 | 聊天发送 → body.model 为 'deepseek-v4-pro'（非展示名） | ✅ |
| 4 | 聊天页只显示一个主输入框（ChatPanel） | ✅ v-if 收口 |
| 5 | CommandBar 不再因误判未配置而跳设置页 | ✅ 响应式 chatConfigured |
| 6 | Settings / TopBar / ChatPanel 状态一致 | ✅ 同源 ref |
| 7 | 删除当前激活模型 → TopBar 显示 "未配置" → CommandBar 显示警告 | ✅ 响应式链 |

---

## 8. 剩余风险

| # | 风险 | 优先级 | 说明 |
|---|------|--------|------|
| 1 | 真实 API Key 验证 | P1 | 需用户持有有效 DeepSeek API Key 后实际发送请求验证 modelId 正确 |
| 2 | 其他 provider 预设 Model ID 未验证 | P2 | 仅验证了 DeepSeek，阿里云/OpenAI/火山引擎的 canonical ID 未经真实 API 测试 |
| 3 | CommandBar 在非 chat 视图仍使用 chatConfigured | P3 | 如果用户在 project 视图通过 CommandBar 发送消息会跳转到 chat 然后自动发送，逻辑正确但体验可优化 |

---

## 9. 下一步建议

1. **R29.3**：用户使用真实 DeepSeek API Key 端到端验证 deepseek-v4-pro 调用成功
2. **R30**：扩展校验其他 provider 的预设 model ID 真实性
3. **P3**：恢复 CommandBar 在 chat 视图的快捷入口（可选，作为 ChatPanel 输入的补充）
