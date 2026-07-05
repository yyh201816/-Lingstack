import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { BetaFeedbackItem, BetaFeedbackType, BetaFeedbackStatus, BetaVersionInfo } from '../types/beta-feedback.types'

const STORAGE_KEY = 'lingstack_beta_feedback'
const VERSION_KEY = 'lingstack_beta_version_info'

function generateId(): string {
  return `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function now(): string {
  return new Date().toISOString()
}

function loadFeedback(): BetaFeedbackItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function loadVersionInfo(): BetaVersionInfo {
  try {
    const raw = localStorage.getItem(VERSION_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {
    appVersion: '0.2.9',
    buildChannel: 'beta',
    updateAvailable: false,
  }
}

export const useBetaFeedbackStore = defineStore('beta-feedback', () => {
  const feedbacks = ref<BetaFeedbackItem[]>(loadFeedback())
  const versionInfo = ref<BetaVersionInfo>(loadVersionInfo())
  const showFeedbackDialog = ref(false)
  const editingFeedback = ref<BetaFeedbackItem | null>(null)

  watch(feedbacks, (val) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(val)) } catch { /* quota */ }
  }, { deep: true })

  watch(versionInfo, (val) => {
    try { localStorage.setItem(VERSION_KEY, JSON.stringify(val)) } catch { /* quota */ }
  }, { deep: true })

  // Getters
  const feedbackCount = computed(() => feedbacks.value.length)
  const submittedFeedbacks = computed(() => feedbacks.value.filter(f => f.status === 'submitted' || f.status === 'synced'))
  const draftFeedbacks = computed(() => feedbacks.value.filter(f => f.status === 'draft'))
  const failedFeedbacks = computed(() => feedbacks.value.filter(f => f.status === 'failed'))
  const feedbacksByThread = computed(() => {
    return (threadId: string) => feedbacks.value.filter(f => f.currentThreadId === threadId)
  })

  // Actions
  function createFeedback(
    type: BetaFeedbackType,
    title: string,
    description: string,
    opts?: {
      threadId?: string
      projectId?: string
      tags?: string[]
      includeRuntimeState?: boolean
      includeActiveThreadSummary?: boolean
      runtimeSnapshot?: BetaFeedbackItem['runtimeSnapshot']
    },
  ): BetaFeedbackItem {
    const item: BetaFeedbackItem = {
      id: generateId(),
      type,
      title,
      description,
      currentThreadId: opts?.threadId,
      currentProjectId: opts?.projectId,
      appVersion: versionInfo.value.appVersion,
      createdAt: now(),
      status: 'submitted',
      tags: opts?.tags,
      includeRuntimeState: opts?.includeRuntimeState,
      includeActiveThreadSummary: opts?.includeActiveThreadSummary,
      runtimeSnapshot: opts?.runtimeSnapshot,
    }
    feedbacks.value.unshift(item)
    return item
  }

  function updateFeedbackStatus(id: string, status: BetaFeedbackStatus) {
    const fb = feedbacks.value.find(f => f.id === id)
    if (fb) fb.status = status
  }

  function retryFeedback(id: string) {
    const fb = feedbacks.value.find(f => f.id === id)
    if (fb && fb.status === 'failed') fb.status = 'submitted'
  }

  function removeFeedback(id: string) {
    feedbacks.value = feedbacks.value.filter(f => f.id !== id)
  }

  function clearAllFeedbacks() {
    feedbacks.value = []
  }

  function setVersionInfo(info: Partial<BetaVersionInfo>) {
    Object.assign(versionInfo.value, info)
  }

  function openFeedbackDialog(feedback?: BetaFeedbackItem) {
    editingFeedback.value = feedback ?? null
    showFeedbackDialog.value = true
  }

  function closeFeedbackDialog() {
    showFeedbackDialog.value = false
    editingFeedback.value = null
  }

  return {
    feedbacks,
    versionInfo,
    showFeedbackDialog,
    editingFeedback,
    feedbackCount,
    submittedFeedbacks,
    draftFeedbacks,
    failedFeedbacks,
    feedbacksByThread,
    createFeedback,
    updateFeedbackStatus,
    retryFeedback,
    removeFeedback,
    clearAllFeedbacks,
    setVersionInfo,
    openFeedbackDialog,
    closeFeedbackDialog,
  }
})
