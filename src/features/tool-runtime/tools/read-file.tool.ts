import TauriService from "@/services/ipc/tauri.service"
import type { ToolContext, ToolResult } from "@/features/tools/tool-runtime.types"
import type { ExtendedToolDefinition } from "../tool.types"

function joinPath(projectPath: string, filePath: string): string {
  return `${projectPath.replace(/\\/g, "/").replace(/\/+$/, "")}/${filePath.replace(/\\/g, "/").replace(/^\/+/, "")}`
}

export const readFileTool: ExtendedToolDefinition = {
  name: "read_file",
  description: "读取项目内指定文件内容。",
  category: "filesystem",
  requiresProject: true,
  isReadOnly: true,
  parameters: [
    { name: "filePath", type: "string", description: "项目内相对文件路径", required: true },
  ],
  async execute(params?: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const filePath = String(params?.filePath || "")
    if (!filePath) return { success: false, content: "", error: "缺少 filePath" }
    if (!context?.projectPath) return { success: false, content: "", error: "当前没有打开项目" }

    try {
      const content = await TauriService.readFile(joinPath(context.projectPath, filePath))
      const truncated = content.length > 12000
        ? `${content.slice(0, 12000)}\n\n... 文件过长，已截断，原始长度 ${content.length} 字符`
        : content
      return { success: true, content: truncated }
    } catch (error) {
      return { success: false, content: "", error: String(error) }
    }
  },
}

export default readFileTool
