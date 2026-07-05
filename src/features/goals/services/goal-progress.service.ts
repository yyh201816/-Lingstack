import { useThreadSessionStore } from '@/features/threads/store/thread-session.store'
import { useGoalStore } from '../store/goal.store'

export type GoalEvent = 'created' | 'paused' | 'resumed' | 'completed' | 'blocked'

const eventLabels: Record<GoalEvent, string> = {
  created: 'Goal created',
  paused: 'Goal paused',
  resumed: 'Goal resumed',
  completed: 'Goal completed',
  blocked: 'Goal blocked',
}

function buildContent(event: GoalEvent, title: string, detail?: string): string {
  const label = eventLabels[event]
  return detail ? `${label}: "${title}" — ${detail}` : `${label}: "${title}"`
}

export function recordGoalEvent(
  goalId: string,
  event: GoalEvent,
  detail?: string,
): void {
  const goalStore = useGoalStore()
  const sessionStore = useThreadSessionStore()

  const goal = goalStore.goals.find((g) => g.id === goalId)
  if (!goal) return

  const content = buildContent(event, goal.title, detail)
  sessionStore.appendMessage(goal.threadId, 'goal', content, 'system', {
    goalId,
    event,
  })
}

export function advanceGoal(
  goalId: string,
  percent: number,
  summary?: string,
): void {
  const goalStore = useGoalStore()
  const goal = goalStore.goals.find((g) => g.id === goalId)
  if (!goal) return

  const prevPercent = goal.progressPercent
  goalStore.updateGoalProgress(goalId, percent, summary)

  const sessionStore = useThreadSessionStore()
  const content = summary
    ? `Goal progress: "${goal.title}" ${prevPercent}% → ${percent}% — ${summary}`
    : `Goal progress: "${goal.title}" ${prevPercent}% → ${percent}%`
  sessionStore.appendMessage(goal.threadId, 'goal', content, 'system', {
    goalId,
    event: 'progress',
  })
}
