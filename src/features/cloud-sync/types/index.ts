/**
 * cloud-sync types — Phase 14
 * Unified cloud sync model for beta ops entities
 */

// ── Sync model ──

export type SyncStatus = 'local-only' | 'pending-upload' | 'synced' | 'sync-failed' | 'conflict'

export type ConflictState = 'none' | 'remote-newer' | 'local-newer' | 'merge-required'

export const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  'local-only': 'Local Only',
  'pending-upload': 'Pending Upload',
  synced: 'Synced',
  'sync-failed': 'Sync Failed',
  conflict: 'Conflict',
}

export const CONFLICT_STATE_LABELS: Record<ConflictState, string> = {
  none: '—',
  'remote-newer': 'Remote Newer',
  'local-newer': 'Local Newer',
  'merge-required': 'Merge Required',
}

// ── Syncable entity types ──

export type SyncEntityType =
  | 'beta_instance'
  | 'beta_user'
  | 'feedback'
  | 'issue_cluster'
  | 'bootstrap_task'
  | 'regression_result'
  | 'beta_iteration'
  | 'release_record'
  | 'quality_score'
  | 'release_plan'

export const SYNC_ENTITY_LABELS: Record<SyncEntityType, string> = {
  beta_instance: 'Beta Instance',
  beta_user: 'Beta User',
  feedback: 'Feedback',
  issue_cluster: 'Issue Cluster',
  bootstrap_task: 'Bootstrap Task',
  regression_result: 'Regression Result',
  beta_iteration: 'Beta Iteration',
  release_record: 'Release Record',
  quality_score: 'Quality Score',
  release_plan: 'Release Plan',
}

// ── Sync record ──

export interface SyncRecord {
  /** Stable client-side id */
  id: string
  entityType: SyncEntityType
  entityId: string
  /** Monotonic version for conflict detection */
  version: number
  updatedAt: string
  syncStatus: SyncStatus
  lastSyncAt: string | null
  conflictState: ConflictState
  /** Last known server timestamp for this record */
  remoteUpdatedAt: string | null
  /** Error message from last sync attempt */
  lastError: string | null
  /** Number of consecutive failures */
  retryCount: number
}

// ── Sync summary ──

export interface SyncSummary {
  totalRecords: number
  syncedCount: number
  pendingCount: number
  failedCount: number
  conflictCount: number
  lastFullSync: string | null
  isSyncing: boolean
}

// ── Remote endpoints config ──

export interface CloudSyncConfig {
  baseUrl: string
  syncEndpoint: string
  /** Default: https://ai.tadanpay.cn/lingstack/api */
  timeout: number
  enabled: boolean
}

export const DEFAULT_SYNC_CONFIG: CloudSyncConfig = {
  baseUrl: 'https://ai.tadanpay.cn',
  syncEndpoint: '/lingstack/api/sync',
  timeout: 15000,
  enabled: false, // disabled by default until server is ready
}
