import { useProjectStore } from "@/features/projects/store/project.store"
import { useWorkspaceStore } from "@/features/workspace/store/workspace.store"
import type { FileContext, TaskContext } from "./context-engine.types"

function getProjectDisplayName(projectPath?: string | null): string {
  if (!projectPath) return "未打开项目"
  const normalized = projectPath.replace(/\\/g, "/")
  return normalized.split("/").filter(Boolean).pop() || "未命名项目"
}

function toFileContext(filePath: string, language?: string): FileContext {
  return {
    path: filePath,
    relativePath: filePath,
    language,
    size: 0,
    lastModified: new Date().toISOString(),
    isBinary: false,
  }
}

export function useContextEngine() {
  function buildContext(userRequest: string): TaskContext {
    const projectStore = useProjectStore()
    const workspaceStore = useWorkspaceStore()
    const projectPath = projectStore.currentProjectPath || undefined
    const projectName = projectStore.currentProjectName || getProjectDisplayName(projectPath)

    const openTabs = workspaceStore.tabs.map((tab) => toFileContext(tab.filePath, tab.language))
    const activeFile = workspaceStore.activeTab
      ? toFileContext(workspaceStore.activeTab.filePath, workspaceStore.activeTab.language)
      : undefined

    return {
      project: projectPath
        ? {
            projectPath,
            projectName,
            rootFiles: [],
            directoryTree: projectName,
            totalFiles: 0,
          }
        : undefined,
      activeFile,
      openTabs,
      relatedFiles: [],
      userRequest,
      builtAt: new Date().toISOString(),
    }
  }

  function getProjectSummary(): string {
    const context = buildContext("")
    if (!context.project) return "未打开项目"

    return [
      `项目：${context.project.projectName}`,
      `路径：${context.project.projectPath}`,
      `已打开标签：${context.openTabs.length}`,
      `当前文件：${context.activeFile?.relativePath || "未选择"}`,
    ].join("\n")
  }

  return { buildContext, getProjectSummary }
}
