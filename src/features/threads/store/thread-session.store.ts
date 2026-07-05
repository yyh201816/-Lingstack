import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ThreadMessage } from '../types'

const STORAGE_KEY = 'lingstack_thread_sessions'

function loadAllSessions(): Record<string, ThreadMessage[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    // Validate each entry: ensure it's an array of messages with at least id and threadId
    const cleaned: Record<string, ThreadMessage[]> = {}
    for (const [key, val] of Object.entries(parsed)) {
      if (Array.isArray(val)) {
        const validMsgs = val.filter((m) => m && typeof m === 'object' && typeof m.id === 'string' && typeof m.threadId === 'string')
        if (validMsgs.length > 0) cleaned[key] = validMsgs
      }
    }
    return cleaned
  } catch (e) {
    console.warn('[thread-session] Failed to load sessions, resetting:', e)
    return {}
  }
}

function saveAllSessions(data: Record<string, ThreadMessage[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('[thread-session] Failed to save sessions:', e)
  }
}

function generateId(): string {
  return 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}

export const useThreadSessionStore = defineStore('thread-session', () => {
  // --- state ---
  const messagesByThread = ref<Record<string, ThreadMessage[]>>(loadAllSessions())

  // --- getters ---
  function getMessages(threadId: string): ThreadMessage[] {
    return messagesByThread.value[threadId] ?? []
  }

  function getMessageCount(threadId: string): number {
    return (messagesByThread.value[threadId]?.length ?? 0)
  }

  // --- actions ---
  function appendMessage(
    threadId: string,
    type: ThreadMessage['type'],
    content: string,
    role?: ThreadMessage['role'],
    meta?: ThreadMessage['meta'],
  ): ThreadMessage {
    if (!messagesByThread.value[threadId]) {
      messagesByThread.value[threadId] = []
    }
    const msg: ThreadMessage = {
      id: generateId(),
      threadId,
      type,
      role,
      content,
      createdAt: new Date().toISOString(),
      streaming: type === 'assistant',
      error: false,
      meta,
    }
    messagesByThread.value[threadId].push(msg)
    persist()
    return msg
  }

  function patchMessage(
    threadId: string,
    messageId: string,
    patch: Partial<Pick<ThreadMessage, 'content' | 'streaming' | 'error' | 'meta'>>,
  ) {
    const msgs = messagesByThread.value[threadId]
    if (!msgs) return
    const msg = msgs.find((m) => m.id === messageId)
    if (msg) {
      Object.assign(msg, patch)
      if (!patch.streaming) persist()
    }
  }

  function patchLastMessage(
    threadId: string,
    patch: Partial<Pick<ThreadMessage, 'content' | 'streaming' | 'error' | 'meta'>>,
  ) {
    const msgs = messagesByThread.value[threadId]
    if (!msgs || msgs.length === 0) return
    const last = msgs[msgs.length - 1]
    Object.assign(last, patch)
    if (!patch.streaming) persist()
  }

  function clearThreadMessages(threadId: string) {
    delete messagesByThread.value[threadId]
    persist()
  }

  function hydrate() {
    messagesByThread.value = loadAllSessions()
  }

  function persist() {
    saveAllSessions(messagesByThread.value)
  }

  return {
    // state
    messagesByThread,
    // getters
    getMessages,
    getMessageCount,
    // actions
    appendMessage,
    patchMessage,
    patchLastMessage,
    clearThreadMessages,
    hydrate,
    persist,
  }
})
