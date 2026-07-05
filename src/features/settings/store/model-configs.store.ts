/**
 * R22 — 模型配置 Store
 *
 * 管理用户保存的所有模型配置 + 当前激活配置。
 * 持久化到 localStorage `lingstack_model_configs`。
 *
 * 当激活配置变更时，自动同步到 chat.service 的 ChatConfig，
 * 保证 ChatPanel 零改动即可消费新配置。
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserModelConfig, ModelConfigsState } from '../types/model-config.types'
import { findPresetProvider, findPresetModel } from '../data/preset-providers'
import { setChatConfig } from '@/services/chat/chat.service'

const LS_KEY = 'lingstack_model_configs'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function loadState(): ModelConfigsState {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ModelConfigsState
      if (Array.isArray(parsed.configs)) return parsed
    }
  } catch { /* ignore */ }
  return { configs: [], activeConfigId: null }
}

function saveState(state: ModelConfigsState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch { /* ignore */ }
}

export const useModelConfigsStore = defineStore('model-configs', () => {
  const state = loadState()
  const configs = ref<UserModelConfig[]>(state.configs)
  const activeConfigId = ref<string | null>(state.activeConfigId)

  // 初始化时同步激活配置到 chat.service
  if (activeConfigId.value) {
    const initCfg = configs.value.find((c) => c.id === activeConfigId.value)
    if (initCfg) {
      // 延迟同步，确保 chat.service 已初始化
      setTimeout(() => syncToChatService(initCfg), 0)
    }
  }

  /** 将激活配置同步到 chat.service（ChatPanel 零改动） */
  function syncToChatService(cfg: UserModelConfig) {
    setChatConfig({
      endpoint: cfg.baseUrl,
      apiKey: cfg.apiKey,
      model: cfg.modelId,
      temperature: 0.7,
      maxTokens: cfg.outputContextWindow || 4096,
    })
  }

  // ========== Getters ==========

  const activeConfig = computed(() =>
    configs.value.find((c) => c.id === activeConfigId.value) ?? null,
  )

  const configCount = computed(() => configs.value.length)

  /** 按服务商分组的配置 */
  const configsByProvider = computed(() => {
    const map = new Map<string, UserModelConfig[]>()
    for (const cfg of configs.value) {
      const list = map.get(cfg.providerId) ?? []
      list.push(cfg)
      map.set(cfg.providerId, list)
    }
    return map
  })

  // ========== Actions ==========

  function persist() {
    saveState({ configs: configs.value, activeConfigId: activeConfigId.value })
  }

  /** 添加模型配置 */
  function addConfig(input: Omit<UserModelConfig, 'id' | 'createdAt' | 'updatedAt'>): UserModelConfig {
    const now = new Date().toISOString()
    const cfg: UserModelConfig = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    configs.value.push(cfg)
    // 如果是第一个配置，自动激活
    if (configs.value.length === 1 || !activeConfigId.value) {
      setActiveConfig(cfg.id)
    }
    persist()
    return cfg
  }

  /** 更新模型配置 */
  function updateConfig(id: string, patch: Partial<UserModelConfig>) {
    const idx = configs.value.findIndex((c) => c.id === id)
    if (idx === -1) return
    configs.value[idx] = {
      ...configs.value[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    // 如果更新的是激活配置，同步到 chat.service
    if (id === activeConfigId.value) {
      syncToChatService(configs.value[idx])
    }
    persist()
  }

  /** 删除模型配置 */
  function removeConfig(id: string) {
    configs.value = configs.value.filter((c) => c.id !== id)
    if (activeConfigId.value === id) {
      activeConfigId.value = configs.value[0]?.id ?? null
      if (activeConfigId.value) {
        const cfg = configs.value.find((c) => c.id === activeConfigId.value)
        if (cfg) syncToChatService(cfg)
      }
    }
    persist()
  }

  /** 设置激活配置 */
  function setActiveConfig(id: string) {
    const cfg = configs.value.find((c) => c.id === id)
    if (!cfg) return
    activeConfigId.value = id
    syncToChatService(cfg)
    persist()
  }

  /** 从预置服务商 + 模型快速创建配置 */
  function addFromPreset(
    providerId: string,
    modelId: string,
    apiKey: string,
    displayName?: string,
    overrides?: Partial<UserModelConfig>,
  ) {
    const provider = findPresetProvider(providerId)
    const model = findPresetModel(providerId, modelId)
    if (!provider || !model) return null

    return addConfig({
      providerId,
      modelId,
      displayName: displayName || model.label,
      apiKey,
      baseUrl: provider.baseUrl,
      apiFormat: provider.apiFormat,
      modelFamily: model.family,
      inputContextWindow: model.contextWindowIn,
      outputContextWindow: model.contextWindowOut,
      toolCallBudget: model.supportsTools ? 10 : 0,
      multimodalEnabled: model.supportsVision,
      enabled: true,
      ...overrides,
    })
  }

  /** R28.1: 从预置服务商 + 手动 modelId 创建配置（使用厂商默认元数据） */
  function addFromProviderModel(
    providerId: string,
    modelId: string,
    apiKey: string,
    displayName?: string,
    overrides?: Partial<UserModelConfig>,
  ) {
    const provider = findPresetProvider(providerId)
    if (!provider) return null

    // R28.2: 使用 provider 默认配置，不依赖 models[0]（用户手动输入 modelId 时 models[0] 不代表实际模型）
    const defaultModel = provider.models[0]
    return addConfig({
      providerId,
      modelId,
      displayName: displayName || modelId,
      apiKey,
      baseUrl: provider.baseUrl,
      apiFormat: provider.apiFormat,
      modelFamily: defaultModel?.family ?? 'custom',
      inputContextWindow: defaultModel?.contextWindowIn ?? 128000,
      outputContextWindow: defaultModel?.contextWindowOut ?? 8192,
      toolCallBudget: defaultModel?.supportsTools ? 10 : 0,
      multimodalEnabled: defaultModel?.supportsVision ?? false,
      enabled: true,
      ...overrides,
    })
  }

  /** 自定义模式添加配置 */
  function addCustom(
    apiFormat: 'openai-chat-completions' | 'anthropic-messages',
    baseUrl: string,
    modelId: string,
    apiKey: string,
    displayName?: string,
    overrides?: Partial<UserModelConfig>,
  ) {
    return addConfig({
      providerId: 'custom',
      modelId,
      displayName: displayName || modelId,
      apiKey,
      baseUrl,
      apiFormat,
      modelFamily: 'custom',
      inputContextWindow: 128000,
      outputContextWindow: 4096,
      toolCallBudget: 0,
      multimodalEnabled: false,
      enabled: true,
      ...overrides,
    })
  }

  /** 检查是否已配置 */
  function isConfigured(): boolean {
    return configs.value.length > 0 && activeConfigId.value !== null
  }

  return {
    configs,
    activeConfigId,
    activeConfig,
    configCount,
    configsByProvider,
    addConfig,
    updateConfig,
    removeConfig,
    setActiveConfig,
    addFromPreset,
    addFromProviderModel,
    addCustom,
    isConfigured,
    syncToChatService,
  }
})
