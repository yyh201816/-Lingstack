import type {
  ToolContext as BaseToolContext,
  ToolDefinition as BaseToolDefinition,
  ToolResult as BaseToolResult,
} from "@/features/tools/tool-runtime.types"

export type { BaseToolContext, BaseToolDefinition, BaseToolResult }

export type ToolCategory = "filesystem" | "diff" | "shell" | "search" | "utility"

export interface ExtendedToolDefinition extends BaseToolDefinition {
  category: ToolCategory
  requiresProject?: boolean
  requiresApproval?: boolean
  isReadOnly?: boolean
}

export interface ToolCallRequest {
  toolName: string
  params: Record<string, unknown>
  taskId: string
  projectPath?: string
  activeFilePath?: string
  activeFileContent?: string
  requireApproval?: boolean
}

export interface ToolCallResponse {
  success: boolean
  toolName: string
  result?: string
  error?: string
  data?: unknown
  duration: number
}
