export type ThreadMode = 'local' | 'worktree' | 'cloud'

export type TaskType = 'chat' | 'self_repair' | 'code_review'

export type ThreadStatus =
  | 'idle'
  | 'running'
  | 'waiting_approval'
  | 'waiting_input'
  | 'ready_review'
  | 'paused'
  | 'failed'
  | 'done'

export interface ThreadItem {
  id: string
  title: string
  projectId: string
  mode: ThreadMode
  taskType: TaskType
  status: ThreadStatus
  pinned: boolean
  archived: boolean
  createdAt: string
  updatedAt: string
  branch?: string
  /** Self-repair task fields */
  goal?: string
  targetScope?: string
  resultSummary?: string
}

export type ThreadMessageType =
  | 'user'
  | 'assistant'
  | 'system'
  | 'tool_log'
  | 'command'
  | 'diff'
  | 'artifact'
  | 'approval'
  | 'plan'
  | 'goal'
  | 'review_comment'
  | 'task_status'

export interface ThreadMessage {
  id: string
  threadId: string
  type: ThreadMessageType
  role?: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  streaming?: boolean
  error?: boolean
  meta?: Record<string, unknown>
}
