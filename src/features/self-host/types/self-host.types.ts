export type SelfHostCapabilityStatus = 'todo' | 'partial' | 'ready' | 'blocked'

export interface SelfHostCapabilityItem {
  id: string
  name: string
  description: string
  status: SelfHostCapabilityStatus
  evidence?: string
}

export interface SelfHostPlanStage {
  id: 'A' | 'B' | 'C'
  title: string
  objective: string
  lingstackScope: string[]
  traeScope: string[]
  status: 'todo' | 'in_progress' | 'done'
}
