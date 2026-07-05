/**
 * Task Executor Service (Phase 11)
 * Bridges self-repair tasks with thread-session for real timeline visibility.
 *
 * Lifecycle: pending → running → done/failed
 * Each status transition creates a 'task_status' message in the thread timeline.
 */

import { useThreadSessionStore } from '@/features/threads/store/thread-session.store'
import { useThreadStore } from '@/features/threads/store/thread.store'
import type { ThreadMessage } from '@/features/threads/types'

const TASK_MARKER = '🔧'

/**
 * Initiate a self-repair task on a thread.
 * Creates a task_status message in the timeline and updates thread status.
 */
export function initiateTaskExecution(threadId: string, taskGoal: string, targetScope: string): ThreadMessage {
  const session = useThreadSessionStore()
  const threads = useThreadStore()

  // Mark thread as running
  threads.updateThreadStatus(threadId, 'running')

  // Create task initiation message
  const msg = session.appendMessage(
    threadId,
    'task_status',
    [
      `${TASK_MARKER} Self-repair task initiated`,
      `Goal: ${taskGoal}`,
      `Scope: ${targetScope}`,
      `Status: running`,
    ].join('\n'),
    'system',
    {
      taskStatus: 'running',
      taskGoal,
      targetScope,
      startedAt: new Date().toISOString(),
    },
  )

  return msg
}

/**
 * Mark a task as completed with a result summary.
 */
export function completeTaskExecution(
  threadId: string,
  resultSummary: string,
  details?: { filesChanged?: string[]; linesAdded?: number; linesRemoved?: number },
): ThreadMessage {
  const session = useThreadSessionStore()
  const threads = useThreadStore()

  // Update thread with result
  threads.setTaskResult(threadId, resultSummary)

  // Create completion message
  const summaryParts = [resultSummary]
  if (details?.filesChanged?.length) {
    summaryParts.push(`Files: ${details.filesChanged.join(', ')}`)
  }
  if (details?.linesAdded !== undefined || details?.linesRemoved !== undefined) {
    summaryParts.push(`Changes: +${details.linesAdded ?? 0}/-${details.linesRemoved ?? 0}`)
  }

  const msg = session.appendMessage(
    threadId,
    'task_status',
    [
      `${TASK_MARKER} Self-repair task completed`,
      ...summaryParts,
      `Status: done`,
    ].join('\n'),
    'system',
    {
      taskStatus: 'done',
      resultSummary,
      filesChanged: details?.filesChanged,
      completedAt: new Date().toISOString(),
    },
  )

  return msg
}

/**
 * Mark a task as failed.
 */
export function failTaskExecution(threadId: string, error: string): ThreadMessage {
  const session = useThreadSessionStore()
  const threads = useThreadStore()

  threads.updateThreadStatus(threadId, 'failed')

  const msg = session.appendMessage(
    threadId,
    'task_status',
    [
      `${TASK_MARKER} Self-repair task failed`,
      `Error: ${error}`,
      `Status: failed`,
    ].join('\n'),
    'system',
    {
      taskStatus: 'failed',
      error,
      completedAt: new Date().toISOString(),
    },
  )

  return msg
}

/**
 * Add a progress/checkpoint message to the task timeline.
 */
export function addTaskProgress(threadId: string, progressText: string, meta?: Record<string, unknown>): ThreadMessage {
  const session = useThreadSessionStore()

  return session.appendMessage(
    threadId,
    'task_status',
    `${TASK_MARKER} ${progressText}`,
    'system',
    { taskStatus: 'running', ...meta },
  )
}

/**
 * Generate a task execution result summary string.
 */
export function buildTaskResultSummary(args: {
  goal: string
  actions: Array<{ description: string; outcome: 'success' | 'warning' | 'error' }>
  conclusion: string
}): string {
  const actionLines = args.actions.map(
    a => `  - [${a.outcome === 'success' ? '✓' : a.outcome === 'warning' ? '~' : '✗'}] ${a.description}`,
  )
  return [
    `Task: ${args.goal}`,
    '',
    ...actionLines,
    '',
    `Summary: ${args.conclusion}`,
  ].join('\n')
}
