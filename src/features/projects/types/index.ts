export interface ProjectItem {
  id: string
  name: string
  path: string
  kind: 'local' | 'worktree' | 'remote'
  lastOpenedAt: string
  branch?: string
  remoteHost?: string
}

export type ProjectKind = ProjectItem['kind']
