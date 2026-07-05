import TauriService from "@/services/ipc/tauri.service"
import type { ToolContext, ToolResult } from "@/features/tools/tool-runtime.types"
import type { ExtendedToolDefinition } from "../tool.types"

function joinPath(projectPath: string, dirPath: string): string {
  const root = projectPath.replace(/\\/g, "/").replace(/\/+$/, "")
  const relative = dirPath.replace(/\\/g, "/").replace(/^\/+/, "")
  return relative === "." || relative === "" ? root : `${root}/${relative}`
}

export const listDirTool: ExtendedToolDefinition = {
  name: "list_dir",
  description: "列出项目内目录文件。",
  category: "filesystem",
  requiresProject: true,
  isReadOnly: true,
  parameters: [
    { name: "dirPath", type: "string", description: "项目内相对目录，默认 .", required: false },
  ],
  async execute(params?: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    if (!context?.projectPath) return { success: false, content: "", error: "当前没有打开项目" }

    const dirPath = String(params?.dirPath || ".")

    try {
      const fullPath = joinPath(context.projectPath, dirPath)
      const entries = await TauriService.listDir(fullPath)
      const listing = entries
        .map((entry) => `${entry.is_directory ? "[DIR]" : "[FILE]"} ${entry.name}`)
        .join("\n")
      return { success: true, content: `${fullPath}\n${listing || "目录为空"}`, data: entries }
    } catch (error) {
      return { success: false, content: "", error: String(error) }
    }
  },
}

export default listDirTool
