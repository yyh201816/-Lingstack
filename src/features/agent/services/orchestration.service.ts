import { useOrchestrationStore } from '../store/orchestration.store'
import { useThreadSessionStore } from '@/features/threads/store/thread-session.store'
import type { OrchestrationStepType } from '../types/orchestration.types'

export const stepTypeLabels: Record<string, string> = {
  plan: 'Planning',
  context: 'Gathering Context',
  tool: 'Running Tool',
  review: 'Review',
  goal: 'Goal Update',
  automation: 'Automation',
  approval: 'Awaiting Approval',
  done: 'Completed',
  failed: 'Failed',
}

/** Record an orchestration event as a system message in the thread timeline */
export function recordOrchestrationEvent(
  threadId: string,
  event: string,
  detail?: string,
): void {
  try {
    const sessionStore = useThreadSessionStore()
    const content = detail ? `[Agent] ${event}: ${detail}` : `[Agent] ${event}`
    sessionStore.appendMessage(threadId, 'system', content, 'system')
  } catch { /* store not ready */ }
}

/** Create and start an orchestration step */
export function runOrchestrationStep(
  threadId: string,
  stepType: OrchestrationStepType,
  title: string,
  detail?: string,
): string {
  const orchStore = useOrchestrationStore()
  const step = orchStore.addStep(threadId, stepType, title, detail)
  orchStore.startStep(threadId, step.id)
  recordOrchestrationEvent(threadId, `${stepTypeLabels[stepType] || stepType} started`, title)
  return step.id
}

/** Complete an orchestration step */
export function completeOrchestrationStep(
  threadId: string,
  stepId: string,
  summary?: string,
): void {
  const orchStore = useOrchestrationStore()
  orchStore.finishStep(threadId, stepId)
  recordOrchestrationEvent(threadId, 'Step completed', summary)
}

/** Fail an orchestration step */
export function failOrchestrationStep(
  threadId: string,
  stepId: string,
  reason?: string,
): void {
  const orchStore = useOrchestrationStore()
  orchStore.failStep(threadId, stepId)
  recordOrchestrationEvent(threadId, 'Step failed', reason)
}

/** Initialize orchestration for a thread and set to running */
export function startOrchestration(threadId: string): void {
  const orchStore = useOrchestrationStore()
  orchStore.initThreadOrchestration(threadId)
  orchStore.setStatus(threadId, 'running')
  recordOrchestrationEvent(threadId, 'Orchestration started')
}

/** Mark orchestration as complete */
export function finishOrchestration(threadId: string, summary?: string): void {
  const orchStore = useOrchestrationStore()
  orchStore.setStatus(threadId, 'done')
  recordOrchestrationEvent(threadId, 'Orchestration completed', summary)
}
