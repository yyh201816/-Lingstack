/**
 * regression-checklist.store.ts — Phase 12
 * Institutionalized regression checklist management
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { RegressionChecklist, RegressionChecklistItem, RegressionItemStatus } from '../types'
import { defaultRegressionChecklist } from '../types'

const STORAGE_KEY = 'lingstack_regression_checklists'

function load(): RegressionChecklist[] {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}
function save(v: RegressionChecklist[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) } catch {}
}
function now(): string { return new Date().toISOString() }

export const useRegressionChecklistStore = defineStore('regression-checklist', () => {
  const checklists = ref<RegressionChecklist[]>(load())
  const activeChecklistId = ref<string | null>(checklists.value[0]?.id ?? null)

  watch(checklists, v => save(v), { deep: true })

  const active = computed(() =>
    checklists.value.find(c => c.id === activeChecklistId.value) ?? null
  )

  const activePassCount = computed(() =>
    active.value?.items.filter(i => i.status === 'pass').length ?? 0
  )
  const activeFailCount = computed(() =>
    active.value?.items.filter(i => i.status === 'fail').length ?? 0
  )
  const activePendingCount = computed(() =>
    active.value?.items.filter(i => i.status === 'pending').length ?? 0
  )
  const isAllPass = computed(() =>
    active.value ? active.value.items.every(i => i.status === 'pass') : false
  )

  function createChecklist(taskId: string, version?: string): RegressionChecklist {
    const cl = defaultRegressionChecklist(taskId, version)
    checklists.value.unshift(cl)
    activeChecklistId.value = cl.id
    return cl
  }

  function getChecklist(id: string): RegressionChecklist | undefined {
    return checklists.value.find(c => c.id === id)
  }

  function getChecklistByTask(taskId: string): RegressionChecklist | undefined {
    return checklists.value.find(c => c.taskId === taskId)
  }

  function setActive(id: string | null) {
    activeChecklistId.value = id
  }

  function updateItem(checklistId: string, itemKey: string, status: RegressionItemStatus, note?: string) {
    const cl = checklists.value.find(c => c.id === checklistId)
    if (!cl) return
    const item = cl.items.find(i => i.key === itemKey)
    if (!item) return
    item.status = status
    if (note !== undefined) item.note = note
    item.checkedAt = now()
    cl.updatedAt = now()
    recalcOverall(cl)
  }

  function updateActiveItem(itemKey: string, status: RegressionItemStatus, note?: string) {
    if (!activeChecklistId.value) return
    updateItem(activeChecklistId.value, itemKey, status, note)
  }

  function toggleActiveItem(itemKey: string) {
    if (!active.value) return
    const item = active.value.items.find(i => i.key === itemKey)
    if (!item) return
    const newStatus: RegressionItemStatus = item.status === 'pass' ? 'pending' : 'pass'
    updateActiveItem(itemKey, newStatus)
  }

  function recalcOverall(cl: RegressionChecklist) {
    const all = cl.items
    const passCount = all.filter(i => i.status === 'pass').length
    const failCount = all.filter(i => i.status === 'fail').length
    if (failCount > 0) cl.overallStatus = 'fail'
    else if (passCount === all.length) cl.overallStatus = 'pass'
    else if (passCount > 0) cl.overallStatus = 'partial'
    else cl.overallStatus = 'pending'
  }

  function resetChecklist(id: string) {
    const cl = checklists.value.find(c => c.id === id)
    if (!cl) return
    cl.items.forEach(i => { i.status = 'pending'; i.note = undefined; i.checkedAt = undefined })
    cl.overallStatus = 'pending'
    cl.updatedAt = now()
  }

  function removeChecklist(id: string) {
    checklists.value = checklists.value.filter(c => c.id !== id)
    if (activeChecklistId.value === id) {
      activeChecklistId.value = checklists.value[0]?.id ?? null
    }
  }

  return {
    checklists, activeChecklistId, active,
    activePassCount, activeFailCount, activePendingCount, isAllPass,
    createChecklist, getChecklist, getChecklistByTask, setActive,
    updateItem, updateActiveItem, toggleActiveItem,
    resetChecklist, removeChecklist,
  }
})
