export type ReviewTab = 'review' | 'terminal' | 'git' | 'artifacts' | 'pr' | 'bootstrap' | 'beta' | 'regression' | 'release-history'

export type DiffFileStatus = 'added' | 'modified' | 'deleted' | 'renamed'

export interface ReviewLine {
  id: string
  lineType: 'context' | 'add' | 'delete'
  oldNumber?: number
  newNumber?: number
  content: string
}

export interface ReviewHunk {
  id: string
  header: string
  lines: ReviewLine[]
  staged?: boolean
  reverted?: boolean
}

export interface ReviewFileDiff {
  id: string
  filePath: string
  fileName: string
  status: DiffFileStatus
  additions: number
  deletions: number
  hunks: ReviewHunk[]
  staged?: boolean
  reverted?: boolean
}

export interface ReviewComment {
  id: string
  threadId: string
  fileId: string
  hunkId?: string
  lineId?: string
  content: string
  createdAt: string
}

export interface ReviewDiffSet {
  id: string
  threadId: string
  projectId: string
  files: ReviewFileDiff[]
  totalAdditions: number
  totalDeletions: number
  createdAt: string
}
