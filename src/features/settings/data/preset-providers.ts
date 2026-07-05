/**
 * R22 / R28.2 / R29.2 — 预置服务商与模型数据
 *
 * 关键约定：
 * - `id`   = canonical API modelId（真实发给 API 的值）
 * - `label` = 用户可见展示名（仅用于 UI 渲染，永远不发给 API）
 *
 * 当前预置：
 *   1. DeepSeek（5 个）— R29.2 更新为 canonical v4 系列
 *   2. 阿里云 / Qwen（7 个）
 *   3. 小米 / MiLM（3 个）
 *   4. 火山引擎 / Doubao（6 个）
 *   5. OpenAI（5 个）
 *   6. Ollama 本地（5 个）
 *
 * 自定义模式不依赖此数据，由用户自行填写。
 */

import type { ProviderMeta } from '../types/model-config.types'

export const PRESET_PROVIDERS: ProviderMeta[] = [
  // ===== 1. DeepSeek =====
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🔵',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    apiFormat: 'openai-chat-completions',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    brandColor: '#4D6BFE',
    allowCustomModelId: true,
    models: [
      {
        id: 'deepseek-v4-pro',
        label: 'DeepSeek V4 Pro',
        providerId: 'deepseek',
        family: 'deepseek',
        contextWindowIn: 128000,
        contextWindowOut: 8192,
        supportsTools: true,
        supportsVision: false,
      },
      {
        id: 'deepseek-v4-flash',
        label: 'DeepSeek V4 Flash',
        providerId: 'deepseek',
        family: 'deepseek',
        contextWindowIn: 128000,
        contextWindowOut: 8192,
        supportsTools: true,
        supportsVision: false,
      },
      {
        id: 'deepseek-reasoner',
        label: 'DeepSeek R1（推理）',
        providerId: 'deepseek',
        family: 'deepseek',
        contextWindowIn: 128000,
        contextWindowOut: 8192,
        supportsTools: false,
        supportsVision: false,
      },
    ],
  },

  // ===== 2. 阿里云（Qwen） =====
  {
    id: 'alibaba',
    name: '阿里云',
    icon: '🟠',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    apiFormat: 'openai-chat-completions',
    apiKeyUrl: 'https://dashscope.console.aliyun.com/apiKey',
    brandColor: '#FF6A00',
    allowCustomModelId: true,
    models: [
      {
        id: 'qwen-plus',
        label: 'Qwen Plus',
        providerId: 'alibaba',
        family: 'qwen',
        contextWindowIn: 131072,
        contextWindowOut: 8192,
        supportsTools: true,
        supportsVision: false,
      },
      {
        id: 'qwen-max',
        label: 'Qwen Max',
        providerId: 'alibaba',
        family: 'qwen',
        contextWindowIn: 131072,
        contextWindowOut: 8192,
        supportsTools: true,
        supportsVision: false,
      },
      {
        id: 'qwen-turbo',
        label: 'Qwen Turbo',
        providerId: 'alibaba',
        family: 'qwen',
        contextWindowIn: 131072,
        contextWindowOut: 8192,
        supportsTools: true,
        supportsVision: false,
      },
      {
        id: 'qwen-coder-plus',
        label: 'Qwen Coder Plus',
        providerId: 'alibaba',
        family: 'qwen',
        contextWindowIn: 131072,
        contextWindowOut: 8192,
        supportsTools: true,
        supportsVision: false,
      },
      {
        id: 'qwen3-235b-a22b',
        label: 'Qwen3 235B',
        providerId: 'alibaba',
        family: 'qwen',
        contextWindowIn: 131072,
        contextWindowOut: 8192,
        supportsTools: true,
        supportsVision: true,
      },
      {
        id: 'qwen-vl-plus',
        label: 'Qwen VL Plus',
        providerId: 'alibaba',
        family: 'qwen',
        contextWindowIn: 32768,
        contextWindowOut: 4096,
        supportsTools: false,
        supportsVision: true,
      },
      {
        id: 'qwen-long',
        label: 'Qwen Long（百万 tokens）',
        providerId: 'alibaba',
        family: 'qwen',
        contextWindowIn: 10000000,
        contextWindowOut: 4096,
        supportsTools: false,
        supportsVision: false,
      },
    ],
  },

  // ===== 3. 小米（MiLM） =====
  {
    id: 'xiaomi',
    name: '小米',
    icon: '🟧',
    baseUrl: 'https://api.xiaomi.com/v1/chat/completions',
    apiFormat: 'openai-chat-completions',
    apiKeyUrl: 'https://dev.mi.com/ai',
    brandColor: '#FF6900',
    allowCustomModelId: true,
    models: [
      {
        id: 'milm-pro',
        label: 'MiLM Pro',
        providerId: 'xiaomi',
        family: 'milm',
        contextWindowIn: 32000,
        contextWindowOut: 4096,
        supportsTools: true,
        supportsVision: false,
      },
      {
        id: 'milm-lite',
        label: 'MiLM Lite',
        providerId: 'xiaomi',
        family: 'milm',
        contextWindowIn: 16000,
        contextWindowOut: 2048,
        supportsTools: false,
        supportsVision: false,
      },
      {
        id: 'milm-code',
        label: 'MiLM Code',
        providerId: 'xiaomi',
        family: 'milm',
        contextWindowIn: 32000,
        contextWindowOut: 8192,
        supportsTools: true,
        supportsVision: false,
      },
    ],
  },

  // ===== 4. 火山引擎（Doubao） =====
  {
    id: 'volcengine',
    name: '火山引擎',
    icon: '🔴',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    apiFormat: 'openai-chat-completions',
    apiKeyUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
    brandColor: '#0052D9',
    allowCustomModelId: true,
    models: [
      {
        id: 'doubao-pro-32k',
        label: '豆包 Pro 32K',
        providerId: 'volcengine',
        family: 'doubao',
        contextWindowIn: 32768,
        contextWindowOut: 4096,
        supportsTools: true,
        supportsVision: false,
      },
      {
        id: 'doubao-pro-128k',
        label: '豆包 Pro 128K',
        providerId: 'volcengine',
        family: 'doubao',
        contextWindowIn: 128000,
        contextWindowOut: 4096,
        supportsTools: true,
        supportsVision: false,
      },
      {
        id: 'doubao-lite-32k',
        label: '豆包 Lite 32K',
        providerId: 'volcengine',
        family: 'doubao',
        contextWindowIn: 32768,
        contextWindowOut: 4096,
        supportsTools: false,
        supportsVision: false,
      },
      {
        id: 'doubao-lite-128k',
        label: '豆包 Lite 128K',
        providerId: 'volcengine',
        family: 'doubao',
        contextWindowIn: 128000,
        contextWindowOut: 4096,
        supportsTools: false,
        supportsVision: false,
      },
      {
        id: 'doubao-vision',
        label: '豆包 Vision',
        providerId: 'volcengine',
        family: 'doubao',
        contextWindowIn: 32768,
        contextWindowOut: 4096,
        supportsTools: false,
        supportsVision: true,
      },
      {
        id: 'doubao-thinking',
        label: '豆包 Thinking',
        providerId: 'volcengine',
        family: 'doubao',
        contextWindowIn: 128000,
        contextWindowOut: 32768,
        supportsTools: false,
        supportsVision: false,
      },
    ],
  },

  // ===== 5. OpenAI =====
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🟢',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    apiFormat: 'openai-chat-completions',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    brandColor: '#10A37F',
    allowCustomModelId: true,
    models: [
      {
        id: 'gpt-4o',
        label: 'GPT-4o',
        providerId: 'openai',
        family: 'gpt',
        contextWindowIn: 128000,
        contextWindowOut: 16384,
        supportsTools: true,
        supportsVision: true,
      },
      {
        id: 'gpt-4o-mini',
        label: 'GPT-4o Mini',
        providerId: 'openai',
        family: 'gpt',
        contextWindowIn: 128000,
        contextWindowOut: 16384,
        supportsTools: true,
        supportsVision: true,
      },
      {
        id: 'gpt-4.1',
        label: 'GPT-4.1',
        providerId: 'openai',
        family: 'gpt',
        contextWindowIn: 1000000,
        contextWindowOut: 32768,
        supportsTools: true,
        supportsVision: true,
      },
      {
        id: 'o3-mini',
        label: 'o3 Mini',
        providerId: 'openai',
        family: 'openai-o',
        contextWindowIn: 200000,
        contextWindowOut: 100000,
        supportsTools: true,
        supportsVision: false,
      },
      {
        id: 'o1',
        label: 'o1',
        providerId: 'openai',
        family: 'openai-o',
        contextWindowIn: 200000,
        contextWindowOut: 100000,
        supportsTools: false,
        supportsVision: true,
      },
    ],
  },

  // ===== 6. Ollama（本地） =====
  {
    id: 'ollama',
    name: 'Ollama（本地）',
    icon: '🦙',
    baseUrl: 'http://localhost:11434/v1/chat/completions',
    apiFormat: 'openai-chat-completions',
    apiKeyUrl: 'https://ollama.com/download',
    brandColor: '#000',
    allowCustomModelId: true,
    models: [
      {
        id: 'llama3.1',
        label: 'Llama 3.1 8B',
        providerId: 'ollama',
        family: 'llama',
        contextWindowIn: 128000,
        contextWindowOut: 8192,
        supportsTools: true,
        supportsVision: false,
      },
      {
        id: 'qwen2.5:14b',
        label: 'Qwen 2.5 14B',
        providerId: 'ollama',
        family: 'qwen',
        contextWindowIn: 128000,
        contextWindowOut: 8192,
        supportsTools: true,
        supportsVision: false,
      },
      {
        id: 'deepseek-r1:8b',
        label: 'DeepSeek R1 8B',
        providerId: 'ollama',
        family: 'deepseek',
        contextWindowIn: 128000,
        contextWindowOut: 8192,
        supportsTools: true,
        supportsVision: false,
      },
      {
        id: 'mistral',
        label: 'Mistral 7B',
        providerId: 'ollama',
        family: 'mistral',
        contextWindowIn: 32768,
        contextWindowOut: 4096,
        supportsTools: true,
        supportsVision: false,
      },
      {
        id: 'codellama:13b',
        label: 'CodeLlama 13B',
        providerId: 'ollama',
        family: 'llama',
        contextWindowIn: 16384,
        contextWindowOut: 4096,
        supportsTools: false,
        supportsVision: false,
      },
    ],
  },
]

/** 按 ID 查找预置服务商 */
export function findPresetProvider(id: string): ProviderMeta | undefined {
  return PRESET_PROVIDERS.find((p) => p.id === id)
}

/** 按 providerId + modelId 查找预置模型 */
export function findPresetModel(providerId: string, modelId: string) {
  const provider = findPresetProvider(providerId)
  return provider?.models.find((m) => m.id === modelId)
}
