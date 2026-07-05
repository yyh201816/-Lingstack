export type GoalStatus = 'inactive' | 'active' | 'paused' | 'done' | 'blocked'

export interface GoalItem {
  id: string
  threadId: string
  title: string
  objective: string
  status: GoalStatus
  progressPercent: number
  createdAt: string
  updatedAt: string
  currentSummary?: string
}
