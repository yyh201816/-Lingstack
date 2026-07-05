import { computed } from "vue"
import { useNavigationStore } from "@/features/navigation/store/navigation.store"
import { useProjectStore } from "@/features/projects/store/project.store"
import { useWorkspaceStore } from "@/features/workspace/store/workspace.store"
import { useFileTree } from "@/features/workspace/composables/useFileTree"
import TauriService from "@/services/ipc/tauri.service"

export interface RecentEntryDisplay {
  id: string
  name: string
  path: string
  lastOpenedAt: string
  lastOpenedText: string
}

export function getProjectDisplayName(projectPath?: string | null): string {
  if (!projectPath) return "未打开项目"
  const normalized = projectPath.replace(/\\/g, "/")
  const name = normalized.split("/").filter(Boolean).pop()
  return name || "未命名项目"
}

function formatTime(iso?: string): string {
  if (!iso) return "刚刚"

  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return "刚刚"

  const diffMs = Date.now() - time
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "刚刚"
  if (minutes < 60) return `${minutes} 分钟前`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前`

  return `${Math.floor(days / 7)} 周前`
}

export function useProjectService() {
  const navigationStore = useNavigationStore()
  const projectStore = useProjectStore()
  const workspaceStore = useWorkspaceStore()
  const fileTree = useFileTree()

  const recentProjects = computed<RecentEntryDisplay[]>(() =>
    projectStore.recentProjects.map((project) => ({
      id: project.id,
      name: project.name,
      path: project.path,
      lastOpenedAt: project.lastOpenedAt,
      lastOpenedText: formatTime(project.lastOpenedAt),
    })),
  )

  async function openProjectPath(projectPath: string): Promise<void> {
    const normalized = projectPath.replace(/\\/g, "/")
    const name = getProjectDisplayName(normalized)

    await fileTree.setRoot(normalized)
    workspaceStore.setProjectPath(normalized, name)

    const project = projectStore.addRecentProject(name, normalized)
    projectStore.setCurrentProject(project.id)

    navigationStore.openProject(normalized, name)
  }

  async function openProject(): Promise<void> {
    let selectedPath: string | null = null

    try {
      selectedPath = await TauriService.openDirectoryDialog()
    } catch {
      selectedPath = null
    }

    if (!selectedPath) {
      const fallback = window.prompt("请输入项目文件夹路径")
      if (fallback?.trim()) {
        selectedPath = fallback.trim()
      }
    }

    if (!selectedPath) return

    try {
      const exists = await TauriService.checkPath(selectedPath)
      if (!exists) {
        throw new Error(`路径不存在：${selectedPath}`)
      }
    } catch (error) {
      if ((error as Error).message) {
        throw error
      }
      throw new Error("项目路径校验失败")
    }

    await openProjectPath(selectedPath)
  }

  return {
    recentProjects,
    openProject,
    openProjectPath,
  }
}
