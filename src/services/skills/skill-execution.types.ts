/**
 * skill-execution.types.ts — 统一 Skill 执行 Payload 类型
 *
 * R25: Skill Runner / Knowledge Sync / Workspace Context 三链合流
 *
 * 所有 skill 执行最终产出一个 SkillExecutionPayload，
 * Chat 主链直接消费此对象，不再有三处散落拼字段。
 */

/** 远程知识增强条目 */
export interface KnowledgeMatch {
  id: string
  type: 'rule' | 'prompt' | 'skill' | 'guidance'
  name: string
  content?: string
}

/** 工作区上下文 */
export interface PayloadWorkspace {
  projectPath: string | null
  projectName: string | null
  activeFilePath: string | null
  activeFileName: string | null
  /** 截断后的文件内容 */
  activeFileContent: string | null
  activeFileLanguage: string | null
  openTabs: Array<{
    filePath: string
    fileName: string
    language?: string
    isActive?: boolean
  }>
  activeView: string
}

/** 记忆文件路径 */
export interface PayloadMemory {
  sharedMemoryPath: string | null
  projectMemoryPath: string | null
  latestReportPath: string | null
}

/** 远程知识增强 */
export interface PayloadKnowledge {
  /** 是否已尝试拉取 knowledge index */
  attempted: boolean
  /** 匹配到的远程规则 */
  matchedRules: KnowledgeMatch[]
  /** 匹配到的远程提示 */
  matchedPrompts: KnowledgeMatch[]
  /** 匹配到的远程 skill guidance */
  matchedGuidance: KnowledgeMatch[]
  /** 匹配总数 */
  totalMatched: number
}

/** 当前模型配置 */
export interface PayloadModel {
  providerId: string | null
  modelId: string | null
  displayName: string | null
}

/** 统一 Skill 执行 Payload — R25 核心类型 */
export interface SkillExecutionPayload {
  skill: {
    id: string
    name: string
    description: string
    instructions: string
    references: string[]
    sourcePath: string
  }
  workspace: PayloadWorkspace
  memory: PayloadMemory
  knowledge: PayloadKnowledge
  model: PayloadModel
  /** 生成时间 */
  generatedAt: string
  /** 可直接发送到 Chat 的完整 prompt 文本 */
  promptText: string
}

/** 注入摘要（供 UI 显示） */
export interface PayloadInjectionSummary {
  skillName: string
  projectName: string | null
  activeFileName: string | null
  knowledgeRuleCount: number
  knowledgePromptCount: number
  knowledgeGuidanceCount: number
  modelName: string | null
}
