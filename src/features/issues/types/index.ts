/**
 * Issue Cluster types - Phase 13
 * Problem clustering and duplicate feedback merging
 */

export type ClusterStatus = 'observing' | 'confirmed' | 'fixing' | 'verified' | 'closed'

export interface IssueCluster {
  clusterId: string
  title: string
  fingerprint: string
  relatedFeedbackIds: string[]
  relatedInstanceIds: string[]
  relatedVersions: string[]
  relatedTaskIds: string[]
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: ClusterStatus
  createdAt: string
  updatedAt: string
  duplicateCount: number
  firstSeenVersion?: string
  lastSeenVersion?: string
  note?: string
}

export const CLUSTER_STATUS_LABELS: Record<ClusterStatus, string> = {
  observing: 'Observing',
  confirmed: 'Confirmed',
  fixing: 'Fixing',
  verified: 'Verified',
  closed: 'Closed',
}

export function generateFingerprint(title: string, tags: string[]): string {
  const normalized = title.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
  const tagPart = [...tags].sort().join('|')
  return `fp:${normalized.slice(0, 60)}|${tagPart}`
}
