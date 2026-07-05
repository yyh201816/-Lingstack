import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getChatConfig, setChatConfig, type ChatConfig } from '@/services/chat/chat.service'

export type ProviderType = 'openai-compatible' | 'openrouter' | 'ollama'

const ENDPOINT_PRESETS: Record<ProviderType, string> = {
  'openai-compatible': 'https://api.openai.com/v1/chat/completions',
  'openrouter': 'https://openrouter.ai/api/v1/chat/completions',
  'ollama': 'http://localhost:11434/v1/chat/completions',
}

export const useSettingsStore = defineStore('settings', () => {
  const activeTab = ref<'appearance' | 'provider' | 'update' | 'learning' | 'integrations' | 'skills' | 'beta' | 'bootstrap'>('provider')
  const saveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // 从 chat.service 恢复配置
  const cfg = getChatConfig()
  const providerType = ref<ProviderType>('openai-compatible')
  const endpoint = ref(cfg.endpoint)
  const apiKey = ref(cfg.apiKey)
  const model = ref(cfg.model)
  const temperature = ref(cfg.temperature)
  const maxTokens = ref(cfg.maxTokens)

  const endpointPreset = computed(() => ENDPOINT_PRESETS[providerType.value])

  /** 选择 Provider 类型时自动填充推荐 Endpoint */
  function selectProviderType(type: ProviderType) {
    providerType.value = type
    // 仅当当前 Endpoint 为空或属于旧预设时才自动填充
    const current = endpoint.value.trim()
    const isPreset = Object.values(ENDPOINT_PRESETS).some((p) => current === p)
    if (!current || isPreset) {
      endpoint.value = ENDPOINT_PRESETS[type]
    }
  }

  /** 保存到 chat.service（自动同步 localStorage） */
  function save() {
    saveState.value = 'saving'
    try {
      setChatConfig({
        endpoint: endpoint.value.trim() || ENDPOINT_PRESETS[providerType.value],
        apiKey: apiKey.value.trim(),
        model: model.value.trim() || 'gpt-4o-mini',
        temperature: temperature.value,
        maxTokens: maxTokens.value,
      })
      saveState.value = 'saved'
      setTimeout(() => { if (saveState.value === 'saved') saveState.value = 'idle' }, 2500)
    } catch {
      saveState.value = 'error'
      setTimeout(() => { saveState.value = 'idle' }, 3000)
    }
  }

  function setActiveTab(tab: 'appearance' | 'provider' | 'update' | 'learning' | 'integrations' | 'skills' | 'beta' | 'bootstrap') {
    activeTab.value = tab
  }

  return {
    activeTab, saveState,
    providerType, endpoint, apiKey, model, temperature, maxTokens,
    endpointPreset,
    selectProviderType, save, setActiveTab,
  }
})
