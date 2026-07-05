export interface ToolParam {
  name: string
  type: "string" | "number" | "boolean"
  description: string
  required: boolean
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: ToolParam[]
  execute: (params?: Record<string, unknown>, context?: ToolContext) => Promise<ToolResult>
}

export interface ToolResult {
  success: boolean
  content: string
  error?: string
  data?: unknown
}

export interface ParsedToolCall {
  toolName: string
  params: Record<string, unknown>
}

export interface ToolContext {
  projectPath?: string
  activeFilePath?: string
  activeFileContent?: string
  taskId?: string
}
