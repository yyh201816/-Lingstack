import { useBootstrapStore } from '../store/bootstrap.store'
import type { BootstrapTaskType } from '../bootstrap.types'

export interface FeedbackToTaskInput {
  feedbackId: string
  title: string
  description: string
  feedbackType: string  // bug | ux | feature | performance | other
}

export function planFromFeedback(input: FeedbackToTaskInput) {
  const store = useBootstrapStore()
  const type = mapFeedbackType(input.feedbackType)
  return store.deriveFromFeedback(input.feedbackId, input.title, input.description, type)
}

export function planFromSelfHostGap(gapId: string, label: string, detail: string) {
  const store = useBootstrapStore()
  return store.deriveFromSelfHostGap(gapId, label, detail)
}

function mapFeedbackType(ft: string): BootstrapTaskType {
  switch (ft) {
    case 'bug': return 'bugfix'
    case 'ux': return 'ux'
    case 'feature': return 'workflow'
    case 'performance': return 'regression'
    default: return 'workflow'
  }
}
