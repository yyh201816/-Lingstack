export interface TerminalEntry {
  id: string
  threadId: string
  command: string
  cwd: string
  startedAt: string
  finishedAt?: string
  exitCode?: number
  status: 'running' | 'done' | 'failed' | 'killed'
  output: string
  source: 'user' | 'agent' | 'system'
}
