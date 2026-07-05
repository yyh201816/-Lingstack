import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { ThreadOrchestrationState, OrchestrationStep, OrchestrationStatus, OrchestrationStepType } from '../types/orchestration.types'

const STORAGE_KEY = 'lingstack_orchestration'

function generateId(): string {
  return `orch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function now(): string {
  return new Date().toISOString()
}

function loadFromStorage(): Record<string, ThreadOrchestrationState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export const useOrchestrationStore = defineStore('orchestration', () => {
  const orchestrationByThread = ref<Record<string, ThreadOrchestrationState>>(loadFromStorage())

  watch(orchestrationByThread, (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    } catch { /* quota */ }
  }, { deep: true })

  const getCurrentOrchestration = computed(() => {
    return (threadId: string): ThreadOrchestrationState | undefined =>
      orchestrationByThread.value[threadId]
  })

  const currentSteps = computed(() => {
    return (threadId: string): OrchestrationStep[] =>
      orchestrationByThread.value[threadId]?.steps ?? []
  })

  function initThreadOrchestration(threadId: string): ThreadOrchestrationState {
    const state: ThreadOrchestrationState = {
      threadId,
      status: 'idle',
      steps: [],
      lastUpdatedAt: now(),
    }
    orchestrationByThread.value[threadId] = state
    return state
  }

  function ensureOrchestration(threadId: string): ThreadOrchestrationState {
    return orchestrationByThread.value[threadId] ?? initThreadOrchestration(threadId)
  }

  function setStatus(threadId: string, status: OrchestrationStatus) {
    const orch = ensureOrchestration(threadId)
    orch.status = status
    orch.lastUpdatedAt = now()
  }

  function addStep(threadId: string, type: OrchestrationStepType, title: string, detail?: string): OrchestrationStep {
    const orch = ensureOrchestration(threadId)
    const step: OrchestrationStep = {
      id: generateId(),
      threadId,
      type,
      title,
      detail,
      status: 'pending',
      createdAt: now(),
      updatedAt: now(),
    }
    orch.steps.push(step)
    orch.lastUpdatedAt = now()
    return step
  }

  function startStep(threadId: string, stepId: string) {
    const orch = ensureOrchestration(threadId)
    const step = orch.steps.find(s => s.id === stepId)
    if (step) {
      step.status = 'running'
      step.updatedAt = now()
      orch.currentStepId = stepId
      orch.status = 'running'
      orch.lastUpdatedAt = now()
    }
  }

  function finishStep(threadId: string, stepId: string) {
    const orch = ensureOrchestration(threadId)
    const step = orch.steps.find(s => s.id === stepId)
    if (step) {
      step.status = 'done'
      step.updatedAt = now()
      orch.lastUpdatedAt = now()
      const allDone = orch.steps.every(s => s.status === 'done' || s.status === 'skipped')
      if (allDone) {
        orch.status = 'done'
        orch.currentStepId = undefined
      }
    }
  }

  function failStep(threadId: string, stepId: string) {
    const orch = ensureOrchestration(threadId)
    const step = orch.steps.find(s => s.id === stepId)
    if (step) {
      step.status = 'failed'
      step.updatedAt = now()
      orch.status = 'failed'
      orch.currentStepId = undefined
      orch.lastUpdatedAt = now()
    }
  }

  function skipStep(threadId: string, stepId: string) {
    const orch = ensureOrchestration(threadId)
    const step = orch.steps.find(s => s.id === stepId)
    if (step) {
      step.status = 'skipped'
      step.updatedAt = now()
      orch.lastUpdatedAt = now()
    }
  }

  function pauseThread(threadId: string) {
    const orch = ensureOrchestration(threadId)
    orch.status = 'paused'
    orch.lastUpdatedAt = now()
  }

  function resumeThread(threadId: string) {
    const orch = ensureOrchestration(threadId)
    orch.status = 'running'
    orch.lastUpdatedAt = now()
  }

  function clearThreadOrchestration(threadId: string) {
    delete orchestrationByThread.value[threadId]
  }

  return {
    orchestrationByThread,
    getCurrentOrchestration,
    currentSteps,
    initThreadOrchestration,
    ensureOrchestration,
    setStatus,
    addStep,
    startStep,
    finishStep,
    failStep,
    skipStep,
    pauseThread,
    resumeThread,
    clearThreadOrchestration,
  }
})
