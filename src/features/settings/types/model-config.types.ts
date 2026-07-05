/**
 * R22 — 统一模型配置 Schema
 *
 * Provider / Model / UserModelConfig 三层结构：
 *   ProviderMeta  — 预置服务商元数据（只读，硬编码）
 *   ModelMeta     — 预置模型元数据（只读，硬编码）
 *   UserModelConfig — 用户保存的模型配置（读写，localStorage 持久化）
 *
 * 设计原则：
 *   - 预置服务商模式和自定义配置模式落同一套 UserModelConfig
 *   - Chat 主链通过 activeConfigId 读取当前选中配置
 *   - 后续扩展只需加 ProviderMeta 条目，不改消费结构
 */

// ========== API 格式 ==========

export type ApiFormat = 'openai-chat-completions' | 'anthropic-messages'

// ========== 预置服务商 ==========

export interface ProviderMeta {
  /** 唯一标识 */
  id: string
  /** 显示名称 */
  name: string
  /** 图标（emoji 或组件名） */
  icon: string
  /** 默认 Base URL */
  baseUrl: string
  /** API 格式 */
  apiFormat: ApiFormat
  /** 获取 API Key 的链接 */
  apiKeyUrl?: string
  /** 预置模型列表 */
  models: ModelMeta[]
  /** 品牌色（可选，用于卡片装饰） */
  brandColor?: string
  /** 是否允许用户手动输入该厂商的 modelId（不限于预置列表） */
  allowCustomModelId?: boolean
}

// ========== 预置模型 ==========

export interface ModelMeta {
  /** 唯一标识 */
  id: string
  /** 显示名称 */
  label: string
  /** 所属服务商 ID */
  providerId: string
  /** 模型系列 */
  family: string
  /** 输入上下文窗口（tokens） */
  contextWindowIn: number
  /** 输出上下文窗口（tokens） */
  contextWindowOut: number
  /** 是否支持工具调用 */
  supportsTools: boolean
  /** 是否支持视觉/多模态 */
  supportsVision: boolean
}

// ========== 用户模型配置 ==========

export interface UserModelConfig {
  /** 唯一 ID */
  id: string
  /** 来源服务商 ID（自定义为 'custom'） */
  providerId: string
  /** 模型 ID */
  modelId: string
  /** 用户给的显示名称 */
  displayName: string
  /** API Key */
  apiKey: string
  /** Base URL（覆盖 provider 默认值） */
  baseUrl: string
  /** API 格式 */
  apiFormat: ApiFormat
  /** 模型系列 */
  modelFamily: string
  /** 输入上下文窗口 */
  inputContextWindow: number
  /** 输出上下文窗口 */
  outputContextWindow: number
  /** 工具调用轮次上限 */
  toolCallBudget: number
  /** 是否启用多模态 */
  multimodalEnabled: boolean
  /** 是否启用（可用于切换） */
  enabled: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

// ========== 持久化容器 ==========

export interface ModelConfigsState {
  /** 所有用户配置 */
  configs: UserModelConfig[]
  /** 当前激活配置 ID */
  activeConfigId: string | null
}
