/**
 * Beta Instance types - Phase 13
 * Multi-machine beta testing instance model
 */

export type RuntimeStatus = 'online' | 'offline' | 'stale' | 'crash-recovered'

export type UpdaterStatus = 'up-to-date' | 'update-available' | 'updating' | 'failed'

export interface BetaInstance {
  instanceId: string
  deviceName: string
  userAlias: string
  osVersion: string
  appVersion: string
  channel: 'beta' | 'canary' | 'stable'
  installAt: string
  lastSeenAt: string
  runtimeStatus: RuntimeStatus
  updaterStatus: UpdaterStatus
  latestFeedbackAt?: string
  latestTaskAt?: string
  currentProjectHint?: string
  healthScore: number
  notes?: string
}

export const RUNTIME_STATUS_LABELS: Record<RuntimeStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  stale: 'Stale',
  'crash-recovered': 'Crash Recovered',
}

export const UPDATER_STATUS_LABELS: Record<UpdaterStatus, string> = {
  'up-to-date': 'Up to date',
  'update-available': 'Update available',
  updating: 'Updating',
  failed: 'Update failed',
}
