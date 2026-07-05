/**
 * regression types — Phase 12
 * Institutionalized regression checklist
 */

export type RegressionItemStatus = 'pending' | 'pass' | 'fail' | 'skipped'
export type RegressionArea =
  | 'packaging'
  | 'startup'
  | 'workspace'
  | 'thread'
  | 'review'
  | 'terminal'
  | 'git'
  | 'skill-runner'
  | 'update'
  | 'settings'
  | 'persistence'

export interface RegressionChecklistItem {
  key: string
  label: string
  area: RegressionArea
  status: RegressionItemStatus
  note?: string
  checkedAt?: string
}

export interface RegressionChecklist {
  id: string
  taskId: string
  version?: string
  items: RegressionChecklistItem[]
  overallStatus: 'pending' | 'partial' | 'pass' | 'fail'
  createdAt: string
  updatedAt: string
}

// ── Default checklist ──
export function defaultRegressionChecklist(taskId: string, version?: string): RegressionChecklist {
  return {
    id: 'reg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    taskId,
    version,
    items: [
      { key: 'packaging', label: 'npm run build passes', area: 'packaging', status: 'pending' },
      { key: 'startup', label: 'App starts without crash', area: 'startup', status: 'pending' },
      { key: 'workspace-open', label: 'Open project works', area: 'workspace', status: 'pending' },
      { key: 'thread-new', label: 'New thread created', area: 'thread', status: 'pending' },
      { key: 'thread-restore', label: 'Thread state restores after reload', area: 'thread', status: 'pending' },
      { key: 'review-diff', label: 'Review diff renders', area: 'review', status: 'pending' },
      { key: 'review-comment', label: 'Comment flows back to thread', area: 'review', status: 'pending' },
      { key: 'terminal-cmd', label: 'Terminal command executes', area: 'terminal', status: 'pending' },
      { key: 'git-changes', label: 'Git changed files visible', area: 'git', status: 'pending' },
      { key: 'skill-runner', label: 'Skill runner loads skills', area: 'skill-runner', status: 'pending' },
      { key: 'update-check', label: 'Update check does not crash', area: 'update', status: 'pending' },
      { key: 'settings-open', label: 'Settings panel opens', area: 'settings', status: 'pending' },
      { key: 'persistence', label: 'All stores persist across reload', area: 'persistence', status: 'pending' },
    ],
    overallStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
