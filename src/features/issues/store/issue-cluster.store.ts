import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { IssueCluster, ClusterStatus } from '../types'
import { generateFingerprint } from '../types'

const STORAGE_KEY = 'lingstack_issue_clusters'

function genId(): string {
  return 'clu_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}
function now(): string { return new Date().toISOString() }
function load<T>(k: string, d: T): T {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d } catch { return d }
}
function save(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
}

export const useIssueClusterStore = defineStore('issue-cluster', () => {
  const clusters = ref<IssueCluster[]>(load(STORAGE_KEY, []))

  watch(clusters, v => save(STORAGE_KEY, v), { deep: true })

  const observingClusters = computed(() => clusters.value.filter(c => c.status === 'observing'))
  const confirmedClusters = computed(() => clusters.value.filter(c => c.status === 'confirmed'))
  const fixingClusters = computed(() => clusters.value.filter(c => c.status === 'fixing'))
  const verifiedClusters = computed(() => clusters.value.filter(c => c.status === 'verified'))
  const closedClusters = computed(() => clusters.value.filter(c => c.status === 'closed'))
  const activeClusters = computed(() => clusters.value.filter(c => c.status !== 'closed'))

  const totalClusters = computed(() => clusters.value.length)
  const highSeverityClusters = computed(() =>
    clusters.value.filter(c => (c.severity === 'critical' || c.severity === 'high') && c.status !== 'closed')
  )

  function findOrCreateCluster(opts: {
    title: string
    tags: string[]
    feedbackId: string
    instanceId?: string
    version?: string
    severity?: IssueCluster['severity']
  }): IssueCluster {
    const fp = generateFingerprint(opts.title, opts.tags)

    const existing = clusters.value.find(c => c.fingerprint === fp)
    if (existing) {
      if (!existing.relatedFeedbackIds.includes(opts.feedbackId)) {
        existing.relatedFeedbackIds.push(opts.feedbackId)
      }
      if (opts.instanceId && !existing.relatedInstanceIds.includes(opts.instanceId)) {
        existing.relatedInstanceIds.push(opts.instanceId)
      }
      if (opts.version && !existing.relatedVersions.includes(opts.version)) {
        existing.relatedVersions.push(opts.version)
      }
      existing.duplicateCount = existing.relatedFeedbackIds.length
      existing.updatedAt = now()
      if (opts.version) existing.lastSeenVersion = opts.version
      return existing
    }

    const cluster: IssueCluster = {
      clusterId: genId(),
      title: opts.title,
      fingerprint: fp,
      relatedFeedbackIds: [opts.feedbackId],
      relatedInstanceIds: opts.instanceId ? [opts.instanceId] : [],
      relatedVersions: opts.version ? [opts.version] : [],
      relatedTaskIds: [],
      severity: opts.severity ?? 'medium',
      status: 'observing',
      createdAt: now(),
      updatedAt: now(),
      duplicateCount: 1,
      firstSeenVersion: opts.version,
      lastSeenVersion: opts.version,
    }
    clusters.value.unshift(cluster)
    return cluster
  }

  function addFeedbackToCluster(clusterId: string, feedbackId: string, instanceId?: string, version?: string) {
    const c = clusters.value.find(x => x.clusterId === clusterId)
    if (!c) return
    if (!c.relatedFeedbackIds.includes(feedbackId)) {
      c.relatedFeedbackIds.push(feedbackId)
      c.duplicateCount = c.relatedFeedbackIds.length
    }
    if (instanceId && !c.relatedInstanceIds.includes(instanceId)) {
      c.relatedInstanceIds.push(instanceId)
    }
    if (version && !c.relatedVersions.includes(version)) {
      c.relatedVersions.push(version)
    }
    c.updatedAt = now()
    if (version) c.lastSeenVersion = version
  }

  function setStatus(clusterId: string, status: ClusterStatus) {
    const c = clusters.value.find(x => x.clusterId === clusterId)
    if (!c) return
    c.status = status
    c.updatedAt = now()
  }

  function linkTask(clusterId: string, taskId: string) {
    const c = clusters.value.find(x => x.clusterId === clusterId)
    if (!c) return
    if (!c.relatedTaskIds.includes(taskId)) {
      c.relatedTaskIds.push(taskId)
    }
    c.updatedAt = now()
  }

  function updateSeverity(clusterId: string, severity: IssueCluster['severity']) {
    const c = clusters.value.find(x => x.clusterId === clusterId)
    if (c) { c.severity = severity; c.updatedAt = now() }
  }

  function setNote(clusterId: string, note: string) {
    const c = clusters.value.find(x => x.clusterId === clusterId)
    if (c) { c.note = note; c.updatedAt = now() }
  }

  function getCluster(clusterId: string): IssueCluster | undefined {
    return clusters.value.find(c => c.clusterId === clusterId)
  }

  function removeCluster(clusterId: string) {
    clusters.value = clusters.value.filter(c => c.clusterId !== clusterId)
  }

  return {
    clusters,
    observingClusters, confirmedClusters, fixingClusters, verifiedClusters, closedClusters,
    activeClusters, totalClusters, highSeverityClusters,
    findOrCreateCluster, addFeedbackToCluster, setStatus, linkTask,
    updateSeverity, setNote, getCluster, removeCluster,
  }
})
