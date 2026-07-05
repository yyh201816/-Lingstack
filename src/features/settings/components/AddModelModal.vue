<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { PRESET_PROVIDERS } from '../data/preset-providers'
import { useModelConfigsStore } from '../store/model-configs.store'
import type { ApiFormat, UserModelConfig } from '../types/model-config.types'
import { X, Plus, ChevronDown, ChevronUp, Globe, Key, Tag, Settings, Zap, Link, Pencil, Save } from 'lucide-vue-next'

const emit = defineEmits<{ close: []; added: []; saved: [] }>()
const props = defineProps<{ editConfig?: UserModelConfig | null }>()
const mcStore = useModelConfigsStore()

const isEditing = computed(() => !!props.editConfig)

// R28.1: 特殊值，表示用户选择"使用其他模型"
const CUSTOM_MODEL_SENTINEL = '__custom_model__'

// ========== Tab State ==========
type ModeTab = 'provider' | 'custom'
const activeTab = ref<ModeTab>('provider')

// ========== Provider Mode State ==========
const selectedProviderId = ref<string>('')
const selectedModelId = ref<string>('')
const providerApiKey = ref('')
const providerDisplayName = ref('')
const providerCustomModelId = ref('') // R28.1: 手动输入的 modelId

// ========== Custom Mode State ==========
const customApiFormat = ref<ApiFormat>('openai-chat-completions')
const customBaseUrl = ref('')
const customModelId = ref('')
const customApiKey = ref('')
const customDisplayName = ref('')

// ========== Advanced (shared) ==========
const showAdvanced = ref(false)
const advFamily = ref('')
const advContextIn = ref(0)
const advContextOut = ref(0)
const advToolBudget = ref(0)

// ========== Computed ==========
const selectedProvider = computed(() =>
  PRESET_PROVIDERS.find((p) => p.id === selectedProviderId.value),
)

// ========== Edit Mode Initialization ==========
function initFromEditConfig() {
  if (!props.editConfig) return
  const ec = props.editConfig

  if (ec.providerId === 'custom') {
    activeTab.value = 'custom'
    customApiFormat.value = ec.apiFormat
    customBaseUrl.value = ec.baseUrl
    customModelId.value = ec.modelId
    customApiKey.value = ec.apiKey
    customDisplayName.value = ec.displayName
  } else {
    activeTab.value = 'provider'
    selectedProviderId.value = ec.providerId
    // 尝试匹配预置模型
    const provider = PRESET_PROVIDERS.find((p) => p.id === ec.providerId)
    const modelMatch = provider?.models.find((m) => m.id === ec.modelId)
    if (modelMatch) {
      selectedModelId.value = ec.modelId
    } else {
      // 自定义模型 ID
      selectedModelId.value = CUSTOM_MODEL_SENTINEL
      providerCustomModelId.value = ec.modelId
    }
    providerApiKey.value = ec.apiKey
    providerDisplayName.value = ec.displayName
  }

  // 高级字段
  advFamily.value = ec.modelFamily
  advContextIn.value = ec.inputContextWindow
  advContextOut.value = ec.outputContextWindow
  advToolBudget.value = ec.toolCallBudget
}

onMounted(() => {
  initFromEditConfig()
})

const availableModels = computed(() => selectedProvider.value?.models ?? [])

const selectedModel = computed(() =>
  availableModels.value.find((m) => m.id === selectedModelId.value),
)

/** R28.1: 是否选中了"使用其他模型" */
const isUsingCustomModelId = computed(() =>
  selectedModelId.value === CUSTOM_MODEL_SENTINEL,
)

/** R28.1: 当前 provider 是否支持自定义 modelId */
const providerAllowsCustomModel = computed(() =>
  selectedProvider.value?.allowCustomModelId ?? true,
)

const canSubmitProvider = computed(() => {
  if (!selectedProviderId.value) return false
  if (isUsingCustomModelId.value) {
    return providerCustomModelId.value.trim().length > 0 && providerApiKey.value.trim().length > 0
  }
  return selectedModelId.value && providerApiKey.value.trim().length > 0
})

const canSubmitCustom = computed(() =>
  customBaseUrl.value.trim().length > 0 && customModelId.value.trim().length > 0 && customApiKey.value.trim().length > 0,
)

// ========== Watchers ==========

// 选择服务商时重置模型选择
watch(selectedProviderId, () => {
  selectedModelId.value = ''
  providerCustomModelId.value = ''
  providerDisplayName.value = ''
  // 填充高级字段
  advFamily.value = ''
  advContextIn.value = 0
  advContextOut.value = 0
  advToolBudget.value = 0
})

// 选择模型时填充显示名和高级字段
watch(selectedModelId, (id) => {
  if (id === CUSTOM_MODEL_SENTINEL) {
    // "使用其他模型"：由用户自行填写，不清空已有值
    return
  }
  providerCustomModelId.value = ''
  const model = selectedModel.value
  if (model) {
    providerDisplayName.value = model.label
    advFamily.value = model.family
    advContextIn.value = model.contextWindowIn
    advContextOut.value = model.contextWindowOut
    advToolBudget.value = model.supportsTools ? 10 : 0
  }
})

// ========== Handlers ==========

function handleSubmitProvider() {
  if (!canSubmitProvider.value) return

  if (isUsingCustomModelId.value) {
    // R28.1: 使用厂商默认元数据 + 用户手动 modelId
    mcStore.addFromProviderModel(
      selectedProviderId.value,
      providerCustomModelId.value.trim(),
      providerApiKey.value.trim(),
      providerDisplayName.value.trim() || undefined,
      {
        modelFamily: advFamily.value || undefined,
        inputContextWindow: advContextIn.value || undefined,
        outputContextWindow: advContextOut.value || undefined,
        toolCallBudget: advToolBudget.value,
      } as any,
    )
  } else {
    mcStore.addFromPreset(
      selectedProviderId.value,
      selectedModelId.value,
      providerApiKey.value.trim(),
      providerDisplayName.value.trim() || undefined,
      {
        modelFamily: advFamily.value || undefined,
        inputContextWindow: advContextIn.value || undefined,
        outputContextWindow: advContextOut.value || undefined,
        toolCallBudget: advToolBudget.value,
      } as any,
    )
  }
  emit('added')
  emit('close')
}

function handleSubmitCustom() {
  if (!canSubmitCustom.value) return
  mcStore.addCustom(
    customApiFormat.value,
    customBaseUrl.value.trim(),
    customModelId.value.trim(),
    customApiKey.value.trim(),
    customDisplayName.value.trim() || undefined,
    {
      modelFamily: advFamily.value || undefined,
      inputContextWindow: advContextIn.value || undefined,
      outputContextWindow: advContextOut.value || undefined,
      toolCallBudget: advToolBudget.value,
    } as any,
  )
  emit('added')
  emit('close')
}

/** R30.2: 编辑模式 — 更新现有配置 */
function handleSubmitEdit() {
  if (!props.editConfig) return

  const id = props.editConfig.id
  const patch: Partial<UserModelConfig> = {}

  if (activeTab.value === 'provider') {
    if (isUsingCustomModelId.value) {
      patch.modelId = providerCustomModelId.value.trim()
    } else {
      patch.modelId = selectedModelId.value
    }
    patch.apiKey = providerApiKey.value.trim()
    patch.displayName = providerDisplayName.value.trim() || patch.modelId || props.editConfig.displayName
  } else {
    patch.apiFormat = customApiFormat.value
    patch.baseUrl = customBaseUrl.value.trim()
    patch.modelId = customModelId.value.trim()
    patch.apiKey = customApiKey.value.trim()
    patch.displayName = customDisplayName.value.trim() || patch.modelId || props.editConfig.displayName
  }

  // 高级字段
  patch.modelFamily = advFamily.value || undefined
  patch.inputContextWindow = advContextIn.value || undefined
  patch.outputContextWindow = advContextOut.value || undefined
  patch.toolCallBudget = advToolBudget.value

  mcStore.updateConfig(id, patch)
  emit('saved')
  emit('close')
}

function handleOverlayClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
    emit('close')
  }
}
</script>

<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal">
      <!-- Header -->
      <div class="modal__header">
        <h2 class="modal__title">{{ isEditing ? '编辑模型' : '添加模型' }}</h2>
        <button class="modal__close" @click="emit('close')">
          <X :size="16" />
        </button>
      </div>

      <!-- Tabs (hidden in edit mode — locked to pre-filled tab) -->
      <div v-if="!isEditing" class="modal__tabs">
        <button
          :class="['modal__tab', { active: activeTab === 'provider' }]"
          @click="activeTab = 'provider'"
        >
          <Zap :size="13" /> 模型服务商
        </button>
        <button
          :class="['modal__tab', { active: activeTab === 'custom' }]"
          @click="activeTab = 'custom'"
        >
          <Settings :size="13" /> 自定义配置
        </button>
      </div>

      <!-- Body -->
      <div class="modal__body">
        <!-- ===== Provider Mode ===== -->
        <div v-if="activeTab === 'provider'" class="modal__form">
          <!-- 服务商选择 -->
          <div class="field">
            <label class="field__label">服务商</label>
            <div class="provider-grid">
              <button
                v-for="p in PRESET_PROVIDERS"
                :key="p.id"
                :class="['provider-card', { active: selectedProviderId === p.id }]"
                @click="selectedProviderId = p.id"
              >
                <span class="provider-card__icon">{{ p.icon }}</span>
                <span class="provider-card__name">{{ p.name }}</span>
              </button>
            </div>
          </div>

          <!-- 模型选择（联动） -->
          <div v-if="selectedProviderId" class="field">
            <label class="field__label">模型</label>
            <select v-model="selectedModelId" class="field__select">
              <option value="" disabled>请选择模型</option>
              <option
                v-for="m in availableModels"
                :key="m.id"
                :value="m.id"
              >
                {{ m.label }}{{ m.supportsTools ? ' · 工具调用' : '' }}{{ m.supportsVision ? ' · 多模态' : '' }}
              </option>
              <!-- R28.1: "使用其他模型"入口 -->
              <option
                v-if="providerAllowsCustomModel"
                disabled class="field__opt-sep"
              >
                ──────────────
              </option>
              <option
                v-if="providerAllowsCustomModel"
                :value="CUSTOM_MODEL_SENTINEL"
              >
                使用其他模型...
              </option>
            </select>
          </div>

          <!-- R28.1: 手动输入 modelId（选中"使用其他模型"时显示） -->
          <div v-if="isUsingCustomModelId" class="field">
            <label class="field__label">
              <Tag :size="12" /> 模型 ID
              <span class="field__required">必填</span>
            </label>
            <input
              v-model="providerCustomModelId"
              class="field__input"
              type="text"
              :placeholder="'输入 ' + (selectedProvider?.name ?? '') + ' 的模型 ID'"
            />
            <span class="field__hint">
              将使用 {{ selectedProvider?.name }} 的 API 地址与协议
            </span>
          </div>

          <!-- R28.1: 显示名称（在自定义 modelId 时提升到主表单） -->
          <div v-if="isUsingCustomModelId" class="field">
            <label class="field__label">
              <Pencil :size="12" /> 显示名称
            </label>
            <input
              v-model="providerDisplayName"
              class="field__input"
              type="text"
              placeholder="可选，默认使用模型 ID"
            />
          </div>

          <!-- API Key -->
          <div v-if="selectedProviderId" class="field">
            <label class="field__label">
              <Key :size="12" /> API 密钥
              <span class="field__required">必填</span>
            </label>
            <input
              v-model="providerApiKey"
              class="field__input"
              type="password"
              placeholder="sk-..."
            />
            <a
              v-if="selectedProvider?.apiKeyUrl"
              :href="selectedProvider.apiKeyUrl"
              target="_blank"
              class="field__link"
            >
              <Link :size="10" /> 获取 API Key
            </a>
          </div>

          <!-- 提交按钮 -->
          <button
            class="modal__submit"
            :disabled="!canSubmitProvider"
            @click="isEditing ? handleSubmitEdit() : handleSubmitProvider()"
          >
            <Save v-if="isEditing" :size="14" />
            <Plus v-else :size="14" />
            {{ isEditing ? '保存' : '添加模型' }}
          </button>
        </div>

        <!-- ===== Custom Mode ===== -->
        <div v-if="activeTab === 'custom'" class="modal__form">
          <!-- API 格式 -->
          <div class="field">
            <label class="field__label">API 格式</label>
            <div class="format-selector">
              <button
                :class="['format-option', { active: customApiFormat === 'openai-chat-completions' }]"
                @click="customApiFormat = 'openai-chat-completions'"
              >
                OpenAI Chat Completions
              </button>
              <button
                :class="['format-option', { active: customApiFormat === 'anthropic-messages' }]"
                @click="customApiFormat = 'anthropic-messages'"
              >
                Anthropic Messages
              </button>
            </div>
          </div>

          <!-- 请求地址 -->
          <div class="field">
            <label class="field__label">
              <Globe :size="12" /> 请求地址
              <span class="field__required">必填</span>
            </label>
            <input
              v-model="customBaseUrl"
              class="field__input"
              type="text"
              :placeholder="customApiFormat === 'openai-chat-completions'
                ? 'https://api.example.com/v1/chat/completions'
                : 'https://api.anthropic.com/v1/messages'"
            />
          </div>

          <!-- 模型 ID -->
          <div class="field">
            <label class="field__label">
              <Tag :size="12" /> 模型 ID
              <span class="field__required">必填</span>
            </label>
            <input
              v-model="customModelId"
              class="field__input"
              type="text"
              placeholder="my-custom-model"
            />
          </div>

          <!-- API Key -->
          <div class="field">
            <label class="field__label">
              <Key :size="12" /> API 密钥
            </label>
            <input
              v-model="customApiKey"
              class="field__input"
              type="password"
              placeholder="sk-..."
            />
          </div>

          <!-- 提交按钮 -->
          <button
            class="modal__submit"
            :disabled="!canSubmitCustom"
            @click="isEditing ? handleSubmitEdit() : handleSubmitCustom()"
          >
            <Save v-if="isEditing" :size="14" />
            <Plus v-else :size="14" />
            {{ isEditing ? '保存' : '添加模型' }}
          </button>
        </div>

        <!-- ===== Advanced (shared) ===== -->
        <details class="advanced" :open="showAdvanced" @toggle="showAdvanced = ($event.target as HTMLDetailsElement).open">
          <summary class="advanced__summary">
            <Settings :size="12" /> 高级配置
            <component :is="showAdvanced ? ChevronUp : ChevronDown" :size="12" />
          </summary>
          <div class="advanced__body">
            <div class="field">
              <label class="field__label">显示名称</label>
              <input
                v-if="activeTab === 'provider'"
                v-model="providerDisplayName"
                class="field__input"
                type="text"
                placeholder="自定义显示名称"
              />
              <input
                v-else
                v-model="customDisplayName"
                class="field__input"
                type="text"
                placeholder="自定义显示名称"
              />
            </div>
            <div class="field">
              <label class="field__label">模型系列</label>
              <input v-model="advFamily" class="field__input" type="text" placeholder="例如 qwen / deepseek / gpt" />
            </div>
            <div class="field-row">
              <div class="field">
                <label class="field__label">输入上下文窗口</label>
                <input v-model.number="advContextIn" class="field__input" type="number" placeholder="128000" />
              </div>
              <div class="field">
                <label class="field__label">输出上下文窗口</label>
                <input v-model.number="advContextOut" class="field__input" type="number" placeholder="4096" />
              </div>
            </div>
            <div class="field">
              <label class="field__label">工具调用轮次</label>
              <input v-model.number="advToolBudget" class="field__input" type="number" placeholder="0" />
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ---- Overlay ---- */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  display: flex; align-items: center; justify-content: center;
  animation: fadeIn .15s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* ---- Modal ---- */
.modal {
  width: 520px; max-height: 80vh;
  background: var(--ls-bg-elevated);
  border: 1px solid var(--ls-border-soft);
  border-radius: 12px;
  display: flex; flex-direction: column;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
  animation: slideUp .2s ease;
}
@keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

/* ---- Header ---- */
.modal__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--ls-divider);
}
.modal__title { font-size: 15px; font-weight: 600; color: var(--ls-text-primary); }
.modal__close {
  width: 28px; height: 28px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; color: var(--ls-text-muted); cursor: pointer;
  transition: background .12s;
}
.modal__close:hover { background: var(--ls-bg-panel-hover); color: var(--ls-text-primary); }

/* ---- Tabs ---- */
.modal__tabs {
  display: flex; gap: 0; padding: 8px 20px 0;
  border-bottom: 1px solid var(--ls-divider);
}
.modal__tab {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 6px 6px 0 0;
  font-size: 12px; font-weight: 500; color: var(--ls-text-muted);
  background: transparent; border: none; border-bottom: 2px solid transparent;
  cursor: pointer; transition: all .12s;
}
.modal__tab:hover { color: var(--ls-text-secondary); background: var(--ls-bg-panel-hover); }
.modal__tab.active {
  color: var(--ls-accent); border-bottom-color: var(--ls-accent);
  background: var(--ls-bg-surface);
}

/* ---- Body ---- */
.modal__body {
  flex: 1; overflow-y: auto;
  padding: 20px;
}

/* ---- Form ---- */
.modal__form { display: flex; flex-direction: column; gap: 16px; }

/* ---- Field ---- */
.field { display: flex; flex-direction: column; gap: 5px; }
.field__label {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 500; color: var(--ls-text-secondary);
}
.field__required {
  font-size: 10px; padding: 1px 5px; border-radius: 3px;
  background: var(--ls-danger-soft, rgba(224,85,106,.1)); color: var(--ls-danger, #e0556a);
  font-weight: 500;
}
.field__input {
  height: 34px; padding: 0 12px;
  background: var(--ls-bg-surface); color: var(--ls-text-primary);
  border: 1px solid var(--ls-border-default); border-radius: 6px;
  font-family: var(--ls-font-mono); font-size: 12px; outline: none;
  transition: border-color .12s, box-shadow .12s;
}
.field__input::placeholder { color: var(--ls-text-subtle); }
.field__input:focus { border-color: var(--ls-accent); box-shadow: 0 0 0 3px var(--ls-accent-soft); }
.field__select {
  height: 34px; padding: 0 12px;
  background: var(--ls-bg-surface); color: var(--ls-text-primary);
  border: 1px solid var(--ls-border-default); border-radius: 6px;
  font-size: 12px; outline: none; cursor: pointer;
  transition: border-color .12s;
}
.field__select:focus { border-color: var(--ls-accent); }
.field__select option.field__opt-sep { color: var(--ls-text-subtle); cursor: default; }
.field__hint {
  font-size: 10px; color: var(--ls-text-hint);
  margin-top: -2px;
}
.field__link {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; color: var(--ls-accent); text-decoration: none;
  transition: opacity .12s;
}
.field__link:hover { opacity: .8; }
.field-row { display: flex; gap: 12px; }
.field-row .field { flex: 1; }

/* ---- Provider Grid ---- */
.provider-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
}
.provider-card {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 12px 8px; border-radius: 8px;
  border: 1px solid var(--ls-border-soft);
  background: var(--ls-bg-surface); cursor: pointer;
  transition: all .12s;
}
.provider-card:hover { border-color: var(--ls-border-default); background: var(--ls-bg-panel-hover); }
.provider-card.active { border-color: var(--ls-accent); background: var(--ls-accent-soft); }
.provider-card__icon { font-size: 20px; }
.provider-card__name { font-size: 11px; font-weight: 500; color: var(--ls-text-secondary); }
.provider-card.active .provider-card__name { color: var(--ls-accent); }

/* ---- Format Selector ---- */
.format-selector { display: flex; gap: 8px; }
.format-option {
  flex: 1; padding: 8px 12px; border-radius: 6px;
  border: 1px solid var(--ls-border-soft);
  background: var(--ls-bg-surface); color: var(--ls-text-secondary);
  font-size: 11px; font-weight: 500; cursor: pointer;
  text-align: center; transition: all .12s;
}
.format-option:hover { border-color: var(--ls-border-default); }
.format-option.active { border-color: var(--ls-accent); background: var(--ls-accent-soft); color: var(--ls-accent); }

/* ---- Advanced ---- */
.advanced { margin-top: 4px; }
.advanced__summary {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: var(--ls-text-subtle); cursor: pointer;
  padding: 6px 0; user-select: none; list-style: none;
}
.advanced__summary::-webkit-details-marker { display: none; }
.advanced__summary:hover { color: var(--ls-text-muted); }
.advanced__body {
  display: flex; flex-direction: column; gap: 12px;
  padding: 12px 0 0;
}

/* ---- Submit ---- */
.modal__submit {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; height: 38px; border-radius: 8px;
  background: var(--ls-accent); color: #fff;
  font-size: 13px; font-weight: 500;
  border: none; cursor: pointer;
  transition: background .12s, opacity .12s;
}
.modal__submit:hover:not(:disabled) { background: var(--ls-accent-hover); }
.modal__submit:disabled { opacity: .4; cursor: not-allowed; }
</style>
