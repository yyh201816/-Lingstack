export type AutomationStatus = 'enabled' | 'disabled'
export type AutomationRunStatus = 'queued' | 'running' | 'done' | 'failed' | 'cancelled'

export interface AutomationItem {
  id: string
  name: string
  prompt: string
  schedule: string
  enabled: boolean
  projectId?: string
  threadMode: 'local' | 'worktree' | 'cloud'
  createdAt: string
  updatedAt: string
}

export interface AutomationRunRecord {
  id: string
  automationId: string
  status: AutomationRunStatus
  startedAt?: string
  finishedAt?: string
  summary?: string
  threadId?: string
  errorMessage?: string
}