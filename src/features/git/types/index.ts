export type GitFileStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked'

export interface GitChangedFile {
  id: string
  projectId: string
  filePath: string
  fileName: string
  status: GitFileStatus
  additions?: number
  deletions?: number
  staged: boolean
}

export interface GitProjectState {
  projectId: string
  currentBranch: string
  changedFiles: GitChangedFile[]
  commitDraft: string
  lastSyncedAt?: string
}
