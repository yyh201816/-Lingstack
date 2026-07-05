import { applyPatchProposal, rollbackPatchProposal } from "@/features/diff/patch.service"
import type { ToolContext, ToolResult } from "@/features/tools/tool-runtime.types"
import type { ExtendedToolDefinition } from "../tool.types"

export const applyPatchTool: ExtendedToolDefinition = {
  name: "apply_patch",
  description: "应用指定补丁提案。",
  category: "diff",
  requiresProject: true,
  requiresApproval: true,
  isReadOnly: false,
  parameters: [
    { name: "proposalId", type: "string", description: "补丁提案 ID", required: true },
  ],
  async execute(params?: Record<string, unknown>, _context?: ToolContext): Promise<ToolResult> {
    const proposalId = String(params?.proposalId || "")
    if (!proposalId) return { success: false, content: "", error: "缺少 proposalId" }

    const result = await applyPatchProposal(proposalId)
    return {
      success: result.success,
      content: result.success ? `补丁 ${proposalId} 已应用` : "",
      error: result.error,
      data: result,
    }
  },
}

export const rollbackPatchTool: ExtendedToolDefinition = {
  name: "rollback_patch",
  description: "回滚指定补丁提案。",
  category: "diff",
  requiresProject: true,
  requiresApproval: true,
  isReadOnly: false,
  parameters: [
    { name: "proposalId", type: "string", description: "补丁提案 ID", required: true },
  ],
  async execute(params?: Record<string, unknown>, _context?: ToolContext): Promise<ToolResult> {
    const proposalId = String(params?.proposalId || "")
    if (!proposalId) return { success: false, content: "", error: "缺少 proposalId" }

    const result = await rollbackPatchProposal(proposalId)
    return {
      success: result.success,
      content: result.success ? `补丁 ${proposalId} 已回滚` : "",
      error: result.error,
      data: result,
    }
  },
}

export default applyPatchTool
