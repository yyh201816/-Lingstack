/**
 * training-data.service.ts — 训练数据核心服务
 *
 * 职责：
 * - 创建 / 更新 TrainingSample
 * - 自动脱敏 + 质量评分
 * - localStorage 持久化（当前不训练，不上传云端）
 */

import type { TrainingSample, TaskType, ContextSnapshot, CodeTaskInfo, ImageTaskInfo } from './training-data.types'
import { redactSample } from './data-redaction.service'
import { computeQualityScore } from './quality-score.service'

/** ============================================
 *  localStorage 存储层
 *  ============================================ */
const LS_KEY = 'lingstack_training_samples'

function loadAll(): TrainingSample[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAll(samples: TrainingSample[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(samples))
  } catch (e) {
    console.warn('[TrainingData] Failed to persist samples:', e)
  }
}

/** ============================================
 *  CRUD 操作
 *  ============================================ */

export interface CreateSampleInput {
  taskType: TaskType
  sourceModel: string
  userInput: string
  systemPrompt: string
  contextSnapshot?: Partial<ContextSnapshot>
  modelOutput: string
}

/** 创建一条新的训练样本 */
export function createSample(input: CreateSampleInput): TrainingSample {
  const id = crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const now = new Date().toISOString()

  // 脱敏
  const redacted = redactSample({
    userInput: input.userInput,
    systemPrompt: input.systemPrompt,
    modelOutput: input.modelOutput,
    finalOutput: input.modelOutput,
  })

  const sample: TrainingSample = {
    id,
    taskType: input.taskType,
    sourceModel: input.sourceModel,
    userInput: redacted.userInput,
    systemPrompt: redacted.systemPrompt,
    contextSnapshot: {
      projectPath: input.contextSnapshot?.projectPath,
      activeFilePath: input.contextSnapshot?.activeFilePath,
      activeFileName: input.contextSnapshot?.activeFileName,
      fileContentTruncated: (input.contextSnapshot?.fileContentTruncated ?? '').slice(0, 2000),
      selectedText: input.contextSnapshot?.selectedText,
      openTabs: input.contextSnapshot?.openTabs,
    },
    modelOutput: redacted.modelOutput,
    finalOutput: redacted.finalOutput,
    userFeedback: '',
    accepted: false,
    rejected: false,
    regenerated: false,
    editedByUser: '',
    success: true,
    qualityScore: 0,
    createdAt: now,
    updatedAt: now,
    copied: false,
  }

  // 质量评分
  const { score } = computeQualityScore(sample)
  sample.qualityScore = score

  // 持久化
  const all = loadAll()
  all.push(sample)
  saveAll(all)

  return sample
}

/** 更新已有样本 */
export function updateSample(id: string, patch: Partial<TrainingSample> & { codeTask?: Partial<CodeTaskInfo>; imageTask?: Partial<ImageTaskInfo> }): TrainingSample | null {
  const all = loadAll()
  const idx = all.findIndex((s) => s.id === id)
  if (idx === -1) return null

  const existing = all[idx]

  // 合并 codeTask
  if (patch.codeTask && existing.codeTask) {
    patch.codeTask = { ...existing.codeTask, ...patch.codeTask }
  }

  // 合并 imageTask
  if (patch.imageTask && existing.imageTask) {
    patch.imageTask = { ...existing.imageTask, ...patch.imageTask }
  }

  const updated: TrainingSample = {
    ...existing,
    ...patch,
    codeTask: (patch.codeTask ?? existing.codeTask) as CodeTaskInfo | undefined,
    imageTask: (patch.imageTask ?? existing.imageTask) as ImageTaskInfo | undefined,
    updatedAt: new Date().toISOString(),
  }

  // 重新计算质量分
  const { score } = computeQualityScore(updated)
  updated.qualityScore = score

  all[idx] = updated
  saveAll(all)

  return updated
}

/** 标记样本已采纳 */
export function markAccepted(id: string): TrainingSample | null {
  return updateSample(id, { accepted: true, rejected: false })
}

/** 标记样本已否决 */
export function markRejected(id: string): TrainingSample | null {
  return updateSample(id, { rejected: true, accepted: false })
}

/** 标记用户复制了输出 */
export function markCopied(id: string): TrainingSample | null {
  return updateSample(id, { copied: true })
}

/** 标记重新生成 */
export function markRegenerated(id: string, newModelOutput: string): TrainingSample | null {
  const redacted = redactSample({ userInput: '', systemPrompt: '', modelOutput: newModelOutput, finalOutput: newModelOutput })
  return updateSample(id, { regenerated: true, modelOutput: redacted.modelOutput, finalOutput: redacted.finalOutput })
}

/** 查询所有样本 */
export function getAllSamples(): TrainingSample[] {
  return loadAll()
}

/** 查询高质量样本 */
export function getHighQualitySamples(minScore = 5): TrainingSample[] {
  return loadAll().filter((s) => s.qualityScore >= minScore)
}

/** 按任务类型查询 */
export function getByTaskType(type: TaskType): TrainingSample[] {
  return loadAll().filter((s) => s.taskType === type)
}

/** 按日期范围查询 */
export function getByDateRange(start: string, end: string): TrainingSample[] {
  return loadAll().filter((s) => s.createdAt >= start && s.createdAt <= end)
}

/** 获取统计信息 */
export function getStats() {
  const all = loadAll()
  return {
    totalSamples: all.length,
    highQualityCount: all.filter((s) => s.qualityScore >= 5).length,
    byTaskType: all.reduce((acc, s) => {
      acc[s.taskType] = (acc[s.taskType] ?? 0) + 1
      return acc
    }, {} as Record<string, number>),
    acceptedCount: all.filter((s) => s.accepted).length,
    rejectedCount: all.filter((s) => s.rejected).length,
    avgQualityScore: all.length > 0 ? all.reduce((sum, s) => sum + s.qualityScore, 0) / all.length : 0,
    lastUpdated: all.length > 0 ? all[all.length - 1].updatedAt : null,
  }
}

/** 清空所有训练数据 */
export function clearAll(): void {
  try { localStorage.removeItem(LS_KEY) } catch { /* ignore */ }
}
