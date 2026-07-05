/**
 * skill-runner.service.ts — Skill 执行调度器（R25 三链合流）
 *
 * 职责：
 *   1. 收集当前工作区上下文 (project / active file / tabs)
 *   2. 解析远程知识增强 (knowledge augmentation)
 *   3. 读取当前模型配置
 *   4. 合并记忆文件路径
 *   5. 生成统一 SkillExecutionPayload
 *   6. 构建增强版 prompt 文本
 *
 * R25 核心变化：不再三处散落拼字段，统一产出 SkillExecutionPayload
 */

import type { SkillMeta } from './skill-loader.service'
import type { SkillExecutionPayload, PayloadInjectionSummary } from './skill-execution.types'
import { useNavigationStore } from '@/features/navigation/store/navigation.store'
import { useWorkspaceStore } from '@/features/workspace/store/workspace.store'
import { useEditorStore } from '@/features/editor/store/editor.store'
import { useAppStore } from '@/stores/app.store'
import { getChatConfig } from '@/services/chat/chat.service'
import { resolveKnowledgeAugmentation } from '@/services/knowledge/knowledge-sync.service'
import { useModelConfigsStore } from '@/features/settings/store/model-configs.store'

// ========== Re-export types (backward compat) ==========

export type { SkillExecutionPayload, PayloadInjectionSummary } from './skill-execution.types'

export enum RunPhase {
  Idle = 'idle',
  Collecting = 'collecting',
  KnowledgeSync = 'knowledge-sync',
  Assembling = 'assembling',
  Done = 'done',
  Error = 'error',
}

export interface RunResult {
  phase: RunPhase
  payload: SkillExecutionPayload | null
  error: string | null
}

// ========== 内部辅助 ==========

/** 获取当前活动文件内容 */
function getActiveFileContent(): string | null {
  try {
    const editor = useEditorStore()
    const ws = useWorkspaceStore()
    const tab = ws.activeTab
    if (!tab) return null
    return editor.editedContentMap[tab.filePath] ?? tab.content ?? null
  } catch {
    return null
  }
}

/** 截断文件内容到指定长度 */
function truncateFileContent(content: string | null, maxLen = 500): string | null {
  if (!content) return null
  if (content.length <= maxLen) return content
  return content.slice(0, maxLen) + `\n... (截断，原文 ${content.length} 字符)`
}

/** 收集工作区上下文 */
function collectWorkspace() {
  const nav = useNavigationStore()
  const ws = useWorkspaceStore()
  const activeTab = ws.activeTab

  const openTabs = ws.tabs.map(t => ({
    filePath: t.filePath,
    fileName: t.fileName,
    language: t.language,
    isActive: t.id === ws.activeTabId,
  }))

  return {
    projectPath: nav.projectPath || ws.activeProject || null,
    projectName: nav.projectName || null,
    activeFilePath: activeTab?.filePath ?? null,
    activeFileName: activeTab?.fileName ?? null,
    activeFileContent: truncateFileContent(getActiveFileContent()),
    activeFileLanguage: activeTab?.language ?? null,
    openTabs,
    activeView: nav.activeView,
  }
}

/** 收集记忆文件路径 */
function collectMemory() {
  return {
    sharedMemoryPath: 'G:\\codex-vibecoding\\LingStack-协同共享记忆.md',
    projectMemoryPath: 'G:\\codex-vibecoding\\LingStack-项目进度记忆.md',
    latestReportPath: 'G:\\LingStack-nexT\\release\\',
  }
}

/** 收集当前模型配置 */
function collectModel() {
  try {
    const mc = useModelConfigsStore()
    const cfg = mc.activeConfig
    if (cfg) {
      return {
        providerId: cfg.providerId ?? null,
        modelId: cfg.modelId ?? null,
        displayName: cfg.displayName ?? cfg.modelId ?? null,
      }
    }
  } catch { /* store 未初始化 */ }

  // fallback: 从 chat.service 读取
  const chatCfg = getChatConfig()
  return {
    providerId: chatCfg.providerType ?? null,
    modelId: chatCfg.model || null,
    displayName: chatCfg.model || null,
  }
}

/** 构建增强版 prompt 文本 */
function buildEnhancedPromptText(
  meta: SkillMeta,
  workspace: ReturnType<typeof collectWorkspace>,
  memory: ReturnType<typeof collectMemory>,
  knowledge: Awaited<ReturnType<typeof resolveKnowledgeAugmentation>>,
  model: ReturnType<typeof collectModel>,
): string {
  const lines: string[] = []

  // 1. Skill 指令（最核心）
  lines.push(`# Skill: ${meta.name}`)
  lines.push('')
  lines.push('## 指令')
  lines.push(meta.instructions)
  lines.push('')

  // 2. 工作区上下文
  lines.push('## 当前工作区上下文')
  lines.push(`- 项目: ${workspace.projectName ?? workspace.projectPath ?? '未打开'}`)
  if (workspace.projectPath) lines.push(`- 项目路径: ${workspace.projectPath}`)
  lines.push(`- 当前文件: ${workspace.activeFilePath ?? '无'}`)
  if (workspace.activeFileLanguage) lines.push(`- 文件语言: ${workspace.activeFileLanguage}`)
  if (workspace.openTabs.length > 0) {
    lines.push(`- 打开标签页: ${workspace.openTabs.map(t => `${t.fileName}${t.isActive ? '*' : ''}`).join(', ')}`)
  }
  if (workspace.activeFileContent) {
    lines.push('')
    lines.push('### 当前文件内容')
    lines.push('```')
    lines.push(workspace.activeFileContent)
    lines.push('```')
  }
  lines.push('')

  // 3. 记忆文件
  lines.push('## 记忆文件')
  lines.push(`- 协同共享记忆: ${memory.sharedMemoryPath}`)
  lines.push(`- 项目进度记忆: ${memory.projectMemoryPath}`)
  lines.push(`- 最新报告目录: ${memory.latestReportPath}`)
  lines.push('')

  // 4. 远程知识增强
  const totalKnowledge = knowledge.matchedRules.length + knowledge.matchedPrompts.length + knowledge.matchedGuidance.length
  if (totalKnowledge > 0) {
    lines.push('## 远程知识增强')
    for (const rule of knowledge.matchedRules) {
      lines.push(`### 规则: ${rule.name}`)
      if (rule.content) lines.push(rule.content)
      lines.push('')
    }
    for (const prompt of knowledge.matchedPrompts) {
      lines.push(`### 提示: ${prompt.name}`)
      if (prompt.content) lines.push(prompt.content)
      lines.push('')
    }
    for (const guidance of knowledge.matchedGuidance) {
      lines.push(`### 指导: ${guidance.name}`)
      if (guidance.content) lines.push(guidance.content)
      lines.push('')
    }
  }

  // 5. 模型信息
  lines.push('## 当前模型')
  lines.push(`- 模型: ${model.displayName ?? '未配置'}`)
  if (model.providerId) lines.push(`- 服务商: ${model.providerId}`)
  lines.push('')

  lines.push('---')
  lines.push(`生成时间: ${new Date().toISOString()}`)

  return lines.join('\n')
}

/** 构建注入摘要 */
function buildInjectionSummary(payload: SkillExecutionPayload): PayloadInjectionSummary {
  return {
    skillName: payload.skill.name,
    projectName: payload.workspace.projectName,
    activeFileName: payload.workspace.activeFileName,
    knowledgeRuleCount: payload.knowledge.matchedRules.length,
    knowledgePromptCount: payload.knowledge.matchedPrompts.length,
    knowledgeGuidanceCount: payload.knowledge.matchedGuidance.length,
    modelName: payload.model.displayName,
  }
}

// ========== 公开 API ==========

/**
 * 执行 skill — R25 统一执行调度器
 *
 * 流程：
 * 1. 收集 workspace context
 * 2. 解析 knowledge augmentation（异步，失败降级）
 * 3. 读取 memory paths
 * 4. 读取 model config
 * 5. 组装 SkillExecutionPayload
 * 6. 生成增强版 promptText
 */
export async function runSkill(
  meta: SkillMeta,
  onPhaseChange?: (phase: RunPhase) => void,
): Promise<RunResult> {
  try {
    // Phase 1: 收集工作区上下文
    onPhaseChange?.(RunPhase.Collecting)
    const workspace = collectWorkspace()
    const memory = collectMemory()
    const model = collectModel()

    // Phase 2: 解析远程知识增强
    onPhaseChange?.(RunPhase.KnowledgeSync)
    const knowledge = await resolveKnowledgeAugmentation(meta.id, meta.name)

    // Phase 3: 组装统一 payload
    onPhaseChange?.(RunPhase.Assembling)
    const promptText = buildEnhancedPromptText(meta, workspace, memory, knowledge, model)

    const payload: SkillExecutionPayload = {
      skill: {
        id: meta.id,
        name: meta.name,
        description: meta.description,
        instructions: meta.instructions,
        references: meta.references,
        sourcePath: meta.sourcePath,
      },
      workspace,
      memory,
      knowledge: {
        attempted: knowledge.attempted,
        matchedRules: knowledge.matchedRules.map(r => ({ ...r, type: 'rule' as const })),
        matchedPrompts: knowledge.matchedPrompts.map(p => ({ ...p, type: 'prompt' as const })),
        matchedGuidance: knowledge.matchedGuidance.map(g => ({ ...g, type: 'guidance' as const })),
        totalMatched: knowledge.matchedRules.length + knowledge.matchedPrompts.length + knowledge.matchedGuidance.length,
      },
      model,
      generatedAt: new Date().toISOString(),
      promptText,
    }

    return { phase: RunPhase.Done, payload, error: null }
  } catch (e: any) {
    return { phase: RunPhase.Error, payload: null, error: e.message ?? '未知执行错误' }
  }
}

/**
 * 仅收集上下文（不包含 skill 内容）— 供外部快速读取
 */
export function collectContext() {
  return {
    workspace: collectWorkspace(),
    memory: collectMemory(),
    model: collectModel(),
  }
}

export { buildInjectionSummary }
