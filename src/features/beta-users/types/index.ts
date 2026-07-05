/**
 * beta-users types — Phase 14
 * Internal beta user management
 */

export type BetaUserRole = 'owner' | 'operator' | 'tester' | 'observer'

export type BetaUserCohort =
  | 'internal-core'
  | 'internal-dev'
  | 'trusted-beta'
  | 'wider-beta'

export type BetaUserStatus = 'active' | 'paused' | 'invited' | 'disabled'

export interface BetaUser {
  betaUserId: string
  displayName: string
  emailOrAlias: string
  role: BetaUserRole
  cohort: BetaUserCohort
  status: BetaUserStatus
  joinedAt: string
  lastActiveAt: string
  boundInstanceIds: string[]
  currentVersion: string
  feedbackCount: number
  notes: string
}

export const BETA_USER_ROLE_LABELS: Record<BetaUserRole, string> = {
  owner: 'Owner',
  operator: 'Operator',
  tester: 'Tester',
  observer: 'Observer',
}

export const BETA_USER_COHORT_LABELS: Record<BetaUserCohort, string> = {
  'internal-core': 'Internal Core',
  'internal-dev': 'Internal Dev',
  'trusted-beta': 'Trusted Beta',
  'wider-beta': 'Wider Beta',
}

export const BETA_USER_STATUS_LABELS: Record<BetaUserStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  invited: 'Invited',
  disabled: 'Disabled',
}
