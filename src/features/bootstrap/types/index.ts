/**
 * bootstrap types — Phase 12 enhanced
 * Self-bootstrap task queue, kanban board, task candidates
 */

// ── Source ──
export type BootstrapTaskSource =
  | 'user-feedback'
  | 'self-heal-scan'
  | 'beta-smoke-fail'
  | 'update-regression'
  | 'manual-create'

// ── Status ──
export type BootstrapTaskStatus =
  | 'backlog'
  | 'ready'
  | 'running'
  | 'review'
  | 'blocked'
  | 'verified'
  | 'released'
  | 'archived'

// ── Severity / Priority ──
export type BootstrapTaskSeverity = 'critical' | 'high' | 'medium' | 'low'
export type BootstrapTaskPriority = 'p0' | 'p1' | 'p2' | 'p3'

// ── Task Type ──
export type BootstrapTaskType =
  | 'bugfix'
  | 'ux'
  | 'workflow'
  | 'review'
  | 'release'
  | 'regression'
  | 'docs'
  | 'refactor'
  | 'ci-cd'

// ── Assignee ──
export type BootstrapAssigneeType = 'agent' | 'human' | 'hybrid'

// ── Regression Checklist ──
export interface RegressionCheckItem {
  key: string
  label: string
  checked: boolean
  note?: string
  checkedAt?: string
}

export interface RegressionChecklist {
  id: string
  taskId: string
  items: RegressionCheckItem[]
  status: 'pending' | 'partial' | 'pass' | 'fail'
  createdAt: string
  updatedAt: string
}

// ── Task Item ──
export interface BootstrapTaskItem {
  taskId: string
  source: BootstrapTaskSource
  sourceThreadId?: string
  sourceProjectId?: string
  title: string
  description: string
  targetScope?: string
  type: BootstrapTaskType
  severity: BootstrapTaskSeverity
  priority: BootstrapTaskPriority
  status: BootstrapTaskStatus
  assigneeType: BootstrapAssigneeType
  relatedThreadId?: string
  relatedProjectId?: string
  regressionChecklistId?: string
  releaseImpact?: string
  resultSummary?: string
  createdAt: string
  updatedAt: string
  startedAt?: string
  finishedAt?: string
}

// ── Task Candidate (auto-generated from threads / regression / feedback) ──
export type TaskCandidateSource =
  | 'thread-summary'
  | 'failed-task'
  | 'blocked-task'
  | 'regression-fail'
  | 'beta-smoke-issue'
  | 'user-feedback'

export interface TaskCandidate {
  candidateId: string
  sourceType: TaskCandidateSource
  title: string
  reason: string
  suggestedPriority: BootstrapTaskPriority
  relatedThreadId?: string
  relatedVersion?: string
  createdAt: string
  ignored?: boolean
}

// ── Status helpers ──
export const STATUS_LABELS: Record<BootstrapTaskStatus, string> = {
  backlog: 'Backlog',
  ready: 'Ready',
  running: 'Running',
  review: 'Review',
  blocked: 'Blocked',
  verified: 'Verified',
  released: 'Released',
  archived: 'Archived',
}

export const SOURCE_LABELS: Record<BootstrapTaskSource, string> = {
  'user-feedback': 'User Feedback',
  'self-heal-scan': 'Self-Heal Scan',
  'beta-smoke-fail': 'Beta Smoke Fail',
  'update-regression': 'Update Regression',
  'manual-create': 'Manual',
}

export const KANBAN_COLUMNS: { id: BootstrapTaskStatus; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'running', label: 'Running' },
  { id: 'review', label: 'Review' },
  { id: 'released', label: 'Released' },
]

// ── Legacy compat (re-export old type as alias) ──
export type BootstrapTaskSourceLegacy = 'beta_feedback' | 'self_host_gap' | 'manual'
