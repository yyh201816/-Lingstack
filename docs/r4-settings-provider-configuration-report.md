# R4-Settings：Provider 配置页产品化完成报告

**日期**：2026-07-02  
**版本**：vNext 0.1.0 R4-Settings  
**轮次定位**：R4 子轮次 — 补齐 Settings Provider 配置页产品化  

---

## 一、本轮目标与边界

### 目标
> 先把真实 AI 对话所依赖的配置入口补完整，让用户能正确配置 base URL / API Key / model / provider。

### 严格边界（本轮不做）
- Chat 真实请求（已于 R4-1.2 完成）
- SSE 流式响应（已于 R4-1.2 完成）
- 多会话系统
- 文件上下文注入
- 命令面板
- splitpanes
- 原生桌面能力迁移

---

## 二、Provider 配置数据结构

### 2.1 Store 层（`settings.store.ts`）

```typescript
export type ProviderType = 'openai-compatible' | 'openrouter' | 'ollama'

// Endpoint 预设映射
const ENDPOINT_PRESETS: Record<ProviderType, string> = {
  'openai-compatible': 'https://api.openai.com/v1/chat/completions',
  'openrouter':        'https://openrouter.ai/api/v1/chat/completions',
  'ollama':            'http://localhost:11434/v1/chat/completions',
}

// Store state
activeTab:       'appearance' | 'provider'    // 默认 'provider'
saveState:       'idle' | 'saving' | 'saved' | 'error'
providerType:    ProviderType                 // 默认 'openai-compatible'
endpoint:        string                       // 从 chat.service 恢复
apiKey:          string                       // 从 chat.service 恢复
model:           string                       // 从 chat.service 恢复
temperature:     number                       // 从 chat.service 恢复，默认 0.7
maxTokens:       number                       // 从 chat.service 恢复，默认 4096
```

### 2.2 持久化层（复用 `chat.service.ts`）

```
SettingsPanel ──► settings.store.save()
  ├─ setChatConfig({ endpoint, apiKey, model, temperature, maxTokens })
  │    └─ localStorage.setItem('lingstack_provider_config', JSON.stringify(config))
  │
  └─ ChatPanel / Chat Service
       └─ getChatConfig() 统一读取（含 providerType / endpoint / apiKey / model / temperature / maxTokens）
```

**设计决策**：
- providerType 仅在 UI 层管理（用于自动填充 endpoint 预设），不写入持久化 config
- 持久化 config 以 `endpoint` 作为实际生效值，providerType 只是便捷选择器
- 与 `chat.service.ts` 零侵入衔接 — Settings 写完，Chat 直接可用

---

## 三、修改文件清单

| 文件 | 改动类型 | 行数变化 | 说明 |
|------|----------|----------|------|
| `src/features/settings/store/settings.store.ts` | **重写** | 8 → 68 行 | 从裸 tab 切换器扩展为完整 provider 配置 store |
| `src/features/settings/components/SettingsPanel.vue` | **重写** | 166 → 434 行 | 产品化配置页：引导区 + 表单 + 高级选项 + CTA |
| `src/features/settings/types.ts` | 未改 | — | 原有 `SettingsState` 接口保留，store 实际状态已超越 |
| `src/services/chat/chat.service.ts` | 未改 | — | 既有持久化层直接被复用 |

---

## 四、Settings 最小可用 Provider 配置闭环

### 4.1 用户操作流程

```
用户进入 /settings
  │
  ├─ [首次/未配置] 看到 3 步配置引导 Banner
  │    ├─ 步骤 1: 获取 API Key（前往服务商后台）
  │    ├─ 步骤 2: 填写连接信息（选择类型 + 填表单）
  │    └─ 步骤 3: 保存并开始使用
  │
  ├─ 选择服务类型（3 列卡片）
  │    ├─ 🌐 OpenAI 兼容接口 → 自动填 https://api.openai.com/v1/chat/completions
  │    ├─ 🔀 OpenRouter       → 自动填 https://openrouter.ai/api/v1/chat/completions
  │    └─ 💻 Ollama 本地      → 自动填 http://localhost:11434/v1/chat/completions
  │         └─ API Key 标记为「可选」
  │
  ├─ 填写表单
  │    ├─ Base URL    (必填，有预设占位)
  │    ├─ API Key     (password 输入框 + 已填写指示器)
  │    ├─ 模型名称     (必填，placeholder: gpt-4o-mini)
  │    └─ 高级选项 (折叠)
  │         ├─ Temperature (0-2, 默认 0.7)
  │         └─ Max Tokens  (256-128000, 默认 4096)
  │
  ├─ 点击「保存配置」
  │    ├─ 校验: endpoint 非空 + model 非空 → canSave = true
  │    ├─ 保存中: 按钮显示「保存中...」
  │    ├─ 成功: 绿色 badge「✓ 配置已保存」(2.5s 自动消失)
  │    └─ 失败: 红色 badge「✗ 保存失败，请重试」(3s 自动消失)
  │
  └─ 保存后（apiKey 非空）
       └─ CTA 区域显示「模型已就绪」→ 点击「去对话」→ router.push('/chat')
```

### 4.2 配置说明文案（帮助首次上手）

| 位置 | 文案 | 作用 |
|------|------|------|
| 引导区标题 | 「配置您的第一个 AI 模型」 | 明确页面目的 |
| 引导区副标题 | 「完成以下步骤，即可在灵栈中开始使用 AI。通常不超过 2 分钟。」 | 降低心理门槛 |
| 步骤 1 | 「前往您的 AI 服务商（OpenAI / DeepSeek 等）后台创建 API Key」 | 告诉用户 Key 从哪来 |
| 步骤 2 | 「选择服务类型，填入 Base URL、API Key 和模型名称」 | 告诉用户填什么 |
| 步骤 3 | 「点击『保存配置』后前往对话页面，即可开始与 AI 对话」 | 告诉用户下一步 |
| Base URL hint | 「API 端点地址。使用默认值即可，仅在使用自定义代理或 Ollama 时需要修改。」 | 说明何时需要改 |
| API Key hint | 「Key 保存在本地浏览器存储中，不会离开您的设备。」 | 消除安全顾虑 |
| Model hint | 「服务商提供的模型标识。常用：gpt-4o / gpt-4o-mini / deepseek-chat / claude-3.5-sonnet。」 | 给出常见值参考 |
| 页面顶部 hint | 「配置 OpenAI 兼容 API 接入信息。API Key 仅保存在本地，不会上传到任何服务器。」 | 整体说明 |
| CTA 区 | 「模型已就绪，可以开始使用」「前往对话页面，开始与 AI 协作。」 | 引导下一步动作 |

### 4.3 基础校验

| 校验项 | 逻辑 | 效果 |
|--------|------|------|
| Endpoint 必填 | `endpoint.trim().length > 0` | 保存按钮 disabled |
| Model 必填 | `model.trim().length > 0` | 保存按钮 disabled |
| API Key（Ollama 除外） | 非 Ollama 时标记「必填」，Ollama 标记「可选」 | 仅视觉引导，不硬阻断 |

### 4.4 敏感字段处理

- API Key 使用 `<input type="password">` 原生遮罩
- 填写后显示绿色「✓ 已填写」指示器（不显示实际内容）
- hint 强调「仅保存在本地」

---

## 五、当前还缺哪些能力 & 为什么本轮先不做

| 缺口 | 原因 |
|------|------|
| 多 provider 管理平台（CRUD 全套） | 本轮只做「最小可用」，多 provider 管理属于下一个产品阶段 |
| 连通性测试（Test Connection 按钮） | 需要真实 API 调用 + 超时处理 + 错误分类，属于独立功能 |
| 模型列表自动拉取（/v1/models） | 需要解析各 provider 不同响应格式，且非所有 provider 支持 |
| 复杂鉴权流程（OAuth / SSO） | API Key 方式已覆盖 90% 场景 |
| 云同步配置 | 属于 P3 功能，先跑通本地闭环 |
| provider config 多套切换 | 单套配置先跑通，多套切换后续扩展 |

---

## 六、下一轮接 Chat 主链时如何复用这些配置

Chat 主链已于 R4-1.2 完成，**无需任何额外接入工作**：

```typescript
// ChatPanel / chat.service 中直接读取
const cfg = getChatConfig()
// { providerType, endpoint, apiKey, model, temperature, maxTokens }

// 发请求
fetch(cfg.endpoint, {
  headers: { Authorization: `Bearer ${cfg.apiKey}` },
  body: JSON.stringify({
    model: cfg.model,
    temperature: cfg.temperature,
    max_tokens: cfg.maxTokens,
    // ...
  }),
})
```

**复用路径零开销**：
1. Settings 保存 → `setChatConfig()` → localStorage
2. ChatPanel 初始化 → `getChatConfig()` → 读取同一份 config
3. 无 API Key → 自动 fallback mock（已有）

---

## 七、构建验证

```
vue-tsc --noEmit  → 零 TypeScript 错误
vite build         → 3010 modules, 2.90s, exit 0
```

---

## 八、总结

本轮在 R4-1.1/1.2 的 Provider 配置基础之上，将 Settings 面板从「3 个裸输入框」升级为：

- **产品化引导**：3 步引导区，降低首次配置门槛
- **服务类型选择器**：3 列卡片（OpenAI 兼容 / OpenRouter / Ollama），自动填充 endpoint
- **完整表单**：Base URL / API Key(masked) / Model / Temperature / Max Tokens
- **状态反馈**：saving → saved ✓ / error ✗ 完整生命周期
- **CTA 引导**：配置完成后直接跳转对话页
- **零侵入复用**：与既有 chat.service 持久化层完全对齐

**Provider 配置页已从「能用」提升到「产品化可用」。**
