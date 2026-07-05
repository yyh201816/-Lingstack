export interface FileContext {
  path: string
  relativePath: string
  language?: string
  size: number
  lastModified: string
  isBinary: boolean
}

export interface ProjectContext {
  projectPath: string
  projectName: string
  rootFiles: FileContext[]
  directoryTree: string
  packageJson?: Record<string, unknown>
  gitBranch?: string
  totalFiles: number
}

export interface TaskContext {
  project?: ProjectContext
  activeFile?: FileContext
  openTabs: FileContext[]
  relatedFiles: FileContext[]
  selectedText?: string
  userRequest: string
  builtAt: string
}
