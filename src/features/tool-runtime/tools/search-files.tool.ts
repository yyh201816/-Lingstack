import TauriService from "@/services/ipc/tauri.service"
import type { ToolContext, ToolResult } from "@/features/tools/tool-runtime.types"
import type { ExtendedToolDefinition } from "../tool.types"

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "target", ".next", ".vite"])

async function searchRecursive(rootPath: string, keyword: string, maxResults = 40): Promise<string[]> {
  const results: string[] = []

  async function walk(dirPath: string): Promise<void> {
    if (results.length >= maxResults) return

    let entries: Awaited<ReturnType<typeof TauriService.listDir>>
    try {
      entries = await TauriService.listDir(dirPath)
    } catch {
      return
    }

    for (const entry of entries) {
      if (results.length >= maxResults) return
      if (entry.name.toLowerCase().includes(keyword.toLowerCase())) {
        results.push(entry.path)
      }
      if (entry.is_directory && !SKIP_DIRS.has(entry.name)) {
        await walk(entry.path)
      }
    }
  }

  await walk(rootPath)
  return results
}

export const searchFilesTool: ExtendedToolDefinition = {
  name: "search_files",
  description: "在项目中按文件名搜索。",
  category: "search",
  requiresProject: true,
  isReadOnly: true,
  parameters: [
    { name: "keyword", type: "string", description: "文件名关键词", required: true },
  ],
  async execute(params?: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const keyword = String(params?.keyword || "")
    if (!keyword) return { success: false, content: "", error: "缺少 keyword" }
    if (!context?.projectPath) return { success: false, content: "", error: "当前没有打开项目" }

    const results = await searchRecursive(context.projectPath, keyword)
    return {
      success: true,
      content: results.length
        ? `找到 ${results.length} 个匹配文件：\n${results.map((path) => `- ${path}`).join("\n")}`
        : `没有找到匹配 "${keyword}" 的文件`,
      data: results,
    }
  },
}

export default searchFilesTool
