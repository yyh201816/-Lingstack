import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { BootstrapTaskItem, BootstrapTaskStatus, BootstrapTaskType, BootstrapTaskSource } from '../bootstrap.types'

const STORAGE_KEY = 'lingstack_bootstrap_tasks'

function genId(): string {
  return 'bt_' + Date.now() + '_' + Math.random().toString(36).slice(2,7)
}
function now(): string { return new Date().toISOString() }

function load(): BootstrapTaskItem[] {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}
function save(data: BootstrapTaskItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

export const useBootstrapStore = defineStore('bootstrap', () => {
  const tasks = ref<BootstrapTaskItem[]>(load())
  const loading = ref(false)

  watch(tasks, (v) => save(v), { deep: true })

  const todoCount = computed(() => tasks.value.filter(t => t.status === 'todo').length)
  const queued = computed(() => tasks.value.filter(t => t.status === 'queued'))
  const inProgress = computed(() => tasks.value.filter(t => t.status === 'in_progress'))
  const blocked = computed(() => tasks.value.filter(t => t.status === 'blocked'))
  const doneItems = computed(() => tasks.value.filter(t => t.status === 'done'))
  const activeTask = computed(() => tasks.value.find(t => t.status === 'in_progress') ?? null)
  const queueSize = computed(() => tasks.value.filter(t => t.status !== 'done' && t.status !== 'blocked').length)
  const p0Items = computed(() => tasks.value.filter(t => t.priority === 'p0' && t.status !== 'done'))

  function addTask(
    title: string, description: string, type: BootstrapTaskType,
    source: BootstrapTaskSource, priority: 'p0'|'p1'|'p2' = 'p1',
    opts?: { sourceId?: string; threadId?: string; projectId?: string },
  ): BootstrapTaskItem {
    const item: BootstrapTaskItem = {
      id: genId(), source, sourceId: opts?.sourceId,
      title, description, type, status: 'todo',
      relatedThreadId: opts?.threadId, relatedProjectId: opts?.projectId,
      priority, createdAt: now(), updatedAt: now(),
    }
    tasks.value.unshift(item)
    return item
  }

  function updateTask(id: string, patch: Partial<Pick<BootstrapTaskItem, 'title'|'description'|'type'|'priority'>>) {
    const t = tasks.value.find(x => x.id === id)
    if (t) { Object.assign(t, patch); t.updatedAt = now() }
  }

  function setStatus(id: string, status: BootstrapTaskStatus) {
    const t = tasks.value.find(x => x.id === id)
    if (t) { t.status = status; t.updatedAt = now() }
  }

  function queueTask(id: string) { setStatus(id, 'queued') }
  function startTask(id: string) { setStatus(id, 'in_progress') }
  function markReviewing(id: string) { setStatus(id, 'reviewing') }
  function markDone(id: string) { setStatus(id, 'done') }
  function markBlocked(id: string) { setStatus(id, 'blocked') }

  function attachThread(taskId: string, threadId: string) {
    const t = tasks.value.find(x => x.id === taskId)
    if (t) { t.relatedThreadId = threadId; t.updatedAt = now() }
  }

  function deriveFromFeedback(feedbackId: string, title: string, description: string, type: BootstrapTaskType, priority: 'p0'|'p1'|'p2' = 'p1') {
    return addTask(title, description, type, 'beta_feedback', priority, { sourceId: feedbackId })
  }

  function deriveFromSelfHostGap(gapId: string, title: string, description: string, priority: 'p0'|'p1'|'p2' = 'p1') {
    return addTask(title, description, 'workflow', 'self_host_gap', priority, { sourceId: gapId })
  }

  function removeTask(id: string) {
    tasks.value = tasks.value.filter(t => t.id !== id)
  }

  function clearDone() {
    tasks.value = tasks.value.filter(t => t.status !== 'done')
  }

  return {
    tasks, loading, todoCount, queued, inProgress, blocked, doneItems, activeTask, queueSize, p0Items,
    addTask, updateTask, setStatus, queueTask, startTask, markReviewing, markDone, markBlocked,
    attachThread, deriveFromFeedback, deriveFromSelfHostGap, removeTask, clearDone,
  }
})
