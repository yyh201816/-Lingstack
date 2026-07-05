import { applyPatchProposal, createPatchProposal, rollbackPatchProposal } from "@/features/diff/patch.service"
import type { PatchProposal } from "@/features/diff/diff.types"
import TauriService from "@/services/ipc/tauri.service"
import {
  isConfigured,
  sendChatMessage,
  type ChatMessage,
  type WorkspaceContext,
} from "@/services/chat/chat.service"
import type { AgentTask, AgentTaskType, ChangedFile, DiffSummary } from "./agent-runtime.types"
import { useAgentTaskStore } from "./agent-task.store"

interface RunTaskOptions {
  projectPath?: string
  projectName?: string
  activeFile?: string
  modelName?: string
  threadId?: string
}

interface ProjectOverview {
  summary: string
  importantFiles: string[]
  topLevelEntryCount: number
}

interface ParsedPatchFile {
  filePath: string
  newContent: string
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/")
}

function getProjectDisplayName(projectPath?: string): string {
  if (!projectPath) return "未打开项目"
  return normalizePath(projectPath).split("/").filter(Boolean).pop() || "未命名项目"
}

function makeTitle(type: AgentTaskType, userRequest: string, projectName?: string): string {
  const prefix = projectName ? `${projectName}：` : ""
  const fallback = userRequest.trim().slice(0, 30)

  if (type === "self_repair") return `${prefix}自修复分析`
  if (type === "code_modify") return prefix + (fallback || "代码修改")
  if (type === "context_scan") return `${prefix}项目上下文分析`
  if (type === "chat") return fallback || "新对话"
  return prefix + (fallback || "新任务")
}

function toRelativeFilePath(projectPath: string | undefined, filePath: string): string {
  if (!projectPath) return normalizePath(filePath)

  const normalizedProject = normalizePath(projectPath).replace(/\/+$/, "")
  const normalizedFile = normalizePath(filePath)
  if (normalizedFile.startsWith(`${normalizedProject}/`)) {
    return normalizedFile.slice(normalizedProject.length + 1)
  }

  return normalizedFile.replace(/^\/+/, "")
}

function buildWorkspaceContext(taskId: string, userRequest: string, opts: RunTaskOptions): WorkspaceContext {
  return {
    projectPath: opts.projectPath,
    projectName: opts.projectName,
    activeFilePath: opts.activeFile,
    activeView: "agent-task",
    activeThreadId: opts.threadId || taskId,
    taskGoal: userRequest,
    includeFileContent: false,
  }
}

function proposalToTaskDiff(proposal: PatchProposal): { diff: DiffSummary; changedFiles: ChangedFile[] } {
  const hunks = proposal.files.flatMap((file) =>
    file.diff.hunks.map((hunk) => ({
      filePath: file.filePath,
      oldStart: hunk.oldStart,
      newStart: hunk.newStart,
      lines: hunk.lines.map((line) => {
        const prefix = line.type === "add" ? "+" : line.type === "remove" ? "-" : " "
        return `${prefix}${line.content}`
      }),
    })),
  )

  return {
    diff: {
      added: proposal.summary.added,
      removed: proposal.summary.removed,
      files: proposal.summary.files,
      hunks,
    },
    changedFiles: proposal.files.map((file) => ({
      path: file.filePath,
      status: file.status,
      oldContent: file.oldContent,
      newContent: file.newContent,
    })),
  }
}

async function collectProjectOverview(projectPath?: string): Promise<ProjectOverview> {
  if (!projectPath) {
    return {
      summary: "当前未打开项目，仅能基于任务描述进行分析。",
      importantFiles: [],
      topLevelEntryCount: 0,
    }
  }

  try {
    const rootEntries = await TauriService.listDir(projectPath)
    const importantFiles = rootEntries
      .filter((entry) =>
        entry.is_file &&
        /^(package\.json|README\.md|Cargo\.toml|tsconfig\.json|vite\.config|tauri\.conf)/i.test(entry.name),
      )
      .map((entry) => entry.path)

    return {
      summary: `项目 ${getProjectDisplayName(projectPath)} 已读取，共发现 ${rootEntries.length} 个顶层条目。`,
      importantFiles,
      topLevelEntryCount: rootEntries.length,
    }
  } catch (error) {
    return {
      summary: `读取项目目录失败：${String(error)}`,
      importantFiles: [],
      topLevelEntryCount: 0,
    }
  }
}

async function readImportantFiles(filePaths: string[]): Promise<string> {
  const chunks: string[] = []

  for (const filePath of filePaths.slice(0, 4)) {
    try {
      const content = await TauriService.readFile(filePath)
      const snippet = content.length > 2400 ? `${content.slice(0, 2400)}\n... 已截断` : content
      chunks.push(`文件：${filePath}\n${snippet}`)
    } catch {
      chunks.push(`文件：${filePath}\n读取失败`)
    }
  }

  return chunks.join("\n\n")
}

function buildPlanPrompt(type: AgentTaskType, request: string, opts: RunTaskOptions, contextSummary: string): string {
  const projectInfo = opts.projectPath
    ? `项目：${opts.projectName || getProjectDisplayName(opts.projectPath)}\n路径：${opts.projectPath}`
    : "当前未打开项目"

  return [
    "你是灵栈 LingStack 桌面 AI 工作台中的 Agent。",
    "请用中文输出 3-5 条可验证执行计划，保持克制、务实，不要假装已经修改文件。",
    "",
    projectInfo,
    opts.activeFile ? `当前文件：${opts.activeFile}` : "当前文件：未选择",
    "",
    `任务类型：${type}`,
    `用户任务：${request}`,
    "",
    `项目上下文：\n${contextSummary}`,
  ].join("\n")
}

function buildExecutionPrompt(request: string, opts: RunTaskOptions, contextSummary: string): string {
  return [
    "请基于当前项目上下文给出下一步执行结果。",
    "如果你非常确定需要修改当前文件，请只在回复末尾附加一个 lingstack_patch 代码块。",
    "补丁代码块格式必须是 JSON，文件内容必须是完整新内容：",
    "```lingstack_patch",
    '{"files":[{"path":"src/example.ts","content":"完整文件内容"}]}',
    "```",
    "",
    "如果不能确定完整新内容，就只给分析和建议，不要输出补丁块。",
    "",
    `项目：${opts.projectName || opts.projectPath || "未打开项目"}`,
    opts.activeFile ? `当前文件：${opts.activeFile}` : "当前文件：未选择",
    "",
    `项目上下文：\n${contextSummary}`,
    "",
    `用户任务：${request}`,
  ].join("\n")
}

function buildPatchPrompt(task: AgentTask, contextSummary: string): string {
  const latestAssistantMessages = task.messages
    .filter((message) => message.role === "assistant")
    .slice(-2)
    .map((message) => message.content.trim())
    .filter(Boolean)
    .join("\n\n")

  return [
    "你现在需要继续生成可应用的补丁提案。",
    "请避免重复目录扫描结果，不要输出大段项目树。",
    "如果已经具备足够信息，请直接给出 lingstack_patch 代码块。",
    "如果信息仍不足，请先说明缺少什么，再谨慎给出下一步建议。",
    "补丁代码块必须使用完整文件内容，不接受片段 diff：",
    "```lingstack_patch",
    '{"files":[{"path":"src/example.ts","content":"完整文件内容"}]}',
    "```",
    "",
    `项目：${task.projectName || getProjectDisplayName(task.projectPath)}`,
    task.activeFile ? `当前文件：${task.activeFile}` : "当前文件：未选择",
    `原始任务：${task.userRequest}`,
    "",
    latestAssistantMessages ? `已有分析：\n${latestAssistantMessages}` : "已有分析：暂无",
    "",
    `项目上下文：\n${contextSummary}`,
  ].join("\n")
}

function parsePatchFromText(text: string, opts: RunTaskOptions): ParsedPatchFile[] {
  const match = text.match(/```lingstack_patch\s*([\s\S]*?)```/)
  if (!match) return []

  try {
    const parsed = JSON.parse(match[1].trim())
    const files = Array.isArray(parsed.files)
      ? parsed.files
      : parsed.filePath && typeof parsed.content === "string"
        ? [{ path: parsed.filePath, content: parsed.content }]
        : []

    return files
      .map((file: Record<string, unknown>) => ({
        filePath: toRelativeFilePath(opts.projectPath, String(file.path || file.filePath || "")),
        newContent: typeof file.content === "string"
          ? file.content
          : typeof file.newContent === "string"
            ? file.newContent
            : "",
      }))
      .filter((file: ParsedPatchFile) => file.filePath && file.newContent.length > 0)
  } catch {
    return []
  }
}

function stripPatchBlock(text: string): string {
  return text.replace(/```lingstack_patch[\s\S]*?```/g, "").trim()
}

async function streamLLM(
  messages: ChatMessage[],
  context: WorkspaceContext,
  onErrorFallback: () => string,
): Promise<string> {
  let fullText = ""

  try {
    await sendChatMessage(
      messages,
      (token) => {
        fullText += token
      },
      (complete) => {
        fullText = complete || fullText
      },
      () => {
        fullText = onErrorFallback()
      },
      context,
    )
  } catch {
    fullText = onErrorFallback()
  }

  return fullText
}

function fallbackPlan(type: AgentTaskType, request: string, projectName?: string): string {
  if (type === "self_repair") {
    return [
      `已建立 ${projectName || "当前项目"} 的自修复任务。`,
      "建议计划：",
      "1. 先核对项目目录、入口文件和构建配置。",
      "2. 区分真实能力、桥接能力和占位能力。",
      "3. 优先修复影响主流程的断链与编码损坏。",
      "4. 只有生成真实文件变更后才进入 Diff 审查。",
    ].join("\n")
  }

  return [
    `已收到任务：${request}`,
    "当前没有可直接应用的补丁提案。",
    "如果需要代码修改，请打开目标文件并让 Agent 输出完整文件内容补丁。",
  ].join("\n")
}

function fallbackAnalysis(projectName?: string, hasProject = false): string {
  if (hasProject) {
    return `已完成第一轮分析。当前项目：${projectName || "未命名项目"}。如需继续修改，我可以下一步生成补丁提案。`
  }

  return "已收到任务。打开项目后，我可以读取上下文并继续生成更精确的计划或补丁。"
}

function buildContextNotice(task: AgentTask, overview: ProjectOverview): string {
  if (!task.projectPath) {
    return "已读取基础任务上下文。当前未打开项目，后续分析将仅基于你的描述。"
  }

  const importantCount = overview.importantFiles.length
  return `已读取项目上下文：${task.projectName || getProjectDisplayName(task.projectPath)}，顶层条目 ${overview.topLevelEntryCount} 个，关键文件 ${importantCount} 个。`
}

async function buildTaskContext(projectPath?: string): Promise<ProjectOverview & { contextSummary: string }> {
  const overview = await collectProjectOverview(projectPath)
  const importantFilesText = await readImportantFiles(overview.importantFiles)

  return {
    ...overview,
    contextSummary: importantFilesText
      ? `${overview.summary}\n\n关键文件摘录：\n${importantFilesText}`
      : overview.summary,
  }
}

export function useAgentTaskService() {
  const store = useAgentTaskStore()

  async function runTask(type: AgentTaskType, userRequest: string, opts: RunTaskOptions = {}): Promise<AgentTask> {
    const title = makeTitle(type, userRequest, opts.projectName)
    const task = store.createTask(type, title, userRequest, opts)
    const taskId = task.id
    store.addMessage(taskId, "user", userRequest)

    try {
      store.updateTaskStatus(taskId, "building_context")
      const contextStep = store.addStep(taskId, "读取项目上下文")
      store.updateStep(taskId, contextStep.id, "running")

      const contextBundle = await buildTaskContext(opts.projectPath)
      store.updateStep(taskId, contextStep.id, "done")
      store.addMessage(taskId, "system", buildContextNotice(task, contextBundle))

      store.updateTaskStatus(taskId, "planning")
      const planStep = store.addStep(taskId, "生成执行计划")
      store.updateStep(taskId, planStep.id, "running")

      const workspaceContext = buildWorkspaceContext(taskId, userRequest, opts)
      const planText = isConfigured()
        ? await streamLLM(
            [{ role: "user", content: buildPlanPrompt(type, userRequest, opts, contextBundle.contextSummary) }],
            workspaceContext,
            () => fallbackPlan(type, userRequest, opts.projectName),
          )
        : fallbackPlan(type, userRequest, opts.projectName)

      store.addMessage(taskId, "assistant", planText)
      store.updateStep(taskId, planStep.id, "done")

      store.updateTaskStatus(taskId, "executing_tool")
      const executionStep = store.addStep(taskId, "生成分析结果")
      store.updateStep(taskId, executionStep.id, "running")

      const executionText = isConfigured()
        ? await streamLLM(
            [{ role: "user", content: buildExecutionPrompt(userRequest, opts, contextBundle.contextSummary) }],
            workspaceContext,
            () => fallbackAnalysis(opts.projectName, Boolean(opts.projectPath)),
          )
        : fallbackAnalysis(opts.projectName, Boolean(opts.projectPath))

      const parsedPatch = parsePatchFromText(executionText, opts)
      const visibleExecution = stripPatchBlock(executionText)

      if (visibleExecution) {
        store.addMessage(taskId, "assistant", visibleExecution)
      }

      store.updateStep(taskId, executionStep.id, "done")

      if (opts.projectPath && parsedPatch.length > 0) {
        store.updateTaskStatus(taskId, "generating_diff")
        const diffStep = store.addStep(taskId, "生成补丁提案")
        store.updateStep(taskId, diffStep.id, "running")

        const proposal = await createPatchProposal({
          projectPath: opts.projectPath,
          taskId,
          files: parsedPatch,
        })
        const { diff, changedFiles } = proposalToTaskDiff(proposal)
        store.setPatchProposal(taskId, proposal.id, diff, changedFiles)
        store.addMessage(taskId, "system", `已生成真实补丁提案：${proposal.id}，等待你确认后应用。`)
        store.updateStep(taskId, diffStep.id, "done")
        store.updateTaskStatus(taskId, "waiting_confirm")
        return task
      }

      store.addMessage(taskId, "system", "分析完成，可继续生成补丁。当前还没有可审查的 Diff。")
      store.updateTaskStatus(taskId, "analysis_done")
      return task
    } catch (error) {
      store.updateTaskStatus(taskId, "failed", String(error))
      store.addMessage(taskId, "system", `任务执行失败：${String(error)}`)
      throw error
    }
  }

  async function continueGeneratePatch(taskId: string): Promise<void> {
    const task = store.tasks.find((item) => item.id === taskId)
    if (!task) return

    if (!task.projectPath) {
      store.addMessage(taskId, "system", "当前未打开项目，无法继续生成补丁。请先打开项目。")
      store.updateTaskStatus(taskId, "analysis_done")
      return
    }

    store.updateTaskStatus(taskId, "patch_requested")
    const step = store.addStep(taskId, "继续生成补丁")
    store.updateStep(taskId, step.id, "running")

    try {
      const contextBundle = await buildTaskContext(task.projectPath)
      const workspaceContext = buildWorkspaceContext(taskId, task.userRequest, {
        projectPath: task.projectPath,
        projectName: task.projectName,
        activeFile: task.activeFile,
        modelName: task.modelName,
        threadId: task.threadId,
      })

      const patchText = isConfigured()
        ? await streamLLM(
            [{ role: "user", content: buildPatchPrompt(task, contextBundle.contextSummary) }],
            workspaceContext,
            () => "已完成补丁生成尝试，但当前上下文仍不足以输出安全补丁。你可以指定目标文件后继续。",
          )
        : "已完成补丁生成尝试，但当前未配置模型，暂时无法输出真实补丁。"

      const parsedPatch = parsePatchFromText(patchText, {
        projectPath: task.projectPath,
        projectName: task.projectName,
        activeFile: task.activeFile,
        modelName: task.modelName,
        threadId: task.threadId,
      })
      const visibleText = stripPatchBlock(patchText)

      if (visibleText) {
        store.addMessage(taskId, "assistant", visibleText)
      }

      if (parsedPatch.length > 0) {
        store.updateTaskStatus(taskId, "generating_diff")
        const proposal = await createPatchProposal({
          projectPath: task.projectPath,
          taskId,
          files: parsedPatch,
        })
        const { diff, changedFiles } = proposalToTaskDiff(proposal)
        store.setPatchProposal(taskId, proposal.id, diff, changedFiles)
        store.updateStep(taskId, step.id, "done")
        store.addMessage(taskId, "system", `已生成新的补丁提案：${proposal.id}，可以前往审查并确认应用。`)
        store.updateTaskStatus(taskId, "waiting_confirm")
        return
      }

      store.updateStep(taskId, step.id, "done")
      store.addMessage(taskId, "system", "分析完成，可继续生成补丁。当前仍未生成可应用变更。")
      store.updateTaskStatus(taskId, "analysis_done")
    } catch (error) {
      store.updateStep(taskId, step.id, "failed", String(error))
      store.updateTaskStatus(taskId, "failed", String(error))
      store.addMessage(taskId, "system", `补丁生成失败：${String(error)}`)
    }
  }

  async function approveTask(taskId: string): Promise<void> {
    const task = store.tasks.find((item) => item.id === taskId)
    if (!task?.patchProposalId || task.status !== "waiting_confirm") return

    const confirm = (window as any).__LINGSTACK_CONFIRM__ as
      | ((title: string, message: string, detail?: string) => Promise<boolean>)
      | undefined

    if (confirm) {
      const ok = await confirm(
        "应用补丁",
        "灵栈将把当前补丁写入本地项目文件。",
        `提案：${task.patchProposalId}\n文件：${task.changedFiles.map((file) => file.path).join("\n")}`,
      )
      if (!ok) return
    }

    store.updateTaskStatus(taskId, "applying_patch")
    const step = store.addStep(taskId, "应用补丁")
    store.updateStep(taskId, step.id, "running")

    const result = await applyPatchProposal(task.patchProposalId)
    if (!result.success) {
      store.updatePatchStatus(taskId, "failed", result.error)
      store.updateStep(taskId, step.id, "failed", result.error)
      store.updateTaskStatus(taskId, "failed", result.error)
      store.addMessage(taskId, "system", `补丁应用失败：${result.error || "未知错误"}`)
      return
    }

    store.updatePatchStatus(taskId, "applied")
    store.updateStep(taskId, step.id, "done")
    store.updateTaskStatus(taskId, "completed")
    store.addMessage(taskId, "system", "补丁已应用到本地文件。你仍然可以从任务区执行回滚。")
  }

  async function rollbackTask(taskId: string): Promise<void> {
    const task = store.tasks.find((item) => item.id === taskId)
    if (!task?.patchProposalId || task.patchStatus !== "applied") return

    const confirm = (window as any).__LINGSTACK_CONFIRM__ as
      | ((title: string, message: string, detail?: string) => Promise<boolean>)
      | undefined

    if (confirm) {
      const ok = await confirm(
        "回滚补丁",
        "灵栈将恢复补丁应用前的文件内容。",
        `提案：${task.patchProposalId}\n文件：${task.changedFiles.map((file) => file.path).join("\n")}`,
      )
      if (!ok) return
    }

    store.updateTaskStatus(taskId, "applying_patch")
    const step = store.addStep(taskId, "回滚补丁")
    store.updateStep(taskId, step.id, "running")

    const result = await rollbackPatchProposal(task.patchProposalId)
    if (!result.success) {
      store.updatePatchStatus(taskId, "failed", result.error)
      store.updateStep(taskId, step.id, "failed", result.error)
      store.updateTaskStatus(taskId, "failed", result.error)
      store.addMessage(taskId, "system", `补丁回滚失败：${result.error || "未知错误"}`)
      return
    }

    store.updatePatchStatus(taskId, "rolled_back")
    store.updateStep(taskId, step.id, "done")
    store.updateTaskStatus(taskId, "completed")
    store.addMessage(taskId, "system", "补丁已回滚，文件内容已恢复。")
  }

  function rejectTask(taskId: string): void {
    const task = store.tasks.find((item) => item.id === taskId)
    if (!task) return

    store.updatePatchStatus(taskId, "rejected")
    store.updateTaskStatus(taskId, "cancelled")
    store.addMessage(taskId, "system", "已拒绝本次补丁提案，未写入任何文件。")
  }

  async function runChatTask(
    userRequest: string,
    projectPath?: string,
    projectName?: string,
    threadId?: string,
  ): Promise<AgentTask> {
    const task = store.createTask("chat", userRequest.slice(0, 40) || "新对话", userRequest, {
      projectPath,
      projectName,
      threadId,
    })
    store.addMessage(task.id, "user", userRequest)
    store.updateTaskStatus(task.id, "planning")

    const context = buildWorkspaceContext(task.id, userRequest, { projectPath, projectName, threadId })

    if (isConfigured()) {
      const reply = await streamLLM(
        [{ role: "user", content: userRequest }],
        context,
        () => "模型响应失败，请检查模型配置后重试。",
      )
      store.addMessage(task.id, "assistant", reply)
    } else {
      store.addMessage(
        task.id,
        "assistant",
        projectPath
          ? `已收到任务。当前已关联项目：${projectName || getProjectDisplayName(projectPath)}。配置 API Key 后我可以继续做深度分析。`
          : "已收到消息。配置 API Key 后即可获得真实 AI 回复。",
      )
    }

    store.updateTaskStatus(task.id, "completed")
    return task
  }

  return { runTask, continueGeneratePatch, approveTask, rejectTask, rollbackTask, runChatTask }
}
