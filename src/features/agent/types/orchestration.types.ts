export type OrchestrationStepType =
  | 'plan'
  | 'context'
  | 'tool'
  | 'review'
  | 'goal'
  | 'automation'
  | 'approval'
  | 'done'
  | 'failed'

export type OrchestrationStatus =
  | 'idle'
  | 'running'
  | 'waiting_input'
  | 'waiting_approval'
  | 'paused'
  | 'done'
  | 'failed'

export interface OrchestrationStep {
  id: string
  threadId: string
  type: OrchestrationStepType
  title: string
  detail?: string
  status: 'pending' | 'running' | 'done' | 'failed' | 'skipped'
  createdAt: string
  updatedAt: string
}

export interface ThreadOrchestrationState {
  threadId: string
  status: OrchestrationStatus
  currentStepId?: string
  steps: OrchestrationStep[]
  lastUpdatedAt: string
}
