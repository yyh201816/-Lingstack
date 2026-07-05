import { computed, ref } from "vue"
import { buildToolsPromptText, detectToolTriggers } from "@/features/tools/builtin-tools"

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface ChatConfig {
  providerType: string
  endpoint: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
}

export interface WorkspaceContext {
  projectPath?: string
  projectName?: string
  activeFilePath?: string
  activeFileName?: string
  activeFileContent?: string
  openTabs?: Array<{ filePath: string; fileName: string; language?: string; isActive?: boolean }>
  activeView?: string
  selectedModel?: { providerId?: string; modelId?: string; displayName?: string }
  recentProjects?: string[]
  theme?: string
  includeFileContent?: boolean
  activeThreadId?: string
  taskType?: string
  taskGoal?: string
  taskScope?: string
}

export interface SendPreflight {
  ok: boolean
  error?: "no_model_configured" | "no_api_key" | "invalid_endpoint"
  message?: string
}

export interface ChatError {
  category: "auth" | "model" | "network" | "server" | "stream" | "abort" | "unknown"
  message: string
  statusCode?: number
  rawMessage?: string
}

const LS_KEY = "lingstack_provider_config"

export const SYSTEM_PROMPT = [
  "你是灵栈 LingStack 桌面 AI 工作台的智能助手。",
  "你擅长项目分析、代码审查、架构判断和补丁建议。",
  "默认使用中文回复，代码和技术标识保留英文。",
  "当你不能确认完整修改内容时，明确说明原因，不要假装已经修改文件。",
].join("\n")

const DEFAULT_CONFIG: ChatConfig = {
  providerType: "openai",
  endpoint: "https://api.openai.com/v1/chat/completions",
  apiKey: "",
  model: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 4096,
}

let activeAbort: AbortController | null = null

function truncateContent(content: string, maxLength: number): string {
  return content.length <= maxLength
    ? content
    : `${content.slice(0, maxLength)}\n\n... 内容过长，已截断，原始长度 ${content.length} 字符`
}

function loadConfig(): ChatConfig {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_CONFIG }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

function buildSystemPrompt(context?: WorkspaceContext): string {
  let prompt = SYSTEM_PROMPT

  if (context) {
    const lines: string[] = []
    if (context.projectPath) lines.push(`项目路径：${context.projectPath}`)
    if (context.projectName) lines.push(`项目名称：${context.projectName}`)
    if (context.activeView) lines.push(`当前视图：${context.activeView}`)
    if (context.activeThreadId) lines.push(`线程 ID：${context.activeThreadId}`)
    if (context.taskGoal) lines.push(`任务目标：${context.taskGoal}`)
    if (context.activeFilePath) lines.push(`当前文件：${context.activeFilePath}`)

    if (context.openTabs?.length) {
      lines.push(`打开标签：${context.openTabs.map((tab) => `${tab.fileName}${tab.isActive ? " [当前]" : ""}`).join(", ")}`)
    }

    if (context.activeFileContent !== undefined && context.includeFileContent !== false) {
      lines.push(`当前文件内容：\n\`\`\`\n${truncateContent(context.activeFileContent, 8000)}\n\`\`\``)
    }

    if (lines.length) {
      prompt += `\n\n---\n当前工作台上下文：\n${lines.join("\n")}`
    }
  }

  prompt += buildToolsPromptText()
  return prompt
}

function classifyError(status: number, body: string): ChatError {
  let detail = body.slice(0, 300)
  try {
    const parsed = JSON.parse(body)
    detail = parsed.error?.message || parsed.message || detail
  } catch {
    // keep raw detail
  }

  if (status === 401) return { category: "auth", statusCode: status, rawMessage: body, message: "API Key 无效，请检查模型配置。" }
  if (status === 403) return { category: "auth", statusCode: status, rawMessage: body, message: "模型服务拒绝访问，请检查权限或额度。" }
  if (status === 404) return { category: "model", statusCode: status, rawMessage: body, message: `模型或端点不存在：${detail}` }
  if (status === 429) return { category: "server", statusCode: status, rawMessage: body, message: "请求过于频繁，请稍后重试。" }
  if (status >= 500) return { category: "server", statusCode: status, rawMessage: body, message: `模型服务异常：${status}` }
  return { category: "unknown", statusCode: status, rawMessage: body, message: `请求失败：${status} ${detail}` }
}

function classifyNetworkError(error: Error): ChatError {
  if (error.name === "AbortError") return { category: "abort", message: "请求已取消" }
  if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
    return { category: "network", message: "网络连接失败，请检查 API 地址和网络状态。", rawMessage: error.message }
  }
  return { category: "unknown", message: `请求失败：${error.message}`, rawMessage: error.message }
}

async function mockStreamResponse(
  messages: ChatMessage[],
  onToken: (token: string) => void,
  onComplete: (fullContent: string) => void,
  _onError: (error: string) => void,
  context?: WorkspaceContext,
): Promise<void> {
  const lastUser = [...messages].reverse().find((message) => message.role === "user")
  const projectText = context?.projectPath ? `当前项目：${context.projectName || context.projectPath}` : "当前未打开项目"
  const response = [
    "已收到任务。",
    projectText,
    "当前未配置真实模型 API Key，因此先保留任务上下文，不会生成或应用任何文件补丁。",
  ].join("\n")

  let fullContent = ""
  for (const char of response.replace("任务。", `任务：${lastUser?.content || ""}\n`)) {
    fullContent += char
    onToken(char)
    await new Promise((resolve) => setTimeout(resolve, 8))
  }
  onComplete(fullContent)
}

export const chatConfigRef = ref<ChatConfig>(loadConfig())

export function setChatConfig(partial: Partial<ChatConfig>): void {
  chatConfigRef.value = { ...chatConfigRef.value, ...partial }
  localStorage.setItem(LS_KEY, JSON.stringify(chatConfigRef.value))
}

export function getChatConfig(): Readonly<ChatConfig> {
  return chatConfigRef.value
}

export const chatConfigured = computed(() => chatConfigRef.value.apiKey.trim().length > 0)

export const chatModelLabel = computed(() => {
  const config = chatConfigRef.value
  return config.apiKey ? config.model || "未选择模型" : "未配置模型"
})

export function isConfigured(): boolean {
  return chatConfigured.value
}

export function preflightSend(): SendPreflight {
  const config = chatConfigRef.value
  if (!config.model.trim()) return { ok: false, error: "no_model_configured", message: "未选择模型，请先在设置中选择模型。" }
  if (!config.endpoint.trim()) return { ok: false, error: "invalid_endpoint", message: "未配置 API 端点。" }
  if (!config.apiKey.trim()) return { ok: false, error: "no_api_key", message: "当前模型未配置 API Key。" }
  return { ok: true }
}

export function getActiveModelInfo(): { model: string; providerType: string } {
  return { model: chatConfigRef.value.model, providerType: chatConfigRef.value.providerType }
}

export function abortChatStream(): void {
  activeAbort?.abort()
  activeAbort = null
}

export async function sendChatMessage(
  messages: ChatMessage[],
  onToken: (token: string) => void,
  onComplete: (fullContent: string) => void,
  onError: (error: string) => void,
  context?: WorkspaceContext,
): Promise<void> {
  abortChatStream()
  activeAbort = new AbortController()

  if (!chatConfigRef.value.apiKey.trim()) {
    await mockStreamResponse(messages, onToken, onComplete, onError, context)
    return
  }

  try {
    const requestMessages: ChatMessage[] = [
      { role: "system", content: buildSystemPrompt(context) },
      ...messages,
    ]

    const lastUser = [...messages].reverse().find((message) => message.role === "user")
    if (lastUser) {
      const triggered = detectToolTriggers(lastUser.content, {
        projectPath: context?.projectPath,
        activeFilePath: context?.activeFilePath,
        activeFileContent: context?.activeFileContent,
      })
      const results = await Promise.all(triggered.map((item) => item.result))
      const toolContent = results.filter((result) => result.success).map((result) => result.content).join("\n\n")
      if (toolContent) {
        requestMessages.splice(1, 0, { role: "system", content: `本地工具结果：\n${toolContent}` })
      }
    }

    const response = await fetch(chatConfigRef.value.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chatConfigRef.value.apiKey}`,
      },
      body: JSON.stringify({
        model: chatConfigRef.value.model,
        messages: requestMessages,
        temperature: chatConfigRef.value.temperature,
        max_tokens: chatConfigRef.value.maxTokens,
        stream: true,
      }),
      signal: activeAbort.signal,
    })

    if (!response.ok) {
      const text = await response.text()
      onError(classifyError(response.status, text).message)
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      onError("无法读取模型响应流。")
      return
    }

    const decoder = new TextDecoder()
    let fullContent = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split("\n").filter((line) => line.startsWith("data: "))

      for (const line of lines) {
        const json = line.slice(6).trim()
        if (json === "[DONE]") {
          onComplete(fullContent)
          return
        }

        try {
          const parsed = JSON.parse(json)
          const token = parsed.choices?.[0]?.delta?.content
          if (token) {
            fullContent += token
            onToken(token)
          }
        } catch {
          // ignore malformed SSE line
        }
      }
    }

    onComplete(fullContent)
  } catch (error) {
    const chatError = classifyNetworkError(error as Error)
    if (chatError.category !== "abort") onError(chatError.message)
  }
}
