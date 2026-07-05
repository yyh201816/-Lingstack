import { runtimeEventBus } from "@/features/agent-runtime/runtime-event-bus"
import type { ToolContext } from "@/features/tools/tool-runtime.types"
import type { ExtendedToolDefinition, ToolCallRequest, ToolCallResponse } from "./tool.types"

const toolRegistry = new Map<string, ExtendedToolDefinition>()

export function registerTool(tool: ExtendedToolDefinition): void {
  toolRegistry.set(tool.name, tool)
}

export function getAllToolDefinitions(): ExtendedToolDefinition[] {
  return Array.from(toolRegistry.values())
}

export function getToolPromptText(): string {
  const tools = getAllToolDefinitions()
  if (tools.length === 0) return ""

  return tools
    .map((tool) => {
      const params = tool.parameters
        .map((param) => `  - ${param.name} (${param.type}${param.required ? ", required" : ""}): ${param.description}`)
        .join("\n")
      return `### ${tool.name}\n${tool.description}\nParameters:\n${params || "  - none"}`
    })
    .join("\n\n")
}

export async function executeToolCall(request: ToolCallRequest): Promise<ToolCallResponse> {
  const startedAt = Date.now()
  runtimeEventBus.emit("tool_call_started", request.taskId, {
    toolName: request.toolName,
    params: request.params,
  })

  const tool = toolRegistry.get(request.toolName)
  if (!tool) {
    runtimeEventBus.emit("tool_call_completed", request.taskId, {
      toolName: request.toolName,
      success: false,
    })
    return {
      success: false,
      toolName: request.toolName,
      error: `未知工具：${request.toolName}`,
      duration: Date.now() - startedAt,
    }
  }

  if (tool.requiresProject && !request.projectPath) {
    return {
      success: false,
      toolName: request.toolName,
      error: "当前没有打开项目",
      duration: Date.now() - startedAt,
    }
  }

  if (tool.requiresApproval && !request.requireApproval) {
    return {
      success: false,
      toolName: request.toolName,
      error: "该工具需要用户确认后才能执行",
      duration: Date.now() - startedAt,
    }
  }

  try {
    const context: ToolContext = {
      projectPath: request.projectPath,
      activeFilePath: request.activeFilePath,
      activeFileContent: request.activeFileContent,
      taskId: request.taskId,
    }
    const result = await tool.execute(request.params, context)
    runtimeEventBus.emit("tool_call_completed", request.taskId, {
      toolName: request.toolName,
      success: result.success,
    })

    return {
      success: result.success,
      toolName: request.toolName,
      result: result.content,
      error: result.error,
      data: result.data,
      duration: Date.now() - startedAt,
    }
  } catch (error) {
    runtimeEventBus.emit("tool_call_completed", request.taskId, {
      toolName: request.toolName,
      success: false,
      error: String(error),
    })

    return {
      success: false,
      toolName: request.toolName,
      error: String(error),
      duration: Date.now() - startedAt,
    }
  }
}

export function parseToolCallFromText(text: string): ToolCallRequest | null {
  const patterns = [
    /<tool_call>\s*(\{[\s\S]*?\})\s*<\/tool_call>/,
    /```tool_call\s*(\{[\s\S]*?\})\s*```/,
    /```json\s*(\{[\s\S]*?"(?:name|toolName)"[\s\S]*?\})\s*```/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (!match) continue

    try {
      const parsed = JSON.parse(match[1])
      return {
        toolName: parsed.name || parsed.toolName,
        params: parsed.params || parsed.arguments || {},
        taskId: "",
      }
    } catch {
      // keep looking
    }
  }

  return null
}
