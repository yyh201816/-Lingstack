import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { SelfHostCapabilityItem, SelfHostPlanStage } from '../types/self-host.types'
import { computeReadiness, getDefaultMigrationPlan } from '../services/self-host-readiness.service'

const READINESS_KEY = 'lingstack_self_host_readiness_cache'
const PLAN_KEY = 'lingstack_self_host_plan'

function loadCapabilities(): SelfHostCapabilityItem[] | null {
  try {
    const raw = localStorage.getItem(READINESS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function loadPlan(): SelfHostPlanStage[] {
  try {
    const raw = localStorage.getItem(PLAN_KEY)
    return raw ? JSON.parse(raw) : getDefaultMigrationPlan()
  } catch { return getDefaultMigrationPlan() }
}

export const useSelfHostStore = defineStore('self-host', () => {
  const capabilities = ref<SelfHostCapabilityItem[]>(loadCapabilities() || [])
  const migrationPlan = ref<SelfHostPlanStage[]>(loadPlan())
  const isAnalyzing = ref(false)
  const lastAnalysisTime = ref<string | null>(null)

  watch(capabilities, (val) => {
    try { localStorage.setItem(READINESS_KEY, JSON.stringify(val)) } catch { /* quota */ }
  }, { deep: true })

  watch(migrationPlan, (val) => {
    try { localStorage.setItem(PLAN_KEY, JSON.stringify(val)) } catch { /* quota */ }
  }, { deep: true })

  // Getters
  const readyCount = computed(() => capabilities.value.filter(c => c.status === 'ready').length)
  const totalCount = computed(() => capabilities.value.length)
  const blockedItems = computed(() => capabilities.value.filter(c => c.status === 'blocked'))
  const partialItems = computed(() => capabilities.value.filter(c => c.status === 'partial'))
  const todoItems = computed(() => capabilities.value.filter(c => c.status === 'todo'))
  const readinessPercent = computed(() => {
    if (totalCount.value === 0) return 0
    return Math.round((readyCount.value / totalCount.value) * 100)
  })
  const currentStage = computed(() => {
    const pct = readinessPercent.value
    if (pct >= 80) return 'B'
    if (pct >= 50) return 'A'
    return 'A'
  })
  const recommendedAction = computed(() => {
    const pct = readinessPercent.value
    if (pct >= 80) return 'LingStack can handle small iterations and bug fixes. Continue expanding scope.'
    if (pct >= 50) return 'LingStack can observe threads, run terminal, collect feedback. Use Trae for large refactors.'
    return 'LingStack foundation is forming. Focus on completing core readiness items.'
  })

  // Actions
  async function runAnalysis() {
    isAnalyzing.value = true
    try {
      // Simulate analysis delay
      await new Promise(resolve => setTimeout(resolve, 500))
      capabilities.value = computeReadiness()
      lastAnalysisTime.value = new Date().toISOString()
    } finally {
      isAnalyzing.value = false
    }
  }

  function advanceStage(stageId: 'A' | 'B' | 'C') {
    const stage = migrationPlan.value.find(s => s.id === stageId)
    if (stage) {
      stage.status = stage.status === 'todo' ? 'in_progress' : stage.status === 'in_progress' ? 'done' : 'done'
    }
  }

  function setStageStatus(stageId: 'A' | 'B' | 'C', status: SelfHostPlanStage['status']) {
    const stage = migrationPlan.value.find(s => s.id === stageId)
    if (stage) stage.status = status
  }

  function resetAnalysis() {
    capabilities.value = []
    localStorage.removeItem(READINESS_KEY)
  }

  return {
    capabilities,
    migrationPlan,
    isAnalyzing,
    lastAnalysisTime,
    readyCount,
    totalCount,
    blockedItems,
    partialItems,
    todoItems,
    readinessPercent,
    currentStage,
    recommendedAction,
    runAnalysis,
    advanceStage,
    setStageStatus,
    resetAnalysis,
  }
})
