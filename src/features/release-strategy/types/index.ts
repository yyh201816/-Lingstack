/**
 * release-strategy types — Phase 14
 * Release channel, strategy, and staged rollout management
 */

// ── Release Channel ──

export type ReleaseChannel =
  | 'nightly'
  | 'alpha'
  | 'beta'
  | 'rc'
  | 'stable-internal'

export const RELEASE_CHANNEL_LABELS: Record<ReleaseChannel, string> = {
  nightly: 'Nightly',
  alpha: 'Alpha',
  beta: 'Beta',
  rc: 'RC',
  'stable-internal': 'Stable Internal',
}

// ── Release Strategy ──

export type ReleaseStrategyType =
  | 'all-users'
  | 'selected-cohort'
  | 'selected-users'
  | 'selected-instances'
  | 'staged-rollout'

export const RELEASE_STRATEGY_LABELS: Record<ReleaseStrategyType, string> = {
  'all-users': 'All Users',
  'selected-cohort': 'Selected Cohort',
  'selected-users': 'Selected Users',
  'selected-instances': 'Selected Instances',
  'staged-rollout': 'Staged Rollout',
}

// ── Rollout State ──

export type RolloutState =
  | 'planned'
  | 'active'
  | 'paused'
  | 'completed'
  | 'aborted'

export const ROLLOUT_STATE_LABELS: Record<RolloutState, string> = {
  planned: 'Planned',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  aborted: 'Aborted',
}

// ── Release Plan ──

export interface ReleasePlan {
  releasePlanId: string
  version: string
  channel: ReleaseChannel
  strategyType: ReleaseStrategyType
  /** Cohort ids when strategy is selected-cohort */
  targetCohorts: string[]
  /** User ids when strategy is selected-users */
  targetUsers: string[]
  /** Instance ids when strategy is selected-instances */
  targetInstances: string[]
  /** 0-100, used when strategy is staged-rollout */
  rolloutPercent: number
  status: RolloutState
  notes: string
  iterationId?: string
  regressionChecklistId?: string
  createdAt: string
  activatedAt: string | null
  pausedAt: string | null
  completedAt: string | null
  updatedAt: string
}

// ── Updater manifest per channel ──

/** Channel-aware updater manifest path convention */
export function channelManifestPath(channel: ReleaseChannel): string {
  return `/updates/${channel}/latest.json`
}

/** Channel-aware release artifact path convention */
export function channelReleasePath(channel: ReleaseChannel, version: string, fileName: string): string {
  return `/updates/${channel}/${version}/${fileName}`
}

// ── Release decision from Phase 10 gate ──

export type ReleaseGateDecision = 'ready' | 'partial' | 'blocked'

export interface ReleaseDecision {
  decision: ReleaseGateDecision
  reasons: string[]
  blockedBy: string[]
  recommendedAction: 'publish' | 'continue-testing' | 'fix-blockers' | 'rollback'
}

export const RELEASE_GATE_DECISION_LABELS: Record<ReleaseGateDecision, string> = {
  ready: 'Ready',
  partial: 'Partial',
  blocked: 'Blocked',
}
