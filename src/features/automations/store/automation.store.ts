import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { AutomationItem, AutomationRunRecord, AutomationRunStatus } from '../types/automation.types'

const AUTOMATIONS_KEY = 'lingstack_automations'
const RUNS_KEY = 'lingstack_automation_runs'

function generateId(prefix: string): string {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}

function loadFromStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

export const useAutomationStore = defineStore('automation', () => {
  // --- state ---
  const automations = ref<AutomationItem[]>(loadFromStorage<AutomationItem>(AUTOMATIONS_KEY))
  const runHistory = ref<AutomationRunRecord[]>(loadFromStorage<AutomationRunRecord>(RUNS_KEY))

  // --- auto-persist ---
  watch(automations, (val) => {
    saveToStorage(AUTOMATIONS_KEY, val)
  }, { deep: true })

  watch(runHistory, (val) => {
    saveToStorage(RUNS_KEY, val)
  }, { deep: true })

  // --- getters ---
  const enabledAutomations = computed(() =>
    automations.value.filter((a) => a.enabled),
  )

  const automationsByProject = computed(() => {
    const map: Record<string, AutomationItem[]> = {}
    for (const a of automations.value) {
      const pid = a.projectId || '__none__'
      if (!map[pid]) map[pid] = []
      map[pid].push(a)
    }
    return map
  })

  function recentRuns(automationId: string): AutomationRunRecord[] {
    return runHistory.value
      .filter((r) => r.automationId === automationId)
      .sort((a, b) => {
        const ta = a.startedAt ? new Date(a.startedAt).getTime() : 0
        const tb = b.startedAt ? new Date(b.startedAt).getTime() : 0
        return tb - ta
      })
  }

  const runningCount = computed(() =>
    runHistory.value.filter((r) => r.status === 'running' || r.status === 'queued').length,
  )

  // --- actions ---
  function addAutomation(data: Omit<AutomationItem, 'id' | 'createdAt' | 'updatedAt'>): AutomationItem {
    const now = new Date().toISOString()
    const automation: AutomationItem = {
      ...data,
      id: generateId('auto'),
      createdAt: now,
      updatedAt: now,
    }
    automations.value.push(automation)
    return automation
  }

  function updateAutomation(id: string, partial: Partial<Omit<AutomationItem, 'id' | 'createdAt'>>) {
    const item = automations.value.find((a) => a.id === id)
    if (!item) return
    Object.assign(item, partial, { updatedAt: new Date().toISOString() })
  }

  function removeAutomation(id: string) {
    automations.value = automations.value.filter((a) => a.id !== id)
    runHistory.value = runHistory.value.filter((r) => r.automationId !== id)
  }

  function enableAutomation(id: string) {
    updateAutomation(id, { enabled: true })
  }

  function disableAutomation(id: string) {
    updateAutomation(id, { enabled: false })
  }

  function enqueueRun(automationId: string): AutomationRunRecord {
    const run: AutomationRunRecord = {
      id: generateId('run'),
      automationId,
      status: 'queued',
    }
    runHistory.value.push(run)
    return run
  }

  function startRun(runId: string, threadId: string) {
    const run = runHistory.value.find((r) => r.id === runId)
    if (!run) return
    run.status = 'running'
    run.startedAt = new Date().toISOString()
    run.threadId = threadId
  }

  function finishRun(runId: string, summary: string) {
    const run = runHistory.value.find((r) => r.id === runId)
    if (!run) return
    run.status = 'done'
    run.finishedAt = new Date().toISOString()
    run.summary = summary
  }

  function failRun(runId: string, errorMessage: string) {
    const run = runHistory.value.find((r) => r.id === runId)
    if (!run) return
    run.status = 'failed'
    run.finishedAt = new Date().toISOString()
    run.errorMessage = errorMessage
  }

  function cancelRun(runId: string) {
    const run = runHistory.value.find((r) => r.id === runId)
    if (!run) return
    run.status = 'cancelled'
    run.finishedAt = new Date().toISOString()
  }

  return {
    // state
    automations,
    runHistory,
    // getters
    enabledAutomations,
    automationsByProject,
    recentRuns,
    runningCount,
    // actions
    addAutomation,
    updateAutomation,
    removeAutomation,
    enableAutomation,
    disableAutomation,
    enqueueRun,
    startRun,
    finishRun,
    failRun,
    cancelRun,
  }
})