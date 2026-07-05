import { createPatchProposal } from "@/features/diff/patch.service"
import type { ToolContext, ToolResult } from "@/features/tools/tool-runtime.types"
import type { ExtendedToolDefinition } from "../tool.types"

export const generateDiffTool: ExtendedToolDefinition = {
  name: "generate_diff",
  description: "基于真实磁盘内容生成补丁提案和 Diff。",
  category: "diff",
  requiresProject: true,
  isReadOnly: true,
  parameters: [
    { name: "filePath", type: "string", description: "项目内相对文件路径", required: true },
    { name: "newContent", type: "string", description: "文件完整新内容", required: true },
  ],
  async execute(params?: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    const filePath = String(params?.filePath || "")
    const newContent = typeof params?.newContent === "string" ? params.newContent : ""

    if (!filePath) return { success: false, content: "", error: "缺少 filePath" }
    if (!context?.projectPath) return { success: false, content: "", error: "当前没有打开项目" }

    const proposal = await createPatchProposal({
      projectPath: context.projectPath,
      taskId: context.taskId,
      files: [{ filePath, newContent }],
    })

    return {
      success: true,
      content: `已生成补丁提案 ${proposal.id}：${proposal.summary.files} 个文件，+${proposal.summary.added} / -${proposal.summary.removed}`,
      data: proposal,
    }
  },
}

export default generateDiffTool
