import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { ReleaseGateStatus, ReleaseConclusion, IterationStatus, BetaIterationItem, BetaGateItem, RegressionCheckItem, BetaChannel } from '../beta-iteration.types'
import { defaultGateItems, defaultRegressionItems } from '../beta-iteration.types'

const ITER_KEY = 'lingstack_beta_iterations'
const GATE_KEY = 'lingstack_beta_gate'
const REGR_KEY = 'lingstack_regression_checks'

function gid(): string { return 'iter_' + Date.now() + '_' + Math.random().toString(36).slice(2,7) }
function n(): string { return new Date().toISOString() }
function ld<T>(k: string, d: T): T { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d } catch { return d } }
function sv(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

export const useBetaIterationStore = defineStore('beta-iteration', () => {
  const iterations = ref<BetaIterationItem[]>(ld(ITER_KEY, []))
  const currentId = ref<string>(iterations.value.find(i => i.status !== 'released')?.id ?? '')
  const gateItems = ref<BetaGateItem[]>(ld(GATE_KEY, defaultGateItems()))
  const regressionItems = ref<RegressionCheckItem[]>(ld(REGR_KEY, defaultRegressionItems()))

  watch(iterations, v => sv(ITER_KEY, v), { deep: true })
  watch(gateItems, v => sv(GATE_KEY, v), { deep: true })
  watch(regressionItems, v => sv(REGR_KEY, v), { deep: true })

  const current = computed(() => iterations.value.find(i => i.id === currentId.value) ?? null)
  const gatePassCount = computed(() => gateItems.value.filter(g => g.status === 'pass').length)
  const gateFailCount = computed(() => gateItems.value.filter(g => g.status === 'fail').length)
  const regrPassCount = computed(() => regressionItems.value.filter(r => r.status === 'pass').length)

  const releaseConclusion = computed<ReleaseConclusion>(() => {
    if (gateFailCount.value > 0) return 'blocked'
    const totalPass = gatePassCount.value + regrPassCount.value
    const total = gateItems.value.length + regressionItems.value.length
    if (totalPass >= total * 0.8) return 'ready'
    if (totalPass >= total * 0.5) return 'partial'
    return 'blocked'
  })

  function createIteration(version: string, title: string, objective: string, opts?: { channel?: BetaChannel; includedTaskIds?: string[] }): BetaIterationItem {
    const item: BetaIterationItem = {
      id: gid(), version, title, objective,
      status: 'planning', channel: opts?.channel ?? 'beta',
      includedTaskIds: opts?.includedTaskIds ?? [],
      changelog: '', buildStatus: 'pending',
      releaseStatus: 'pending', updaterStatus: 'pending',
      createdAt: n(), updatedAt: n(),
    }
    iterations.value.unshift(item)
    currentId.value = item.id
    resetGateItems()
    resetRegressionItems()
    return item
  }

  function addTaskToIteration(iterationId: string, taskId: string) {
    const it = iterations.value.find(i => i.id === iterationId)
    if (it && !it.includedTaskIds.includes(taskId)) {
      it.includedTaskIds.push(taskId)
      it.updatedAt = n()
    }
  }

  function setChangelog(iterationId: string, changelog: string) {
    const it = iterations.value.find(i => i.id === iterationId)
    if (it) { it.changelog = changelog; it.updatedAt = n() }
  }

  function setBuildStatus(iterationId: string, status: 'pending' | 'building' | 'success' | 'failed') {
    const it = iterations.value.find(i => i.id === iterationId)
    if (it) { it.buildStatus = status; it.updatedAt = n() }
  }

  function setIterationStatus(id: string, status: IterationStatus) {
    const it = iterations.value.find(i => i.id === id)
    if (it) { it.status = status; it.updatedAt = n() }
  }

  function updateGateItem(id: string, status: ReleaseGateStatus, detail?: string) {
    const g = gateItems.value.find(x => x.id === id)
    if (g) { g.status = status; if (detail !== undefined) g.detail = detail }
  }

  function updateRegressionItem(id: string, status: ReleaseGateStatus, note?: string) {
    const r = regressionItems.value.find(x => x.id === id)
    if (r) { r.status = status; if (note !== undefined) r.note = note; r.checkedAt = n() }
  }

  function resetGateItems() { gateItems.value = defaultGateItems() }
  function resetRegressionItems() { regressionItems.value = defaultRegressionItems() }

  return {
    iterations, currentId, current, gateItems, regressionItems,
    gatePassCount, gateFailCount, regrPassCount, releaseConclusion,
    createIteration, addTaskToIteration, setChangelog, setBuildStatus, setIterationStatus,
    updateGateItem, updateRegressionItem,
    resetGateItems, resetRegressionItems,
  }
})
