/**
 * bootstrap.types.ts
 * Phase 10: Bootstrap development loop types
 */
export type BootstrapTaskType = 'bugfix' | 'ux' | 'workflow' | 'review' | 'release' | 'regression'
export type BootstrapTaskStatus = 'todo' | 'queued' | 'in_progress' | 'reviewing' | 'done' | 'blocked'
export type BootstrapTaskSource = 'beta_feedback' | 'self_host_gap' | 'manual'

export interface BootstrapTaskItem {
  id: string
  source: BootstrapTaskSource
  sourceId?: string
  title: string
  description: string
  type: BootstrapTaskType
  status: BootstrapTaskStatus
  relatedThreadId?: string
  relatedProjectId?: string
  priority: 'p0' | 'p1' | 'p2'
  createdAt: string
  updatedAt: string
}
