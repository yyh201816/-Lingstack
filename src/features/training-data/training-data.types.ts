/**
 * Training Data Layer — 类型定义
 *
 * 结构化记录用户在灵栈中的 AI 使用过程，
 * 为未来 SFT / DPO / 蒸馏自有模型准备训练数据。
 *
 * 当前不训练模型，只做本地结构化记录。
 */

// ====================================================================
// 任务类型
// ====================================================================
export type TaskType =
  | 'chat'
  | 'code_modify'
  | 'code_review'
  | 'shell_debug'
  | 'image_prompt'
  | 'image_generate'
  | 'skill_execution'
  | 'agent_task'
  | 'context_build'
  | 'model_routing'

// ====================================================================
// 代码任务扩展字段
// ====================================================================
export interface CodeTaskInfo {
  relatedFiles: string[]
  diffText: string
  applied: boolean
  buildPassed: boolean
  rollback: boolean
}

// ====================================================================
// 图片生成任务扩展字段
// ====================================================================
export interface ImageTaskInfo {
  originalPrompt: string
  optimizedPrompt: string
  imageModel: string
  selectedImageIndex: number
  revisionRequest: string
}

// ====================================================================
// 上下文快照
// ====================================================================
export interface ContextSnapshot {
  projectPath?: string
  activeFilePath?: string
  activeFileName?: string
  fileContentTruncated?: string  // 截断到 2000 字符
  selectedText?: string
  openTabs?: number
}

// ====================================================================
// 核心样本类型
// ====================================================================
export interface TrainingSample {
  /** UUID v4 */
  id: string
  /** 任务类型 */
  taskType: TaskType
  /** 来源模型 */
  sourceModel: string
  /** 用户原始输入 */
  userInput: string
  /** 系统提示词 */
  systemPrompt: string
  /** 工作台上下文快照 */
  contextSnapshot: ContextSnapshot
  /** 模型原始输出 */
  modelOutput: string
  /** 最终呈现给用户的输出（可能经过脱敏/裁剪） */
  finalOutput: string
  /** 用户反馈文本 */
  userFeedback: string
  /** 用户采纳了回答 */
  accepted: boolean
  /** 用户否决了回答 */
  rejected: boolean
  /** 用户请求重新生成 */
  regenerated: boolean
  /** 用户手动编辑了回答 */
  editedByUser: string
  /** 任务是否成功 */
  success: boolean
  /** 质量评分 */
  qualityScore: number
  /** 创建时间（ISO string） */
  createdAt: string
  /** 更新时间（ISO string） */
  updatedAt: string
  /** 用户复制了回答 */
  copied: boolean
  /** 代码任务扩展信息 */
  codeTask?: CodeTaskInfo
  /** 图片生成任务扩展信息 */
  imageTask?: ImageTaskInfo
}

// ====================================================================
// 存储元数据
// ====================================================================
export interface TrainingDataMeta {
  /** 总样本数 */
  totalSamples: number
  /** 高质量样本数（qualityScore >= 5） */
  highQualityCount: number
  /** 最近更新时间 */
  lastUpdated: string
}
