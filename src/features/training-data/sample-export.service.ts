/**
 * sample-export.service.ts — 样本导出服务
 *
 * 支持将高质量样本导出为 JSONL 格式，
 * 为未来 SFT / DPO / 蒸馏训练准备数据。
 *
 * 当前本地执行，不上传云端。
 */

import type { TrainingSample } from './training-data.types'
import { getHighQualitySamples, getAllSamples, getByTaskType, getByDateRange } from './training-data.service'
import { isHighQuality } from './quality-score.service'

// ====================================================================
// SFT 格式（单轮指令调优）
// ====================================================================
export interface SFTRecord {
  instruction: string
  input: string
  output: string
  system?: string
  metadata: {
    id: string
    taskType: string
    sourceModel: string
    qualityScore: number
    createdAt: string
  }
}

function toSFTRecord(sample: TrainingSample): SFTRecord {
  return {
    instruction: sample.userInput,
    input: '',  // 额外上下文由 instruction 承载
    output: sample.finalOutput || sample.modelOutput,
    system: sample.systemPrompt || undefined,
    metadata: {
      id: sample.id,
      taskType: sample.taskType,
      sourceModel: sample.sourceModel,
      qualityScore: sample.qualityScore,
      createdAt: sample.createdAt,
    },
  }
}

// ====================================================================
// DPO 格式（偏好对齐）
// ====================================================================
export interface DPORecord {
  prompt: string
  chosen: string    // 被采纳的回答
  rejected: string  // 被否决的回答
  metadata: {
    id: string
    taskType: string
    sourceModel: string
  }
}

function toDPORecord(sample: TrainingSample): DPORecord | null {
  if (!sample.accepted || !sample.modelOutput) return null
  // DPO 需要一对 chosen/rejected，当前只有 chosen
  // 后续可从 regenerated 历史中提取 rejected
  return {
    prompt: sample.userInput,
    chosen: sample.finalOutput || sample.modelOutput,
    rejected: '',  // 需要在多次 regenerate 中收集
    metadata: {
      id: sample.id,
      taskType: sample.taskType,
      sourceModel: sample.sourceModel,
    },
  }
}

// ====================================================================
// JSONL 导出
// ====================================================================

export type ExportFormat = 'sft' | 'dpo' | 'raw'

export interface ExportResult {
  jsonl: string
  count: number
  format: ExportFormat
  filter: string
}

function toJSONL(records: any[]): string {
  return records.map((r) => JSON.stringify(r)).join('\n')
}

/** 导出高质量样本为 JSONL */
export function exportHighQuality(format: ExportFormat = 'sft'): ExportResult {
  const samples = getHighQualitySamples(5)

  if (format === 'sft') {
    const records = samples.map(toSFTRecord)
    return { jsonl: toJSONL(records), count: records.length, format: 'sft', filter: 'qualityScore >= 5' }
  }

  if (format === 'dpo') {
    const records = samples.map(toDPORecord).filter(Boolean) as DPORecord[]
    return { jsonl: toJSONL(records), count: records.length, format: 'dpo', filter: 'qualityScore >= 5 + accepted' }
  }

  // raw
  return { jsonl: toJSONL(samples), count: samples.length, format: 'raw', filter: 'qualityScore >= 5' }
}

/** 按任务类型导出 */
export function exportByTaskType(taskType: string, format: ExportFormat = 'sft'): ExportResult {
  const samples = getByTaskType(taskType as any).filter(isHighQuality)

  if (format === 'sft') {
    const records = samples.map(toSFTRecord)
    return { jsonl: toJSONL(records), count: records.length, format: 'sft', filter: `taskType=${taskType}` }
  }

  if (format === 'dpo') {
    const records = samples.map(toDPORecord).filter(Boolean) as DPORecord[]
    return { jsonl: toJSONL(records), count: records.length, format: 'dpo', filter: `taskType=${taskType}` }
  }

  return { jsonl: toJSONL(samples), count: samples.length, format: 'raw', filter: `taskType=${taskType}` }
}

/** 导出全部样本 */
export function exportAll(format: ExportFormat = 'raw'): ExportResult {
  const samples = getAllSamples()
  if (format === 'sft') {
    const records = samples.map(toSFTRecord)
    return { jsonl: toJSONL(records), count: records.length, format: 'sft', filter: 'all' }
  }
  return { jsonl: toJSONL(samples), count: samples.length, format: 'raw', filter: 'all' }
}

/** 按日期范围导出 */
export function exportByDateRange(start: string, end: string, format: ExportFormat = 'sft'): ExportResult {
  const samples = getByDateRange(start, end).filter(isHighQuality)
  if (format === 'sft') {
    const records = samples.map(toSFTRecord)
    return { jsonl: toJSONL(records), count: records.length, format: 'sft', filter: `${start} ~ ${end}` }
  }
  return { jsonl: toJSONL(samples), count: samples.length, format: 'raw', filter: `${start} ~ ${end}` }
}

/** 下载 JSONL 文件（浏览器环境） */
export function downloadJSONL(result: ExportResult, filename?: string): void {
  const name = filename ?? `lingstack-${result.format}-${result.count}samples-${new Date().toISOString().slice(0, 10)}.jsonl`
  const blob = new Blob([result.jsonl], { type: 'application/jsonl' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
