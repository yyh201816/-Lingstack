import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  FeedbackItem, FeedbackSourceType, FeedbackSeverity,
  FeedbackReproducibility, RoutedStatus,
} from '../types'

const STORAGE_KEY = 'lingstack_feedback_v2'

function genId(): string {
  return 'fbk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}
function now(): string { return new Date().toISOString() }
function load<T>(k: string, d: T): T {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d } catch { return d }
}
function save(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
}

export const useFeedbackStore = defineStore('feedback', () => {
  const items = ref<FeedbackItem[]>(load(STORAGE_KEY, []))

  watch(items, v => save(STORAGE_KEY, v), { deep: true })

  const inboxItems = computed(() => items.value.filter(f => f.routedStatus === 'inbox'))
  const triagedItems = computed(() => items.value.filter(f => f.routedStatus === 'triaged'))
  const convertedItems = computed(() => items.value.filter(f => f.routedStatus === 'converted-to-task'))
  const ignoredItems = computed(() => items.value.filter(f => f.routedStatus === 'ignored'))
  const mergedItems = computed(() => items.value.filter(f => f.routedStatus === 'merged'))

  const inboxCount = computed(() => inboxItems.value.length)
  const triagedCount = computed(() => triagedItems.value.length)
  const criticalCount = computed(() => items.value.filter(f => f.severity === 'critical' && f.routedStatus !== 'ignored').length)
  const totalCount = computed(() => items.value.length)

  const feedbackByInstance = computed(() => {
    const map: Record<string, FeedbackItem[]> = {}
    for (const f of items.value) {
      const id = f.sourceInstanceId ?? '__unknown__'
      if (!map[id]) map[id] = []
      map[id].push(f)
    }
    return map
  })

  const feedbackByVersion = computed(() => {
    const map: Record<string, FeedbackItem[]> = {}
    for (const f of items.value) {
      const v = f.sourceVersion ?? '__unknown__'
      if (!map[v]) map[v] = []
      map[v].push(f)
    }
    return map
  })

  function addFeedback(opts: {
    sourceType: FeedbackSourceType
    sourceInstanceId?: string
    sourceVersion?: string
    title: string
    content: string
    tags?: string[]
    severity?: FeedbackSeverity
    reproducibility?: FeedbackReproducibility
    relatedThreadId?: string
    relatedTaskId?: string
  }): FeedbackItem {
    const item: FeedbackItem = {
      feedbackId: genId(),
      sourceType: opts.sourceType,
      sourceInstanceId: opts.sourceInstanceId,
      sourceVersion: opts.sourceVersion,
      title: opts.title,
      content: opts.content,
      tags: opts.tags ?? [],
      severity: opts.severity ?? 'medium',
      reproducibility: opts.reproducibility ?? 'unknown',
      relatedThreadId: opts.relatedThreadId,
      relatedTaskId: opts.relatedTaskId,
      createdAt: now(),
      routedStatus: 'inbox',
    }
    items.value.unshift(item)
    return item
  }

  function setRoutedStatus(id: string, status: RoutedStatus) {
    const f = items.value.find(x => x.feedbackId === id)
    if (!f) return
    f.routedStatus = status
    if (status === 'triaged') f.triagedAt = now()
    if (status === 'merged') f.mergedIntoId = id
  }

  function triageFeedback(id: string, note?: string) {
    const f = items.value.find(x => x.feedbackId === id)
    if (!f) return
    f.routedStatus = 'triaged'
    f.triagedAt = now()
    if (note) f.triageNote = note
  }

  function ignoreFeedback(id: string) {
    setRoutedStatus(id, 'ignored')
  }

  function convertToTask(id: string, taskId: string) {
    const f = items.value.find(x => x.feedbackId === id)
    if (!f) return
    f.routedStatus = 'converted-to-task'
    f.convertedTaskId = taskId
  }

  function mergeInto(fromId: string, intoId: string) {
    const f = items.value.find(x => x.feedbackId === fromId)
    if (!f) return
    f.routedStatus = 'merged'
    f.mergedIntoId = intoId
  }

  function updateSeverity(id: string, severity: FeedbackSeverity) {
    const f = items.value.find(x => x.feedbackId === id)
    if (f) f.severity = severity
  }

  function addTag(id: string, tag: string) {
    const f = items.value.find(x => x.feedbackId === id)
    if (f && !f.tags.includes(tag)) f.tags.push(tag)
  }

  function removeTag(id: string, tag: string) {
    const f = items.value.find(x => x.feedbackId === id)
    if (f) f.tags = f.tags.filter(t => t !== tag)
  }

  function linkToCluster(id: string, clusterId: string) {
    const f = items.value.find(x => x.feedbackId === id)
    if (f) f.relatedClusterId = clusterId
  }

  function removeFeedback(id: string) {
    items.value = items.value.filter(f => f.feedbackId !== id)
  }

  function getFeedback(id: string): FeedbackItem | undefined {
    return items.value.find(f => f.feedbackId === id)
  }

  function seedMockFeedback() {
    if (items.value.length > 0) return
    const mocks = [
      { source: 'in-app-user-feedback' as FeedbackSourceType, title: 'Thread list scroll lag on 200+ threads', content: 'When I have over 200 threads, the left sidebar scroll becomes very laggy. Needs virtualization.', tags: ['performance', 'ui'], severity: 'high' as FeedbackSeverity },
      { source: 'in-app-user-feedback' as FeedbackSourceType, title: 'Thread list scroll is too slow', content: 'Scrolling through the thread list is painfully slow with many threads.', tags: ['performance', 'ui'], severity: 'medium' as FeedbackSeverity },
      { source: 'beta-smoke-result' as FeedbackSourceType, title: 'Beta smoke: settings pane crashes on macOS', content: 'Opening settings on macOS 14 causes a white screen and unresponsive UI.', tags: ['crash', 'macos'], severity: 'critical' as FeedbackSeverity },
      { source: 'failed-self-heal-task' as FeedbackSourceType, title: 'Self-heal: project scan timeout on large repos', content: 'Self-repair scan timed out after 5 minutes on a repo with 10k files.', tags: ['self-heal', 'performance'], severity: 'high' as FeedbackSeverity },
      { source: 'update-failure' as FeedbackSourceType, title: 'Update from 0.1.6 to 0.1.7 failed', content: 'The updater got stuck at 67 percent and never completed.', tags: ['updater'], severity: 'high' as FeedbackSeverity },
    ]
    for (const m of mocks) {
      addFeedback({
        sourceType: m.source,
        sourceVersion: '0.1.7',
        title: m.title,
        content: m.content,
        tags: m.tags,
        severity: m.severity,
        sourceInstanceId: 'inst_mock_1',
      })
    }
  }

  return {
    items,
    inboxItems, triagedItems, convertedItems, ignoredItems, mergedItems,
    inboxCount, triagedCount, criticalCount, totalCount,
    feedbackByInstance, feedbackByVersion,
    addFeedback, setRoutedStatus, triageFeedback, ignoreFeedback,
    convertToTask, mergeInto, updateSeverity, addTag, removeTag,
    linkToCluster, removeFeedback, getFeedback,
    seedMockFeedback,
  }
})
