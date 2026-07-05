/**
 * bootstrap-task.store.ts — Phase 12 enhanced
 * Self-bootstrap task queue with kanban columns, regression binding, candidates
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  BootstrapTaskItem, BootstrapTaskStatus, BootstrapTaskSource,
  BootstrapTaskType, BootstrapTaskSeverity, BootstrapTaskPriority,
  BootstrapAssigneeType, TaskCandidate, TaskCandidateSource,
} from '../types'

const TASK_KEY = 'lingstack_bootstrap_tasks_v2'
const CANDIDATE_KEY = 'lingstack_task_candidates'

function genId(prefix: string): string {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}
function now(): string { return new Date().toISOString() }
function load<T>(k: string, d: T): T {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d } catch { return d }
}
function save(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
}

export const useBootstrapTaskStore = defineStore('bootstrap-task', () => {
  const tasks = ref<BootstrapTaskItem[]>(load(TASK_KEY, []))
  const candidates = ref<TaskCandidate[]>(load(CANDIDATE_KEY, []))

  watch(tasks, v => save(TASK_KEY, v), { deep: true })
  watch(candidates, v => save(CANDIDATE_KEY, v), { deep: true })

  // ── Computed: Kanban columns ──
  const backlogItems = computed(() => tasks.value.filter(t => t.status === 'backlog'))
  const readyItems = computed(() => tasks.value.filter(t => t.status === 'ready'))
  const runningItems = computed(() => tasks.value.filter(t => t.status === 'running'))
  const reviewItems = computed(() => tasks.value.filter(t => t.status === 'review'))
  const blockedItems = computed(() => tasks.value.filter(t => t.status === 'blocked'))
  const verifiedItems = computed(() => tasks.value.filter(t => t.status === 'verified'))
  const releasedItems = computed(() => tasks.value.filter(t => t.status === 'released'))
  const archivedItems = computed(() => tasks.value.filter(t => t.status === 'archived'))

  const activeCount = computed(() =>
    tasks.value.filter(t => !['released', 'archived'].includes(t.status)).length
  )
  const p0Blockers = computed(() =>
    tasks.value.filter(t => t.priority === 'p0' && !['released', 'archived'].includes(t.status))
  )

  // ── CRUD ──
  function addTask(opts: {
    title: string
    description: string
    type: BootstrapTaskType
    source: BootstrapTaskSource
    priority?: BootstrapTaskPriority
    severity?: BootstrapTaskSeverity
    assigneeType?: BootstrapAssigneeType
    sourceThreadId?: string
    sourceProjectId?: string
    targetScope?: string
    relatedThreadId?: string
    relatedProjectId?: string
    releaseImpact?: string
  }): BootstrapTaskItem {
    const item: BootstrapTaskItem = {
      taskId: genId('bt'),
      source: opts.source,
      sourceThreadId: opts.sourceThreadId,
      sourceProjectId: opts.sourceProjectId,
      title: opts.title,
      description: opts.description,
      targetScope: opts.targetScope,
      type: opts.type,
      severity: opts.severity ?? 'medium',
      priority: opts.priority ?? 'p1',
      status: 'backlog',
      assigneeType: opts.assigneeType ?? 'agent',
      relatedThreadId: opts.relatedThreadId,
      relatedProjectId: opts.relatedProjectId,
      releaseImpact: opts.releaseImpact,
      createdAt: now(),
      updatedAt: now(),
    }
    tasks.value.unshift(item)
    return item
  }

  function updateTask(taskId: string, patch: Partial<Pick<BootstrapTaskItem,
    'title' | 'description' | 'type' | 'priority' | 'severity' | 'targetScope' | 'releaseImpact' | 'resultSummary'
  >>) {
    const t = tasks.value.find(x => x.taskId === taskId)
    if (t) { Object.assign(t, patch); t.updatedAt = now() }
  }

  function setStatus(taskId: string, status: BootstrapTaskStatus) {
    const t = tasks.value.find(x => x.taskId === taskId)
    if (!t) return
    t.status = status
    t.updatedAt = now()
    if (status === 'running' && !t.startedAt) t.startedAt = now()
    if (status === 'verified' || status === 'released') t.finishedAt = now()
  }

  function moveToBacklog(id: string) { setStatus(id, 'backlog') }
  function markReady(id: string) { setStatus(id, 'ready') }
  function startTask(id: string) { setStatus(id, 'running') }
  function markReview(id: string) { setStatus(id, 'review') }
  function markBlocked(id: string) { setStatus(id, 'blocked') }
  function markVerified(id: string) { setStatus(id, 'verified') }
  function markReleased(id: string) { setStatus(id, 'released') }
  function archiveTask(id: string) { setStatus(id, 'archived') }

  function attachThread(taskId: string, threadId: string) {
    const t = tasks.value.find(x => x.taskId === taskId)
    if (t) { t.relatedThreadId = threadId; t.updatedAt = now() }
  }

  function bindRegressionChecklist(taskId: string, checklistId: string) {
    const t = tasks.value.find(x => x.taskId === taskId)
    if (t) { t.regressionChecklistId = checklistId; t.updatedAt = now() }
  }

  function removeTask(taskId: string) {
    tasks.value = tasks.value.filter(t => t.taskId !== taskId)
  }

  function getTask(taskId: string): BootstrapTaskItem | undefined {
    return tasks.value.find(t => t.taskId === taskId)
  }

  // ── Task Candidates ──
  function addCandidate(opts: {
    sourceType: TaskCandidateSource
    title: string
    reason: string
    suggestedPriority?: BootstrapTaskPriority
    relatedThreadId?: string
    relatedVersion?: string
  }): TaskCandidate {
    const c: TaskCandidate = {
      candidateId: genId('tc'),
      sourceType: opts.sourceType,
      title: opts.title,
      reason: opts.reason,
      suggestedPriority: opts.suggestedPriority ?? 'p1',
      relatedThreadId: opts.relatedThreadId,
      relatedVersion: opts.relatedVersion,
      createdAt: now(),
    }
    candidates.value.unshift(c)
    return c
  }

  function ignoreCandidate(candidateId: string) {
    const c = candidates.value.find(x => x.candidateId === candidateId)
    if (c) c.ignored = true
  }

  function convertCandidate(candidateId: string): BootstrapTaskItem | undefined {
    const c = candidates.value.find(x => x.candidateId === candidateId)
    if (!c) return undefined
    const task = addTask({
      title: c.title,
      description: c.reason,
      type: candidateSourceToType(c.sourceType),
      source: 'user-feedback',
      priority: c.suggestedPriority,
      relatedThreadId: c.relatedThreadId,
    })
    c.ignored = true
    return task
  }

  function candidateSourceToType(s: TaskCandidateSource): BootstrapTaskType {
    switch (s) {
      case 'thread-summary': return 'workflow'
      case 'failed-task': return 'bugfix'
      case 'blocked-task': return 'bugfix'
      case 'regression-fail': return 'regression'
      case 'beta-smoke-issue': return 'bugfix'
      case 'user-feedback': return 'workflow'
    }
  }

  // ── Auto-generate candidates from threads ──
  function generateCandidatesFromThread(threadId: string, summary: string, hasErrors: boolean) {
    if (hasErrors) {
      addCandidate({
        sourceType: 'failed-task',
        title: `Thread ${threadId.slice(-6)}: Review failures`,
        reason: summary,
        relatedThreadId: threadId,
        suggestedPriority: 'p1',
      })
    }
    if (summary.length > 10) {
      addCandidate({
        sourceType: 'thread-summary',
        title: `Thread ${threadId.slice(-6)}: ${summary.slice(0, 60)}`,
        reason: summary,
        relatedThreadId: threadId,
        suggestedPriority: 'p2',
      })
    }
  }

  function clearDone() {
    tasks.value = tasks.value.filter(t => t.status !== 'archived')
  }

  return {
    tasks, candidates,
    backlogItems, readyItems, runningItems, reviewItems,
    blockedItems, verifiedItems, releasedItems, archivedItems,
    activeCount, p0Blockers,
    addTask, updateTask, setStatus,
    moveToBacklog, markReady, startTask, markReview, markBlocked,
    markVerified, markReleased, archiveTask,
    attachThread, bindRegressionChecklist, removeTask, getTask, clearDone,
    addCandidate, ignoreCandidate, convertCandidate,
    generateCandidatesFromThread,
  }
})
