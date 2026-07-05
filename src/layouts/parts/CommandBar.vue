<!-- Legacy shell part: superseded by src/layouts/codex-shell/parts/MainTaskWorkspace.vue. -->
<script setup lang="ts">
/**
 * CommandBar — LingStack 底部主控制器
 *
 * 设计目标：不是普通输入框，而是 AI 工作台的主操作入口
 * Codex 克制 + Uiverse 轻量反馈
 *
 * DOM 结构：
 *   section.ls-command-bar
 *   ├─ .ls-command-bar__inner (主容器)
 *   │    ├─ .ls-command-bar__modes → 模式切换组 (role="tablist")
 *   │    │    └─ button.ls-command-bar__mode × 3
 *   │    ├─ .ls-command-bar__input-wrap
 *   │    │    └─ textarea.ls-command-bar__input
 *   │    └─ .ls-command-bar__actions
 *   │         └─ button.ls-command-bar__send
 *   ├─ .ls-command-bar__status (状态提示行)
 *   └─ .ls-command-bar__footer (快捷键)
 */
import { ref, computed } from 'vue'
import { ArrowUp, Brain, MessageSquare, Code, Loader2, Settings } from 'lucide-vue-next'
import { chatConfigured } from '@/services/chat/chat.service'
import { useNavigationStore } from '@/features/navigation/store/navigation.store'

type CmdMode = 'agent' | 'chat' | 'code'

const props = defineProps<{
  isSending?: boolean
}>()

const emit = defineEmits<{
  send: [text: string]
}>()

const nav = useNavigationStore()
const inputText = ref('')
const isFocused = ref(false)
const currentMode = ref<CmdMode>('agent')

const modes: { id: CmdMode; label: string; icon: any }[] = [
  { id: 'agent', label: 'Agent', icon: Brain },
  { id: 'chat',  label: 'Chat',  icon: MessageSquare },
  { id: 'code',  label: 'Code',  icon: Code },
]

/** 三方模式提示随模式联动 */
const placeholderText = computed(() => {
  switch (currentMode.value) {
    case 'agent':
      return '描述你的目标，例如：重构设置页、分析当前项目结构、生成下一步方案'
    case 'chat':
      return '输入你想讨论的问题、想法或需求'
    case 'code':
      return '输入代码修改意图，例如：为设置页补充表单校验并优化布局'
  }
})

/** 是否已配置 provider（R29.2: 改用响应式 chatConfigured） */
const hasProvider = chatConfigured

/** 是否可发送 */
const canSend = computed(() => {
  return inputText.value.trim().length > 0 && hasProvider.value && !props.isSending
})

/** 当前状态提示 */
const statusMessage = computed<{ text: string; type: 'hint' | 'warning' | 'loading' } | null>(() => {
  if (props.isSending) return { text: '正在处理请求...', type: 'loading' }
  if (!hasProvider.value) return { text: '未配置模型服务 → 前往设置', type: 'warning' }
  if (inputText.value.trim()) return null
  return { text: '输入指令后 Enter 发送 · Shift+Enter 换行', type: 'hint' }
})

/** 跳转到设置页 */
function goToSettings() {
  nav.setView('settings')
}

function handleSend() {
  const text = inputText.value.trim()
  if (!canSend.value) {
    // 静默失败保护
    if (!hasProvider.value) {
      goToSettings()
    }
    return
  }
  emit('send', text)
  inputText.value = ''
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <section
    class="ls-command-bar"
    :class="{
      'has-input': !!inputText.trim(),
      'is-focused': isFocused,
      'is-sending': isSending,
      'no-provider': !hasProvider,
    }"
  >
    <!-- ====== 输入主容器 ====== -->
    <div class="ls-command-bar__inner">
      <!-- 左：模式切换 -->
      <div class="ls-command-bar__modes" role="tablist" aria-label="Command modes">
        <button
          v-for="m in modes" :key="m.id"
          class="ls-command-bar__mode"
          :class="{ 'is-active': currentMode === m.id }"
          role="tab"
          :aria-selected="currentMode === m.id"
          @click="currentMode = m.id"
        >
          <component :is="m.icon" :size="13" />
          <span>{{ m.label }}</span>
        </button>
      </div>

      <!-- 中：输入区 -->
      <div class="ls-command-bar__input-wrap">
        <textarea
          v-model="inputText"
          class="ls-command-bar__input"
          :placeholder="placeholderText"
          rows="1"
          :disabled="isSending"
          @focus="isFocused = true"
          @blur="isFocused = false"
          @keydown="handleKeydown"
        />
      </div>

      <!-- 右：发送 / loading -->
      <div class="ls-command-bar__actions">
        <template v-if="isSending">
          <div class="ls-command-bar__sending-indicator">
            <Loader2 :size="16" class="ls-command-bar__spinner" />
          </div>
        </template>
        <template v-else>
          <button
            class="ls-command-bar__send"
            :class="{ 'is-enabled': canSend }"
            :disabled="!canSend"
            aria-label="发送指令"
            :title="!hasProvider ? '未配置模型服务' : canSend ? '发送 (Enter)' : ''"
            @click="handleSend"
          >
            <ArrowUp :size="18" />
          </button>
        </template>
      </div>
    </div>

    <!-- ====== 状态提示行 ====== -->
    <div
      v-if="statusMessage"
      class="ls-command-bar__status"
      :class="`ls-command-bar__status--${statusMessage.type}`"
      @click="statusMessage.type === 'warning' ? goToSettings() : undefined"
    >
      <!-- warning 时加设置图标 -->
      <Settings v-if="statusMessage.type === 'warning'" :size="11" class="ls-command-bar__status-icon" />
      <Loader2 v-if="statusMessage.type === 'loading'" :size="11" class="ls-command-bar__spinner ls-command-bar__spinner--inline" />
      <span>{{ statusMessage.text }}</span>
    </div>

    <!-- ====== 快捷键提示 ====== -->
    <div v-if="!statusMessage || statusMessage.type === 'hint'" class="ls-command-bar__footer">
      <span class="ls-command-bar__hint"><kbd>Enter</kbd> 发送</span>
      <span class="ls-command-bar__hint"><kbd>Shift</kbd> + <kbd>Enter</kbd> 换行</span>
      <span class="ls-command-bar__hint"><kbd>Ctrl</kbd> + <kbd>K</kbd> 命令面板</span>
    </div>
  </section>
</template>

<style scoped>
/* ====== 1. root ====== */
.ls-command-bar {
  display: flex; flex-direction: column; align-items: center;
  padding: 0 32px 18px;
  position: relative; z-index: 40;
}
.ls-command-bar.is-sending {
  /* sending 态保持主体可见 */
}

/* ====== 2. major blocks ====== */
.ls-command-bar__inner {
  display: flex; align-items: center; gap: 8px;
  width: min(820px, calc(100vw - 120px));
  min-height: 64px;
  padding: 10px 12px;
  border-radius: var(--ls-radius-xl);
  border: 1px solid var(--ls-border-soft);
  background: var(--ls-bg-elevated);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 20px 50px rgba(15,23,42,0.10), 0 2px 10px rgba(15,23,42,0.04);
  transition: box-shadow var(--ls-duration-base) ease,
              border-color var(--ls-duration-base) ease,
              transform var(--ls-duration-base) ease;
}

.ls-command-bar__modes {
  display: flex; gap: 2px; flex-shrink: 0;
  padding-right: 10px; border-right: 1px solid rgba(15,23,42,0.06);
}

.ls-command-bar__input-wrap {
  flex: 1; display: flex; align-items: center; min-width: 0;
}

.ls-command-bar__actions {
  flex-shrink: 0;
}

.ls-command-bar__status {
  display: flex; align-items: center; gap: 5px;
  margin-top: 6px;
  font-size: var(--ls-font-micro);
  transition: opacity var(--ls-duration-fast) ease;
}
.ls-command-bar__status--hint {
  color: var(--ls-text-hint);
  cursor: default;
}
.ls-command-bar__status--warning {
  color: var(--ls-warning);
  cursor: pointer;
  text-decoration: underline dotted;
  text-underline-offset: 2px;
}
.ls-command-bar__status--warning:hover {
  color: var(--ls-warning);
  opacity: 0.9;
}
.ls-command-bar__status--loading {
  color: var(--ls-text-muted);
  cursor: default;
}
.ls-command-bar__status-icon {
  flex-shrink: 0;
  opacity: 0.7;
}

.ls-command-bar__footer {
  display: flex; align-items: center; gap: 12px;
  margin-top: 6px;
  opacity: 0.88;
}

/* ====== 3. children ====== */

/* 模式按钮 */
.ls-command-bar__mode {
  display: flex; align-items: center; gap: 5px;
  height: 30px; padding: 0 10px;
  border-radius: var(--ls-radius-pill);
  border: none; background: transparent;
  font-size: var(--ls-font-caption);
  font-weight: var(--ls-weight-subtitle);
  color: var(--ls-text-weak);
  cursor: pointer; white-space: nowrap;
  transition: all var(--ls-duration-fast) ease;
}

/* 输入控件 */
.ls-command-bar__input {
  width: 100%; min-height: 40px;
  padding: 0 12px; border-radius: 14px;
  border: none; background: transparent;
  outline: none; resize: none;
  font-size: var(--ls-font-body);
  font-weight: var(--ls-weight-body);
  color: var(--ls-text-main);
  font-family: var(--ls-font-sans);
  line-height: 1.5;
}
.ls-command-bar__input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.ls-command-bar__input::placeholder {
  color: var(--ls-text-weak);
  font-weight: var(--ls-weight-body);
}

/* 发送按钮 */
.ls-command-bar__send {
  display: flex; align-items: center; justify-content: center;
  width: 38px; height: 38px;
  border-radius: 14px;
  border: none; background: rgba(148,163,184,0.12);
  color: var(--ls-text-subtle);
  cursor: default; flex-shrink: 0;
  transition: all var(--ls-duration-base) ease;
}
.ls-command-bar__send.is-enabled {
  border: 1px solid rgba(79,110,247,0.16);
  background: linear-gradient(135deg, #5d7cff, #4f6ef7);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(79,110,247,0.18);
}

/* 发送中指示器 */
.ls-command-bar__sending-indicator {
  display: flex; align-items: center; justify-content: center;
  width: 38px; height: 38px;
  border-radius: 14px;
  background: rgba(79,110,247,0.10);
  color: var(--ls-accent);
}

@keyframes ls-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.ls-command-bar__spinner {
  animation: ls-spin 1.2s linear infinite;
}
.ls-command-bar__spinner--inline {
  width: 11px; height: 11px;
}

/* 快捷键提示 */
.ls-command-bar__hint {
  font-size: var(--ls-font-micro);
  color: var(--ls-text-hint);
  white-space: nowrap;
}
.ls-command-bar__hint kbd {
  display: inline-block;
  padding: 1px 5px; margin-right: 4px;
  border-radius: 3px;
  background: var(--ls-bg-panel);
  border: 1px solid var(--ls-border-soft);
  font-family: inherit; font-size: var(--ls-font-micro);
  color: var(--ls-text-weak);
  font-weight: var(--ls-weight-subtitle);
}

/* ====== 4. states ====== */

/* inner hover */
.ls-command-bar__inner:hover {
  border-color: rgba(99,115,129,0.22);
  box-shadow: 0 24px 60px rgba(15,23,42,0.12), 0 4px 16px rgba(15,23,42,0.06);
  transform: translateY(-1px);
}

/* inner focus */
.ls-command-bar.is-focused .ls-command-bar__inner {
  border-color: var(--ls-border-accent);
  box-shadow: var(--ls-shadow-lg), var(--ls-focus-ring);
  transform: translateY(-1px);
}

/* sending 态不支持 hover 升浮 */
.ls-command-bar.is-sending .ls-command-bar__inner:hover {
  transform: none;
  border-color: var(--ls-border-soft);
  box-shadow: 0 20px 50px rgba(15,23,42,0.10), 0 2px 10px rgba(15,23,42,0.04);
}

/* no-provider: 微妙强调 */
.ls-command-bar.no-provider .ls-command-bar__inner {
  border-color: rgba(245,158,11,0.20);
}
.ls-command-bar.no-provider.is-focused .ls-command-bar__inner {
  border-color: rgba(245,158,11,0.35);
  box-shadow: 0 0 0 2px rgba(245,158,11,0.06);
}

/* mode states */
.ls-command-bar__mode:hover {
  background: rgba(79,110,247,0.08);
  color: var(--ls-text-body);
}
.ls-command-bar__mode:focus-visible {
  outline: none;
  box-shadow: var(--ls-focus-ring);
}
.ls-command-bar__mode.is-active {
  background: linear-gradient(180deg, #5d7cff, #4f6ef7);
  color: #fff;
  box-shadow: 0 8px 18px rgba(79,110,247,0.22);
}

/* send states */
.ls-command-bar__send.is-enabled:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(79,110,247,0.28);
  filter: saturate(1.03);
}
.ls-command-bar__send.is-enabled:active {
  transform: scale(0.96);
  box-shadow: 0 4px 12px rgba(79,110,247,0.18);
}
.ls-command-bar__send.is-enabled:focus-visible {
  outline: none;
  box-shadow: var(--ls-focus-ring-strong);
}
.ls-command-bar__send:disabled {
  cursor: not-allowed;
}
</style>
