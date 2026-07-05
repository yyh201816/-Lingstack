<!-- Legacy chat surface: v0.3 主入口已迁移到 codex-shell/MainTaskWorkspace.vue。 -->
<script setup lang="ts">
/**
 * ChatPanel — 对话面板
 * Codex-style: 简洁消息流，流式响应支持
 * OpenAI 兼容 API，SSE 流式解析
 */
import { ref, nextTick, watch, onMounted, computed } from 'vue'
import { useWorkspaceStore } from '@/features/workspace/store/workspace.store'
import {
  sendChatMessage,
  abortChatStream,
  preflightSend,
  SYSTEM_PROMPT,
  type ChatMessage,
  type WorkspaceContext,
} from '@/services/chat/chat.service'
import { useTrainingDataStore } from '@/features/training-data/training-data.store'
import { useModelConfigsStore } from '@/features/settings/store/model-configs.store'
import { useNavigationStore } from '@/features/navigation/store/navigation.store'
import { useThreadStore } from '@/features/threads/store/thread.store'
import { useChatSessionStore } from './store/chat-session.store'
import { findPresetProvider } from '@/features/settings/data/preset-providers'
import type { DisplayMessage } from './store/chat-session.store'
import { Bot, Eraser, Square, AlertTriangle, Settings, ArrowRight, Zap, Copy, Check, Plus, MessageSquare, Trash2, ChevronLeft } from 'lucide-vue-next'
function buildWorkspaceContextPayload(): WorkspaceContext {
  const nav = useNavigationStore()
  const ws = useWorkspaceStore()
  const mc = useModelConfigsStore()
  const ts = useThreadStore()

  const ctx: WorkspaceContext = {}

  // 项目信息
  if (ws.activeProject) {
    ctx.projectPath = ws.activeProject
    ctx.projectName = nav.projectName || ws.activeProject.split(/[/\\]/).pop() || ''
  }

  // 当前视图
  ctx.activeView = nav.activeView

  // 当前模型
  if (mc.activeConfig) {
    ctx.selectedModel = {
      providerId: mc.activeConfig.providerId,
      modelId: mc.activeConfig.modelId,
      displayName: mc.activeConfig.displayName,
    }
  }

  // 打开的标签页
  if (ws.tabs.length > 0) {
    ctx.openTabs = ws.tabs.map(t => ({
      filePath: t.filePath,
      fileName: t.fileName,
      language: t.language,
      isActive: t.id === ws.activeTabId,
    }))
  }

  // 当前活动文件（优先级最高）
  if (ws.activeTab) {
    const tab = ws.activeTab
    ctx.activeFilePath = tab.filePath
    ctx.activeFileName = tab.fileName
    // 从 editedContentMap 或原始内容获取当前文件内容
    const content = ws.editedContentMap[tab.filePath] ?? tab.content ?? ''
    ctx.activeFileContent = content
  }

  ctx.theme = document.documentElement.getAttribute('data-theme') || 'dark'

  // Phase 11: Task-specific context from active thread
  if (ts.activeThread) {
    ctx.activeThreadId = ts.activeThread.id
    ctx.taskType = ts.activeThread.taskType
    if (ts.activeThread.goal) ctx.taskGoal = ts.activeThread.goal
    if (ts.activeThread.targetScope) ctx.taskScope = ts.activeThread.targetScope
  }

  return ctx
}

/** R24: 获取上下文注入摘要（供 UI 显示） */
function getContextSummary(ctx: WorkspaceContext): string[] {
  const items: string[] = []
  if (ctx.projectPath) items.push(`项目: ${ctx.projectName || ctx.projectPath.split(/[/\\]/).pop()}`)
  if (ctx.activeFilePath) items.push(`文件: ${ctx.activeFileName || ctx.activeFilePath.split(/[/\\]/).pop()}`)
  if (ctx.openTabs && ctx.openTabs.length > 1) items.push(`${ctx.openTabs.length} 个标签页`)
  if (ctx.selectedModel?.displayName) items.push(`模型: ${ctx.selectedModel.displayName}`)
  return items
}
// import { ChatHeader } from './components'  // import { ChatHeader } from './components'  // 组件不存在，暂时注释

const ws = useWorkspaceStore()
const tdStore = useTrainingDataStore()
const mcStore = useModelConfigsStore()
const nav = useNavigationStore()
const session = useChatSessionStore()

// R30.2: 状态从 chat-session store 读取，切页不丢失
const messages = computed(() => session.messages)
const inputText = computed({
  get: () => session.inputText,
  set: (v) => session.setInputText(v),
})
const isSending = computed({
  get: () => session.isSending,
  set: (v) => session.setSending(v),
})
const currentSampleId = computed({
  get: () => session.currentSampleId,
  set: (v) => session.setCurrentSampleId(v),
})

// R23: 响应式模型信息
const modelName = computed(() => mcStore.activeConfig?.displayName || mcStore.activeConfig?.modelId || '')

// DOM refs (stay local)
const messagesContainer = ref<HTMLDivElement>()
const textareaRef = ref<HTMLTextAreaElement>()
const copiedId = ref<string | null>(null)
const providerName = computed(() => {
  if (!mcStore.activeConfig) return ''
  if (mcStore.activeConfig.providerId === 'custom') return '自定义'
  return findPresetProvider(mcStore.activeConfig.providerId)?.name || mcStore.activeConfig.providerId
})
const providerIcon = computed(() => {
  if (!mcStore.activeConfig) return ''
  if (mcStore.activeConfig.providerId === 'custom') return '🔧'
  return findPresetProvider(mcStore.activeConfig.providerId)?.icon || '🤖'
})
const hasActiveModel = computed(() => mcStore.activeConfig !== null)
const hasApiKey = computed(() => (mcStore.activeConfig?.apiKey?.trim().length ?? 0) > 0)
const modelStatusText = computed(() => {
  if (!hasActiveModel.value) return '未配置模型'
  if (!hasApiKey.value) return '未配置 API Key'
  return ''
})

// R24: gatherWorkspaceContext 已替换为 buildWorkspaceContextPayload

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function addMessage(role: DisplayMessage['role'], content: string, isStreaming = false, isError = false) {
  session.addMessage(role, content, isStreaming, isError, isStreaming ? modelName.value : undefined)
  scrollToBottom()
}

function updateLastMessage(content: string, isStreaming = true, isError = false) {
  session.updateLastMessage(content, isStreaming, isError)
  scrollToBottom()
}

/** R30.2: 复制消息文本 */
async function copyMessage(msg: DisplayMessage) {
  try {
    await navigator.clipboard.writeText(msg.content)
    copiedId.value = msg.id
    setTimeout(() => { if (copiedId.value === msg.id) copiedId.value = null }, 2000)
  } catch {
    // fallback for older browsers
    const ta = document.createElement('textarea')
    ta.value = msg.content
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copiedId.value = msg.id
    setTimeout(() => { if (copiedId.value === msg.id) copiedId.value = null }, 2000)
  }
}

/** 发送消息 */
async function handleSend() {
  const text = inputText.value.trim()
  if (!text || isSending.value) return

  // R23: 发送前校验
  const preflight = preflightSend()
  if (!preflight.ok) {
    addMessage('assistant', preflight.message || '无法发送：配置不完整', false, true)
    return
  }

  addMessage('user', text)
  session.setInputText('')
  if (textareaRef.value) textareaRef.value.style.height = 'auto'
  session.setSending(true)

  addMessage('assistant', '', true)

  // R24: 构建完整工作台上下文 payload
  const ctx = buildWorkspaceContextPayload()

  try {
    const history: ChatMessage[] = messages.value
      .filter((m) => !m.isStreaming && !m.isError)
      .map((m) => ({ role: m.role, content: m.content }))

    await sendChatMessage(
      history,
      (token: string) => {
        const last = messages.value[messages.value.length - 1]
        if (last) updateLastMessage(last.content + token, true)
      },
      (fullContent: string) => {
        updateLastMessage(fullContent, false)
        session.setSending(false)
        // R24: 记录训练样本（含完整上下文快照）
        const sample = tdStore.addSample({
          taskType: 'chat',
          sourceModel: modelName.value,
          userInput: text,
          systemPrompt: SYSTEM_PROMPT,
          contextSnapshot: ctx.projectPath || ctx.activeFilePath ? {
            projectPath: ctx.projectPath,
            activeFilePath: ctx.activeFilePath,
            fileContentTruncated: (ctx.activeFileContent ?? '').slice(0, 2000),
          } : undefined,
          modelOutput: fullContent,
        })
        session.setCurrentSampleId(sample.id)
      },
      (error: string) => {
        updateLastMessage(error, false, true)
        session.setSending(false)
        // R24: 记录失败样本
        const sample = tdStore.addSample({
          taskType: 'chat',
          sourceModel: modelName.value,
          userInput: text,
          systemPrompt: SYSTEM_PROMPT,
          contextSnapshot: ctx.projectPath || ctx.activeFilePath ? {
            projectPath: ctx.projectPath,
            activeFilePath: ctx.activeFilePath,
          } : undefined,
          modelOutput: error,
        })
        tdStore.patchSample(sample.id, { success: false })
        session.setCurrentSampleId(null)
      },
      ctx,
    )
  } catch (err) {
    updateLastMessage(`请求失败: ${(err as Error).message}`, false, true)
    session.setSending(false)
  }
}

/** 停止流式输出 */
function handleStop() {
  abortChatStream()
  const last = session.messages[session.messages.length - 1]
  if (last && last.isStreaming) {
    last.isStreaming = false
    if (!last.content) last.content = '(已停止)'
  }
  session.setSending(false)
  // 标记样本为未成功完成
  const sampleId = session.currentSampleId
  if (sampleId) {
    tdStore.patchSample(sampleId, { success: false })
    session.setCurrentSampleId(null)
  }
}

/** 清空对话 */
function clearChat() {
  if (session.isSending) handleStop()
  session.clearChat()
}

// ====== R30.2: 多会话管理 ======
const showSessions = ref(false)

function toggleSessions() {
  showSessions.value = !showSessions.value
}

async function handleNewSession() {
  await session.createSession()
  showSessions.value = false
}

async function handleSwitchSession(id: string) {
  await session.switchSession(id)
  showSessions.value = false
  nextTick(() => scrollToBottom())
}

async function handleDeleteSession(id: string, e: Event) {
  e.stopPropagation()
  if (session.sessions.length <= 1) return // 至少保留一个
  await session.deleteSession(id)
}

function handleSessionTitleEdit(id: string) {
  const newTitle = prompt('重命名会话', session.sessions.find(s => s.id === id)?.title)
  if (newTitle && newTitle.trim()) {
    session.renameSession(id, newTitle.trim())
  }
}

function formatSessionTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
  if (e.key === 'Escape' && isSending.value) {
    handleStop()
  }
}

/** 自动调整 textarea 高度 */
function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

/** 接收外部消息（CommandBar 等）→ 自动发送 */
function receiveExternalMessage(text: string) {
  if (!text || session.isSending) return
  session.setInputText(text)
  nextTick(() => {
    autoResize()
    handleSend()
  })
}

/** R25: 监听 SkillsPanel 发送的 SkillExecutionPayload 事件 */
function onSkillPrompt(e: Event) {
  const detail = (e as CustomEvent).detail
  if (!detail) return

  // R25: 支持新格式（SkillExecutionPayload 对象）和旧格式（纯文本）
  const isPayload = typeof detail === 'object' && 'promptText' in detail
  const text = isPayload ? detail.promptText : detail

  if (!text) return

  // R25: 如果是 SkillExecutionPayload，注入增强上下文到 system prompt
  if (isPayload) {
    const payload = detail as import('@/services/skills/skill-execution.types').SkillExecutionPayload
    // 构建增强的 system prompt 前缀，包含 skill + knowledge 信息
    const enhancedPrefix = buildSkillEnhancedPrefix(payload)
    addMessage('user', enhancedPrefix + '\n\n' + text)
  } else {
    addMessage('user', text)
  }
  scrollToBottom()
}

/** R25: 从 SkillExecutionPayload 构建增强前缀 */
function buildSkillEnhancedPrefix(payload: import('@/services/skills/skill-execution.types').SkillExecutionPayload): string {
  const parts: string[] = []
  parts.push(`[Skill 执行: ${payload.skill.name}]`)
  const ctxItems: string[] = []
  if (payload.workspace.projectPath) ctxItems.push(`项目: ${payload.workspace.projectName || payload.workspace.projectPath.split(/[/\\]/).pop()}`)
  if (payload.workspace.activeFileName) ctxItems.push(`文件: ${payload.workspace.activeFileName}`)
  if (payload.knowledge.totalMatched > 0) ctxItems.push(`远程知识: ${payload.knowledge.totalMatched} 条`)
  if (payload.model.displayName) ctxItems.push(`模型: ${payload.model.displayName}`)
  if (ctxItems.length > 0) parts.push(`[上下文: ${ctxItems.join(' | ')}]`)
  return parts.join('\n')
}

onMounted(() => {
  window.addEventListener('skill-prompt', onSkillPrompt)
  // R30.2: 初始化会话存储（IndexedDB）
  session.init()
})

// R24: 响应式上下文摘要（实时反映当前注入了哪些上下文）
const contextSummary = computed(() => getContextSummary(buildWorkspaceContextPayload()))

defineExpose({ receiveExternalMessage, isSending: computed(() => session.isSending) })
</script>

<template>
  <div class="chat-panel">
    <!-- R30.2: 多会话侧边栏 -->
    <div v-if="showSessions" class="chat-panel__sessions-overlay" @click="showSessions = false" />
    <aside :class="['chat-panel__sessions', { 'chat-panel__sessions--open': showSessions }]">
      <div class="chat-panel__sessions-header">
        <span class="chat-panel__sessions-title">对话列表</span>
        <button class="chat-panel__sessions-close" @click="showSessions = false">
          <ChevronLeft :size="16" />
        </button>
      </div>
      <button class="chat-panel__sessions-new" @click="handleNewSession">
        <Plus :size="14" /> 新对话
      </button>
      <div class="chat-panel__sessions-list">
        <button
          v-for="s in session.sessions"
          :key="s.id"
          :class="['chat-panel__sessions-item', { 'chat-panel__sessions-item--active': s.id === session.activeSessionId }]"
          @click="handleSwitchSession(s.id)"
          @dblclick="handleSessionTitleEdit(s.id)"
        >
          <MessageSquare :size="13" class="chat-panel__sessions-item-icon" />
          <div class="chat-panel__sessions-item-info">
            <span class="chat-panel__sessions-item-title">{{ s.title }}</span>
            <span class="chat-panel__sessions-item-meta">{{ s.messageCount }} 条 · {{ formatSessionTime(s.updatedAt) }}</span>
          </div>
          <button
            class="chat-panel__sessions-item-delete"
            title="删除会话"
            @click="(e) => handleDeleteSession(s.id, e)"
          >
            <Trash2 :size="12" />
          </button>
        </button>
        <div v-if="session.sessions.length === 0" class="chat-panel__sessions-empty">
          暂无历史对话
        </div>
      </div>
    </aside>

    <!-- Header -->
    <div class="chat-panel__header">
      <button class="chat-panel__header-btn chat-panel__header-menu" title="对话列表" @click="toggleSessions">
        <MessageSquare :size="14" />
        <span v-if="session.sessions.length > 1" class="chat-panel__header-badge">{{ session.sessions.length }}</span>
      </button>
      <div class="chat-panel__model">
        <span v-if="providerIcon" class="chat-panel__model-icon">{{ providerIcon }}</span>
        <Bot v-else :size="14" />
        <span v-if="modelName" class="chat-panel__model-name">{{ modelName }}</span>
        <span v-else class="chat-panel__model-none">未配置</span>
        <span v-if="modelStatusText" class="chat-panel__model-status">{{ modelStatusText }}</span>
      </div>
      <div class="chat-panel__header-actions">
        <!-- R24: 上下文注入状态指示器 -->
        <div v-if="contextSummary.length > 0" class="chat-panel__ctx-badge" :title="contextSummary.join(' | ')">
          <span class="chat-panel__ctx-dot" />
          <span class="chat-panel__ctx-text">{{ contextSummary.length }} 项上下文</span>
        </div>
        <button
          v-if="session.messages.length > 0"
          class="chat-panel__header-btn"
          title="清空对话"
          @click="clearChat"
        >
          <Eraser :size="13" />
        </button>
      </div>
    </div>

    <!-- Messages -->
    <div ref="messagesContainer" class="chat-panel__messages">
      <!-- Empty state -->
      <div v-if="session.messages.length === 0" class="chat-panel__empty">
        <!-- R23: 未配置模型引导 -->
        <div v-if="!hasActiveModel" class="chat-panel__empty-cta">
          <div class="chat-panel__empty-cta-icon"><Zap :size="20" /></div>
          <h3 class="chat-panel__empty-cta-title">尚未配置 AI 模型</h3>
          <p class="chat-panel__empty-cta-desc">前往设置添加 DeepSeek、阿里云等服务商模型，即可开始对话。</p>
          <button class="chat-panel__empty-cta-btn" @click="nav.setView('settings')">
            <Settings :size="13" /> 前往设置 <ArrowRight :size="13" />
          </button>
        </div>
        <template v-else>
          <div class="chat-panel__brand">
            <span class="chat-panel__brand-name">灵栈 LingStack</span>
            <span class="chat-panel__brand-sub">桌面 AI 工作台</span>
          </div>
          <p class="chat-panel__hint">Enter 发送 · Shift+Enter 换行 · Esc 停止</p>
        </template>
      </div>

      <!-- Messages -->
      <div v-for="msg in session.messages" :key="msg.id" class="chat-panel__msg-group">
        <div class="chat-panel__msg" :class="[`chat-panel__msg--${msg.role}`, { 'chat-panel__msg--error': msg.isError }]">
          <!-- R23: 错误图标 -->
          <div v-if="msg.isError" class="chat-panel__error-badge">
            <AlertTriangle :size="12" />
          </div>
          <div class="chat-panel__bubble">
            <div class="chat-panel__content" :class="{ 'chat-panel__content--error': msg.isError }">{{ msg.content }}</div>
            <span v-if="msg.isStreaming" class="chat-panel__cursor">|</span>
          </div>

          <!-- R30.2: 复制按钮（assistant 消息） -->
          <div v-if="msg.role === 'assistant' && !msg.isStreaming && msg.content" class="chat-panel__msg-actions">
            <button
              class="chat-panel__msg-action"
              :title="copiedId === msg.id ? '已复制' : '复制'"
              @click="copyMessage(msg)"
            >
              <Check v-if="copiedId === msg.id" :size="12" />
              <Copy v-else :size="12" />
            </button>
          </div>

          <!-- R23: 错误消息操作 -->
          <div v-if="msg.isError" class="chat-panel__msg-actions chat-panel__msg-actions--error">
            <button
              class="chat-panel__msg-action chat-panel__msg-action--settings"
              title="前往设置"
              @click="nav.setView('settings')"
            >
              <Settings :size="11" /> 前往设置
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="chat-panel__input">
      <div class="chat-panel__input-wrapper">
        <textarea
          ref="textareaRef"
          class="chat-panel__textarea"
          placeholder="发送消息..."
          rows="1"
          :value="session.inputText"
          @input="session.setInputText(($event.target as HTMLTextAreaElement).value); autoResize()"
          @keydown="handleKeydown"
          :disabled="session.isSending"
        />
        <!-- Send / Stop -->
        <template v-if="session.isSending">
          <button class="chat-panel__stop" @click="handleStop" title="停止 (Esc)">
            <Square :size="12" />
          </button>
        </template>
        <template v-else>
          <button
            class="chat-panel__send"
            :class="{ 'chat-panel__send--active': session.inputText.trim() }"
            :disabled="!session.inputText.trim()"
            @click="handleSend"
            title="发送 (Enter)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
            </svg>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-panel { display: flex; flex-direction: column; height: 100%; background: var(--ls-bg-surface); }

/* Header */
.chat-panel__header {
  display: flex; align-items: center; justify-content: space-between;
  height: 32px; padding: 0 var(--ls-space-3);
  border-bottom: 1px solid var(--ls-border-soft);
  background: var(--ls-bg-shell);
  flex-shrink: 0;
}
.chat-panel__model { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--ls-text-muted); min-width: 0; }
.chat-panel__model-icon { font-size: 13px; flex-shrink: 0; }
.chat-panel__model-name {
  font-weight: 500; color: var(--ls-text-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.chat-panel__model-none { color: var(--ls-text-subtle); font-style: italic; }
.chat-panel__model-status {
  font-size: 10px; padding: 1px 6px; border-radius: 3px;
  background: var(--ls-danger-soft, rgba(224,85,106,.1)); color: var(--ls-danger, #e0556a);
  font-weight: 500; white-space: nowrap;
}
.chat-panel__header-actions { display: flex; align-items: center; gap: 4px; }
.chat-panel__header-btn {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: var(--ls-radius-xs);
  color: var(--ls-text-muted); transition: background-color var(--ls-duration-fast), color var(--ls-duration-fast);
}
.chat-panel__header-btn:hover { background: var(--ls-bg-panel-hover); color: var(--ls-text-primary); }

/* R24: 上下文注入状态指示器 */
.chat-panel__ctx-badge {
  display: flex; align-items: center; gap: 5px;
  padding: 2px 8px; border-radius: 10px;
  background: var(--ls-accent-soft, rgba(77,141,247,.08));
  cursor: default; user-select: none;
  transition: background-color var(--ls-duration-fast);
}
.chat-panel__ctx-badge:hover { background: var(--ls-accent-soft-hover, rgba(77,141,247,.14)); }
.chat-panel__ctx-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--ls-accent, #4d8df7);
  animation: ctx-pulse 2s ease-in-out infinite;
}
@keyframes ctx-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .4; }
}
.chat-panel__ctx-text {
  font-size: 10px; font-weight: 500; color: var(--ls-accent, #4d8df7);
  white-space: nowrap; letter-spacing: .02em;
}

/* Messages */
.chat-panel__messages { flex: 1; overflow-y: auto; padding: 12px 16px; }
.chat-panel__empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 8px; }
.chat-panel__brand { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.chat-panel__brand-name { font-size: var(--ls-text-lg); font-weight: 600; color: var(--ls-text-primary); letter-spacing: -0.3px; }
.chat-panel__brand-sub { font-size: 12px; color: var(--ls-text-muted); }
.chat-panel__hint { margin-top: 8px; font-size: 11px; color: var(--ls-text-muted); }

/* R23: 未配置模型 CTA */
.chat-panel__empty-cta {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 24px; text-align: center;
}
.chat-panel__empty-cta-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: var(--ls-accent-soft); color: var(--ls-accent);
  display: flex; align-items: center; justify-content: center;
}
.chat-panel__empty-cta-title { font-size: 14px; font-weight: 600; color: var(--ls-text-primary); }
.chat-panel__empty-cta-desc { font-size: 12px; color: var(--ls-text-muted); max-width: 280px; line-height: 1.5; }
.chat-panel__empty-cta-btn {
  display: inline-flex; align-items: center; gap: 5px;
  margin-top: 4px; padding: 7px 16px; border-radius: 7px;
  background: var(--ls-accent); color: #fff;
  font-size: 12px; font-weight: 500; border: none; cursor: pointer;
  transition: background .12s;
}
.chat-panel__empty-cta-btn:hover { background: var(--ls-accent-hover); }

/* Message Group */
.chat-panel__msg-group { margin-bottom: 12px; }
.chat-panel__msg { max-width: 85%; }
.chat-panel__msg--user { margin-left: auto; }
.chat-panel__msg--assistant { margin-right: auto; }
.chat-panel__bubble { display: inline-block; }
.chat-panel__msg--user .chat-panel__content { background: var(--ls-accent-soft); color: var(--ls-text-primary); border-radius: var(--ls-radius-md) var(--ls-radius-md) 2px var(--ls-radius-md); padding: 8px 14px; }
.chat-panel__msg--assistant .chat-panel__content { color: var(--ls-text-primary); border-radius: var(--ls-radius-md) var(--ls-radius-md) var(--ls-radius-md) 2px; padding: 8px 14px; line-height: 1.65; }
.chat-panel__content { font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
.chat-panel__cursor { display: inline-block; width: 1px; height: 14px; background: var(--ls-accent); animation: blink 1s step-end infinite; vertical-align: text-bottom; margin-left: 1px; }

/* Message Actions */
.chat-panel__msg-actions { display: flex; align-items: center; gap: 4px; margin-top: 4px; padding-left: 2px; opacity: 0; transition: opacity var(--ls-duration-fast); }
.chat-panel__msg-group:hover .chat-panel__msg-actions { opacity: 1; }
.chat-panel__msg-action {
  display: flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: var(--ls-radius-xs);
  color: var(--ls-text-subtle); transition: background-color var(--ls-duration-fast), color var(--ls-duration-fast);
}
.chat-panel__msg-action:hover { background: var(--ls-bg-panel-hover); color: var(--ls-text-secondary); }
.chat-panel__msg-action--settings {
  color: var(--ls-accent); font-size: 11px; font-weight: 500;
  padding: 3px 8px; border-radius: 4px;
}
.chat-panel__msg-action--settings:hover { background: var(--ls-accent-soft); color: var(--ls-accent); }

/* R23: 错误消息样式 */
.chat-panel__msg--error {
  border-left: 3px solid var(--ls-danger, #e0556a);
  padding-left: 10px;
}
.chat-panel__error-badge {
  display: flex; align-items: center; gap: 4px;
  margin-bottom: 4px; color: var(--ls-danger, #e0556a);
  font-size: 11px; font-weight: 500;
}
.chat-panel__content--error {
  color: var(--ls-danger, #e0556a) !important;
  font-style: italic;
}
.chat-panel__msg-actions--error { opacity: 1 !important; }

/* Input */
.chat-panel__input { padding: 8px 12px; border-top: 1px solid var(--ls-border-soft); background: var(--ls-bg-shell); flex-shrink: 0; }
.chat-panel__input-wrapper { display: flex; align-items: flex-end; gap: 8px; background: var(--ls-bg-surface); border: 1px solid var(--ls-border-soft); border-radius: var(--ls-radius-md); padding: 6px 8px 6px 12px; transition: border-color var(--ls-duration-fast), box-shadow var(--ls-duration-fast); }
.chat-panel__input-wrapper:focus-within { border-color: var(--ls-accent); box-shadow: 0 0 0 1px var(--ls-accent-soft); }
.chat-panel__textarea { flex: 1; border: none; background: transparent; color: var(--ls-text-primary); font-family: var(--ls-font-sans); font-size: 13px; line-height: 1.5; resize: none; outline: none; max-height: 120px; min-height: 22px; }
.chat-panel__textarea::placeholder { color: var(--ls-text-subtle); }
.chat-panel__send { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; border-radius: 4px; background: transparent; color: var(--ls-text-subtle); cursor: pointer; flex-shrink: 0; transition: all var(--ls-duration-fast); }
.chat-panel__send:hover:not(:disabled) { background: var(--ls-bg-panel-hover); color: var(--ls-text-muted); }
.chat-panel__send--active { color: var(--ls-accent); }
.chat-panel__send:active:not(:disabled) { transform: scale(0.92); }
.chat-panel__stop {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 4px;
  background: var(--ls-danger-soft); color: var(--ls-danger);
  cursor: pointer; flex-shrink: 0; transition: background-color var(--ls-duration-fast);
}
.chat-panel__stop:hover { background: var(--ls-danger); color: white; }

/* R30.2: 多会话侧边栏 */
.chat-panel__sessions-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.3); z-index: 10; }
.chat-panel__sessions {
  position: absolute; top: 0; left: 0; bottom: 0;
  width: 260px; background: var(--ls-bg-surface); border-right: 1px solid var(--ls-border-soft);
  z-index: 11; transform: translateX(-100%); transition: transform .18s ease;
  display: flex; flex-direction: column;
}
.chat-panel__sessions--open { transform: translateX(0); }
.chat-panel__sessions-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-bottom: 1px solid var(--ls-border-soft);
}
.chat-panel__sessions-title { font-size: 13px; font-weight: 600; color: var(--ls-text-primary); }
.chat-panel__sessions-close { background: none; border: none; color: var(--ls-text-muted); cursor: pointer; padding: 2px; }
.chat-panel__sessions-close:hover { color: var(--ls-text-primary); }
.chat-panel__sessions-new {
  display: flex; align-items: center; gap: 6px;
  margin: 8px; padding: 7px 10px; border-radius: 6px;
  background: var(--ls-accent); color: #fff; border: none;
  font-size: 12px; font-weight: 500; cursor: pointer;
}
.chat-panel__sessions-new:hover { opacity: .9; }
.chat-panel__sessions-list { flex: 1; overflow-y: auto; padding: 4px 6px; display: flex; flex-direction: column; gap: 2px; }
.chat-panel__sessions-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 6px; border: none; background: transparent;
  cursor: pointer; text-align: left; width: 100%;
}
.chat-panel__sessions-item:hover { background: var(--ls-bg-hover); }
.chat-panel__sessions-item--active { background: var(--ls-accent-soft); }
.chat-panel__sessions-item-icon { color: var(--ls-text-muted); flex-shrink: 0; }
.chat-panel__sessions-item-info { flex: 1; min-width: 0; }
.chat-panel__sessions-item-title { font-size: 12px; color: var(--ls-text-primary); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chat-panel__sessions-item-meta { font-size: 10px; color: var(--ls-text-muted); }
.chat-panel__sessions-item-delete {
  opacity: 0; flex-shrink: 0; background: none; border: none; color: var(--ls-text-muted);
  cursor: pointer; padding: 2px; border-radius: 3px;
}
.chat-panel__sessions-item:hover .chat-panel__sessions-item-delete { opacity: 1; }
.chat-panel__sessions-item-delete:hover { color: var(--ls-danger); background: var(--ls-danger-soft); }
.chat-panel__sessions-empty { font-size: 12px; color: var(--ls-text-muted); text-align: center; padding: 20px; }

.chat-panel__header-menu { position: relative; margin-right: 6px; }
.chat-panel__header-badge {
  position: absolute; top: -2px; right: -4px;
  min-width: 14px; height: 14px; border-radius: 7px;
  background: var(--ls-accent); color: #fff; font-size: 9px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; padding: 0 3px;
}

@keyframes blink { 50% { opacity: 0; } }
</style>
