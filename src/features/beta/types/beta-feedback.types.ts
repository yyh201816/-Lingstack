export type BetaFeedbackType = 'bug' | 'ux' | 'feature' | 'performance' | 'other'
export type BetaFeedbackStatus = 'draft' | 'submitted' | 'synced' | 'failed'

export interface BetaFeedbackItem {
  id: string
  type: BetaFeedbackType
  title: string
  description: string
  currentThreadId?: string
  currentProjectId?: string
  appVersion: string
  createdAt: string
  status: BetaFeedbackStatus
  tags?: string[]
  includeRuntimeState?: boolean
  includeActiveThreadSummary?: boolean
  runtimeSnapshot?: {
    activeView?: string
    modelName?: string
    theme?: string
    openTabCount?: number
  }
}

export interface BetaVersionInfo {
  appVersion: string
  buildChannel: 'beta' | 'internal' | 'stable'
  tauriVersion?: string
  lastUpdateCheck?: string
  updateAvailable: boolean
}
