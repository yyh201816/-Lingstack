/**
 * R26 — 自修复任务闭环数据结构
 *
 * 三层结构：
 *   SelfHealExecutionResult — 单次 skill 执行的结构化结果
 *   SelfHealTaskItem        — 从执行结果中抽取的任务项
 *   ValidationRecord        — 任务的验证记录
 */

// ========== Skill 执行结果 ==========

export interface SelfHealParsed {
  currentPhase?: string
  chosenTarget?: string
  scopeBoundary?: string[]
  concreteChanges?: string[]
  validation?: string[]
  nextStep?: string
}

export interface SelfHealExecutionResult {
  /** 执行 ID */
  id: string
  /** 关联 skill ID */
  skillId: string
  /** 原始输出文本 */
  rawOutput: string
  /** 结构化解析结果 */
  parsed: SelfHealParsed
  /** 生成的任务项 ID 列表 */
  taskIds: string[]
  /** 执行时间 */
  createdAt: string
}

// ========== 任务项 ==========

export type TaskStatus = 'todo' | 'accepted' | 'done' | 'skipped' | 'failed'
export type TaskPriority = 'P0' | 'P1' | 'P2'
export type TaskType = 'fix' | 'validate' | 'cleanup' | 'connect' | 'hide'

export interface SelfHealTaskItem {
  /** 任务 ID */
  id: string
  /** 关联执行 ID */
  executionId: string
  /** 任务标题 */
  title: string
  /** 任务描述 */
  description?: string
  /** 任务类型 */
  type: TaskType
  /** 优先级 */
  priority: TaskPriority
  /** 当前状态 */
  status: TaskStatus
  /** 涉及的文件 */
  targetFiles?: string[]
  /** 验证步骤 */
  validationSteps?: string[]
  /** 用户备注 */
  resultNote?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

// ========== 验证记录 ==========

export type ValidationMethod = 'manual' | 'build' | 'workflow'

export interface ValidationRecord {
  /** 验证 ID */
  id: string
  /** 关联任务 ID */
  taskId: string
  /** 验证方式 */
  method: ValidationMethod
  /** 是否通过 */
  passed: boolean
  /** 备注 */
  note?: string
  /** 验证时间 */
  createdAt: string
}

// ========== 持久化容器 ==========

export interface SelfHealState {
  /** 所有执行记录 */
  executions: SelfHealExecutionResult[]
  /** 所有任务 */
  tasks: SelfHealTaskItem[]
  /** 所有验证记录 */
  validations: ValidationRecord[]
  /** 当前活跃执行 ID */
  activeExecutionId: string | null
}
