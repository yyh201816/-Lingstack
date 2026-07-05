import type { ToolContext, ToolDefinition, ToolResult } from "./tool-runtime.types"

const timeTool: ToolDefinition = {
  name: "current_time",
  description: "获取当前日期和时间。",
  parameters: [],
  async execute() {
    const now = new Date()
    return {
      success: true,
      content: [
        `当前时间：${now.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })}`,
        `时区：Asia/Shanghai (UTC+8)`,
        `ISO：${now.toISOString()}`,
      ].join("\n"),
    }
  },
}

const systemInfoTool: ToolDefinition = {
  name: "system_info",
  description: "获取当前运行环境信息。",
  parameters: [],
  async execute() {
    const memory = (navigator as any).deviceMemory
    return {
      success: true,
      content: [
        `平台：${navigator.platform || "未知"}`,
        `语言：${navigator.language}`,
        `在线状态：${navigator.onLine ? "在线" : "离线"}`,
        memory ? `设备内存：${memory} GB` : "",
        `屏幕：${screen.width}x${screen.height}`,
      ].filter(Boolean).join("\n"),
    }
  },
}

const readActiveFileTool: ToolDefinition = {
  name: "read_active_file",
  description: "读取当前活动文件内容。",
  parameters: [],
  async execute(_params?: Record<string, unknown>, context?: ToolContext): Promise<ToolResult> {
    if (!context?.activeFilePath) {
      return { success: false, content: "", error: "当前没有活动文件" }
    }

    const content = context.activeFileContent || ""
    const truncated = content.length > 6000
      ? `${content.slice(0, 6000)}\n... 文件过长，已截断`
      : content

    return {
      success: true,
      content: `活动文件：${context.activeFilePath}\n\n${truncated}`,
    }
  },
}

export const BUILTIN_TOOLS: ToolDefinition[] = [
  timeTool,
  systemInfoTool,
  readActiveFileTool,
]

export function buildToolsPromptText(): string {
  return [
    "",
    "---",
    "可用本地工具：",
    ...BUILTIN_TOOLS.map((tool) => `- ${tool.name}: ${tool.description}`),
  ].join("\n")
}

const TOOL_TRIGGERS: Record<string, string[]> = {
  current_time: ["现在几点", "当前时间", "今天日期", "current time", "current date"],
  system_info: ["系统信息", "运行环境", "屏幕分辨率", "system info"],
  read_active_file: ["当前文件", "活动文件", "这个文件", "read active file"],
}

export function detectToolTriggers(
  userMessage: string,
  context?: ToolContext,
): Array<{ tool: ToolDefinition; result: Promise<ToolResult> }> {
  const lower = userMessage.toLowerCase()
  const triggered: Array<{ tool: ToolDefinition; result: Promise<ToolResult> }> = []
  const seen = new Set<string>()

  for (const tool of BUILTIN_TOOLS) {
    const triggers = TOOL_TRIGGERS[tool.name] || []
    if (!seen.has(tool.name) && triggers.some((trigger) => lower.includes(trigger.toLowerCase()))) {
      seen.add(tool.name)
      triggered.push({ tool, result: tool.execute(undefined, context) })
    }
  }

  return triggered
}
