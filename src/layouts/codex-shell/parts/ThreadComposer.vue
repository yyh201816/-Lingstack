<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useComposerStore } from '@/features/chat/store/composer.store'
import { useThreadSessionStore } from '@/features/threads/store/thread-session.store'
import { useThreadStore } from '@/features/threads/store/thread.store'
import { preflightSend, sendChatMessage, abortChatStream, type ChatMessage } from '@/services/chat/chat.service'

const props = defineProps<{ threadId: string }>()

const composerStore = useComposerStore()
const sessionStore = useThreadSessionStore()
const threadStore = useThreadStore()

const isSending = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const draft = computed({
  get: () => composerStore.getDraft(props.threadId),
  set: (v) => composerStore.setDraft(props.threadId, v),
})

const mode = computed({
  get: () => composerStore.getMode(props.threadId),
  set: (v) => composerStore.setMode(props.threadId, v),
})

const attachmentCount = computed(() => composerStore.getAttachments(props.threadId).length)

// Focus textarea when thread changes
watch(() => props.threadId, () => {
  nextTick(() => textareaRef.value?.focus())
})

function buildChatHistory(threadId: string): ChatMessage[] {
  const msgs = sessionStore.getMessages(threadId)
  return msgs
    .filter((m) => (m.type === 'user' || m.type === 'assistant') && m.role)
    .map((m) => ({ role: m.role!, content: m.content }))
}

async function handleSend() {
  const text = draft.value.trim()
  if (!text || isSending.value) return

  isSending.value = true
  threadStore.updateThreadStatus(props.threadId, 'running')

  // Write user message to thread-session store
  sessionStore.appendMessage(props.threadId, 'user', text, 'user')
  composerStore.clearDraft(props.threadId)

  // Preflight check
  const preflight = preflightSend()
  if (!preflight.ok) {
    sessionStore.appendMessage(props.threadId, 'system', `Cannot send: ${preflight.message}`, 'system')
    isSending.value = false
    threadStore.updateThreadStatus(props.threadId, 'failed')
    return
  }

  // Create assistant placeholder
  const assistantMsg = sessionStore.appendMessage(props.threadId, 'assistant', '', 'assistant')

  // Collect chat history
  const history = buildChatHistory(props.threadId)

  sendChatMessage(
    history,
    // onToken
    (token: string) => {
      sessionStore.patchMessage(props.threadId, assistantMsg.id, {
        content: assistantMsg.content + token,
        streaming: true,
      })
    },
    // onComplete
    (fullContent: string) => {
      sessionStore.patchMessage(props.threadId, assistantMsg.id, {
        content: fullContent,
        streaming: false,
      })
      isSending.value = false
      threadStore.updateThreadStatus(props.threadId, fullContent ? 'idle' : 'done')
    },
    // onError
    (error: string) => {
      sessionStore.patchMessage(props.threadId, assistantMsg.id, {
        content: assistantMsg.content || '(no response)',
        streaming: false,
        error: true,
        meta: { errorMessage: error },
      })
      isSending.value = false
      threadStore.updateThreadStatus(props.threadId, 'failed')
    },
  )
}

function handleStop() {
  abortChatStream()
  isSending.value = false
  threadStore.updateThreadStatus(props.threadId, 'idle')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="composer">
    <div class="composer__mode-bar">
      <button
        class="composer__mode-btn"
        :class="{ 'composer__mode-btn--active': mode === 'ask' }"
        @click="mode = 'ask'"
      >问答</button>
      <button
        class="composer__mode-btn"
        :class="{ 'composer__mode-btn--active': mode === 'agent' }"
        @click="mode = 'agent'"
      >智能体</button>
      <span class="composer__context-hint">
        <template v-if="isSending">发送中...</template>
        <template v-else-if="draft">草稿已保存</template>
        <template v-else>就绪</template>
      </span>
    </div>
    <div class="composer__input-row">
      <textarea
        ref="textareaRef"
        v-model="draft"
        class="composer__input"
        :placeholder="isSending ? '等待响应...' : '输入消息...（Enter 发送，Shift+Enter 换行）'"
        rows="2"
        :disabled="isSending"
        @keydown="handleKeydown"
      ></textarea>
      <button
        v-if="!isSending"
        class="composer__send-btn"
        :disabled="!draft.trim()"
        @click="handleSend"
      >
        <span>&#x2191;</span>
      </button>
      <button
        v-else
        class="composer__stop-btn"
        title="Stop generating"
        @click="handleStop"
      >
        <span>&#x23F9;</span>
      </button>
    </div>
    <div v-if="attachmentCount > 0" class="composer__attachments">
      <span class="composer__attachment-badge">{{ attachmentCount }} 个附件</span>
    </div>
  </div>
</template>

<style scoped>
.composer {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: var(--ls-bg-panel, #0b0f18);
  flex-shrink: 0;
}
.composer__mode-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px 0;
}
.composer__mode-btn {
  padding: 3px 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  background: transparent;
  color: var(--ls-text-hint, #5d667a);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 140ms ease;
}
.composer__mode-btn--active {
  background: rgba(90, 147, 255, 0.12);
  border-color: rgba(90, 147, 255, 0.22);
  color: var(--ls-accent, #5a93ff);
}
.composer__context-hint {
  margin-left: auto;
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
}
.composer__input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 12px 10px;
}
.composer__input {
  flex: 1;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--ls-text-primary, #e9edf6);
  font-size: 13px;
  padding: 8px 12px;
  resize: none;
  outline: none;
  font-family: inherit;
  line-height: 1.45;
  transition: border-color 140ms ease;
  min-height: 36px;
  max-height: 120px;
}
.composer__input:focus { border-color: rgba(90, 147, 255, 0.3); }
.composer__input:disabled { opacity: 0.6; }
.composer__input::placeholder { color: var(--ls-text-hint, #5d667a); }
.composer__send-btn, .composer__stop-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 140ms ease, box-shadow 140ms ease, opacity 140ms ease;
  font-size: 16px;
}
.composer__send-btn {
  background: var(--ls-accent, #5a93ff);
  color: #fff;
}
.composer__send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 0 0 4px rgba(90, 147, 255, 0.15);
}
.composer__send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.composer__stop-btn {
  background: #ff6b6b;
  color: #fff;
}
.composer__stop-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.2);
}
.composer__attachments {
  padding: 0 12px 8px;
}
.composer__attachment-badge {
  font-size: 10px;
  color: var(--ls-accent, #5a93ff);
  background: rgba(90, 147, 255, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
}
</style>
