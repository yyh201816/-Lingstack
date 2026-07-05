/**
 * chat-session.store.ts  多会话持久化 Store
 *
 * R30.2: IndexedDB 迁移 + 多会话系统
 * - IndexedDB 替代 localStorage，无 5MB 容量限制
 * - 支持多会话：创建/切换/删除/重命名
 * - 每个会话独立存储消息数组
 * - 启动时自动恢复最近活跃会话
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chatDB } from './indexed-db'

export interface DisplayMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  isStreaming: boolean
  modelName?: string
  isError?: boolean
}

export interface ChatSessionMeta {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
  lastPreview: string
}

interface SessionData {
  messages: DisplayMessage[]
  inputText: string
  currentSampleId: string | null
}

const DB_NAME = 'lingstack_chat'
const DB_VERSION = 2
const STORE_SESSIONS = 'sessions'
const STORE_META = 'meta'
const META_ACTIVE_ID = 'activeSessionId'

// ====== IndexedDB 初始化 ======
async function initDB(): Promise<void> {
  await chatDB.open(DB_NAME, DB_VERSION, (db) => {
    if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
      db.createObjectStore(STORE_SESSIONS)
    }
    if (!db.objectStoreNames.contains(STORE_META)) {
      db.createObjectStore(STORE_META)
    }
  })
}

// ====== 会话列表持久化 ======
async function loadSessionsMeta(): Promise<ChatSessionMeta[]> {
  try {
    await initDB()
    return await chatDB.getAll<ChatSessionMeta>(STORE_META)
  } catch { return [] }
}

async function saveSessionMeta(meta: ChatSessionMeta): Promise<void> {
  try { await chatDB.put(STORE_META, meta.id, meta) } catch { /* ignore */ }
}

async function deleteSessionMeta(id: string): Promise<void> {
  try { await chatDB.delete(STORE_META, id) } catch { /* ignore */ }
}

// ====== 会话数据持久化 ======
async function loadSessionData(id: string): Promise<SessionData | null> {
  try {
    const data = await chatDB.get<SessionData>(STORE_SESSIONS, id)
    if (data) {
      for (const m of data.messages) { m.isStreaming = false }
      return data
    }
  } catch { /* ignore */ }
  return null
}

async function saveSessionData(id: string, data: SessionData): Promise<void> {
  try { await chatDB.put(STORE_SESSIONS, id, data) } catch { /* ignore */ }
}

async function deleteSessionData(id: string): Promise<void> {
  try { await chatDB.delete(STORE_SESSIONS, id) } catch { /* ignore */ }
}

// ====== 活跃会话 ID 持久化 ======
async function loadActiveId(): Promise<string | null> {
  try {
    return await chatDB.get<string>(STORE_META, META_ACTIVE_ID)
  } catch { return null }
}

async function saveActiveId(id: string | null): Promise<void> {
  try {
    if (id) await chatDB.put(STORE_META, META_ACTIVE_ID, id)
    else await chatDB.delete(STORE_META, META_ACTIVE_ID)
  } catch { /* ignore */ }
}

// ====== 生成会话标题 ======
function generateTitle(firstMessage: string): string {
  const cleaned = firstMessage.trim().replace(/\n/g, ' ')
  if (cleaned.length <= 30) return cleaned
  return cleaned.slice(0, 30) + '...'
}

function createId(): string {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}

// ====== Store ======
export const useChatSessionStore = defineStore('chat-session', () => {
  // 会话列表
  const sessions = ref<ChatSessionMeta[]>([])
  const activeSessionId = ref<string | null>(null)
  const initialized = ref(false)

  // 当前活跃会话数据
  const activeMessages = ref<DisplayMessage[]>([])
  const activeInputText = ref('')
  const isSending = ref(false)
  const activeSampleId = ref<string | null>(null)

  // 迁移旧的 localStorage 数据
  async function migrateFromLocalStorage(): Promise<SessionData | null> {
    try {
      const raw = localStorage.getItem('lingstack_chat_session')
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) return null
      localStorage.removeItem('lingstack_chat_session')
      return {
        messages: parsed.messages,
        inputText: parsed.inputText ?? '',
        currentSampleId: parsed.currentSampleId ?? null,
      }
    } catch { return null }
  }

  // 初始化：加载会话列表 + 恢复活跃会话
  async function init() {
    if (initialized.value) return
    await initDB()

    const metas = await loadSessionsMeta()
    sessions.value = metas.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

    // 尝试迁移旧数据
    const migrated = await migrateFromLocalStorage()
    if (migrated && migrated.messages.length > 0) {
      const id = createId()
      const firstMsg = migrated.messages.find(m => m.role === 'user')
      const meta: ChatSessionMeta = {
        id,
        title: firstMsg ? generateTitle(firstMsg.content) : '已恢复的对话',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: migrated.messages.length,
        lastPreview: migrated.messages[migrated.messages.length - 1]?.content?.slice(0, 60) ?? '',
      }
      await saveSessionMeta(meta)
      await saveSessionData(id, migrated)
      sessions.value.unshift(meta)
      activeSessionId.value = id
      activeMessages.value = migrated.messages
      activeInputText.value = migrated.inputText
      activeSampleId.value = migrated.currentSampleId
      await saveActiveId(id)
      initialized.value = true
      return
    }

    // 恢复上次活跃会话
    const lastId = await loadActiveId()
    if (lastId && sessions.value.some(s => s.id === lastId)) {
      activeSessionId.value = lastId
      const data = await loadSessionData(lastId)
      if (data) {
        activeMessages.value = data.messages
        activeInputText.value = data.inputText
        activeSampleId.value = data.currentSampleId
      }
    }
    initialized.value = true
  }

  // 活跃会话数据（兼容旧接口）
  const messages = computed(() => activeMessages.value)
  const inputText = computed({
    get: () => activeInputText.value,
    set: (v) => activeInputText.value = v,
  })
  const currentSampleId = computed({
    get: () => activeSampleId.value,
    set: (v) => { activeSampleId.value = v; persistSampleId() },
  })

  const messageCount = computed(() => activeMessages.value.length)
  const activeSession = computed(() =>
    sessions.value.find(s => s.id === activeSessionId.value) ?? null
  )

  // 持久化当前会话
  async function persistSession() {
    if (!activeSessionId.value) return
    const data: SessionData = {
      messages: activeMessages.value,
      inputText: activeInputText.value,
      currentSampleId: activeSampleId.value,
    }
    await saveSessionData(activeSessionId.value, data)

    // 更新元数据
    const meta = sessions.value.find(s => s.id === activeSessionId.value)
    if (meta) {
      meta.updatedAt = new Date().toISOString()
      meta.messageCount = activeMessages.value.length
      const last = activeMessages.value[activeMessages.value.length - 1]
      meta.lastPreview = last?.content?.slice(0, 60) ?? ''
      await saveSessionMeta(meta)
    }
  }

  async function persistSampleId() {
    if (!activeSessionId.value) return
    const meta = sessions.value.find(s => s.id === activeSessionId.value)
    if (meta) {
      meta.updatedAt = new Date().toISOString()
      await saveSessionMeta(meta)
    }
  }

  // 消息操作
  function addMessage(role: DisplayMessage['role'], content: string, isStreaming = false, isError = false, modelName?: string) {
    const id = 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
    // 如果是新会话的第一条 user 消息，自动生成标题
    if (role === 'user' && activeMessages.value.length === 0 && activeSessionId.value) {
      const meta = sessions.value.find(s => s.id === activeSessionId.value)
      if (meta && meta.title === '新对话') {
        meta.title = generateTitle(content)
        saveSessionMeta(meta)
      }
    }
    activeMessages.value.push({ id, role, content, isStreaming, isError, modelName })
    if (!isStreaming) persistSession()
  }

  function updateLastMessage(content: string, isStreaming = true, isError = false) {
    const last = activeMessages.value[activeMessages.value.length - 1]
    if (last && last.role === 'assistant') {
      last.content = content
      last.isStreaming = isStreaming
      last.isError = isError
    }
    if (!isStreaming) persistSession()
  }

  function setInputText(text: string) { activeInputText.value = text }
  function setSending(sending: boolean) { isSending.value = sending }
  function setCurrentSampleId(id: string | null) {
    activeSampleId.value = id
    persistSampleId()
  }

  function clearChat() {
    if (isSending.value) { isSending.value = false }
    activeMessages.value = []
    activeInputText.value = ''
    activeSampleId.value = null
    persistSession()
  }

  function clearSessionStorage() {
    activeMessages.value = []
    activeInputText.value = ''
    activeSampleId.value = null
  }

  // ====== 多会话操作 ======
  async function createSession(): Promise<string> {
    // 先保存当前会话
    if (activeSessionId.value && activeMessages.value.length > 0) {
      await persistSession()
    }

    const id = createId()
    const meta: ChatSessionMeta = {
      id,
      title: '新对话',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      lastPreview: '',
    }
    await saveSessionMeta(meta)
    sessions.value.unshift(meta)

    // 切换到新会话
    activeSessionId.value = id
    activeMessages.value = []
    activeInputText.value = ''
    activeSampleId.value = null
    isSending.value = false
    await saveActiveId(id)

    return id
  }

  async function switchSession(id: string) {
    if (id === activeSessionId.value) return

    // 保存当前会话
    if (activeSessionId.value && activeMessages.value.length > 0) {
      await persistSession()
    }

    // 加载目标会话
    const data = await loadSessionData(id)
    activeSessionId.value = id
    activeMessages.value = data?.messages ?? []
    activeInputText.value = data?.inputText ?? ''
    activeSampleId.value = data?.currentSampleId ?? null
    isSending.value = false
    await saveActiveId(id)
  }

  async function deleteSession(id: string) {
    await deleteSessionMeta(id)
    await deleteSessionData(id)
    sessions.value = sessions.value.filter(s => s.id !== id)

    if (id === activeSessionId.value) {
      if (sessions.value.length > 0) {
        await switchSession(sessions.value[0].id)
      } else {
        activeSessionId.value = null
        activeMessages.value = []
        activeInputText.value = ''
        activeSampleId.value = null
        await saveActiveId(null)
      }
    }
  }

  async function renameSession(id: string, title: string) {
    const meta = sessions.value.find(s => s.id === id)
    if (meta) {
      meta.title = title
      await saveSessionMeta(meta)
    }
  }

  // ====== AbortController 管理（按 thread/session 维度） ======
  const abortControllers = ref<Record<string, AbortController>>({})

  function registerAbortController(sessionId: string, controller: AbortController) {
    abortControllers.value[sessionId] = controller
  }

  function removeAbortController(sessionId: string) {
    delete abortControllers.value[sessionId]
  }

  function getAbortController(sessionId: string): AbortController | undefined {
    return abortControllers.value[sessionId]
  }

  function abortSession(sessionId: string) {
    const ctrl = abortControllers.value[sessionId]
    if (ctrl) {
      ctrl.abort()
      delete abortControllers.value[sessionId]
    }
  }

  return {
    // 状态
    sessions,
    activeSessionId,
    initialized,
    messages,
    inputText,
    isSending,
    currentSampleId,
    messageCount,
    activeSession,
    // 消息操作
    addMessage,
    updateLastMessage,
    setInputText,
    setSending,
    setCurrentSampleId,
    clearChat,
    clearSessionStorage,
    persist: persistSession,
    // 会话管理
    init,
    createSession,
    switchSession,
    deleteSession,
    renameSession,
    // AbortController 管理
    registerAbortController,
    removeAbortController,
    getAbortController,
    abortSession,
  }
})
