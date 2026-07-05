/**
 * dataset-package.service.ts — 数据集打包服务
 *
 * 从本地高质量训练样本生成 redacted dataset package。
 * 严禁包含 raw transcript / API Key / 密码等敏感信息。
 */

import type { DatasetManifest, DatasetMetrics, DatasetPackage } from './training-sync.types'
import { REDACTION_VERSION, FORMAT_VERSION } from './training-sync.types'
import type { TrainingSample } from './training-data.types'
import { getHighQualitySamples } from './training-data.service'
import { redactText, detectSensitiveContent } from './data-redaction.service'
import { useTrainingSettingsStore } from './training-settings.store'

/** 计算 SHA256（Web Crypto API） */
async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** 样本 → SFT Record（redacted） */
function sampleToSFTRecord(sample: TrainingSample): Record<string, unknown> {
  return {
    instruction: redactText(sample.userInput),
    output: redactText(sample.finalOutput || sample.modelOutput),
    system: sample.systemPrompt ? redactText(sample.systemPrompt) : undefined,
    metadata: {
      id: sample.id,
      taskType: sample.taskType,
      sourceModel: sample.sourceModel,
      qualityScore: sample.qualityScore,
      accepted: sample.accepted,
      success: sample.success,
      createdAt: sample.createdAt,
    },
  }
}

/** 聚合指标（不含 raw transcript） */
function computeMetrics(samples: TrainingSample[]): DatasetMetrics {
  return {
    totalSamples: samples.length,
    highQualityCount: samples.filter((s) => s.qualityScore >= 5).length,
    acceptedCount: samples.filter((s) => s.accepted).length,
    rejectedCount: samples.filter((s) => s.rejected).length,
    avgQualityScore: samples.length > 0
      ? +(samples.reduce((sum, s) => sum + s.qualityScore, 0) / samples.length).toFixed(2)
      : 0,
    byTaskType: samples.reduce((acc, s) => {
      acc[s.taskType] = (acc[s.taskType] ?? 0) + 1
      return acc
    }, {} as Record<string, number>),
    generatedAt: new Date().toISOString(),
  }
}

/** 打包高质量样本为 DatasetPackage */
export async function buildDatasetPackage(minScore = 5): Promise<DatasetPackage | null> {
  const settingsStore = useTrainingSettingsStore()

  const samples = getHighQualitySamples(minScore)
  if (samples.length === 0) return null

  // 二次脱敏 + 检测
  const sftRecords = samples.map(sampleToSFTRecord)

  // 逐条检查是否包含可疑敏感信息，跳过有问题的
  const cleanRecords = sftRecords.filter((record) => {
    const text = JSON.stringify(record)
    const issues = detectSensitiveContent(text)
    return issues.length === 0
  })

  if (cleanRecords.length === 0) return null

  const datasetJsonl = cleanRecords.map((r) => JSON.stringify(r)).join('\n')
  const hash = await sha256(datasetJsonl)
  const metrics = computeMetrics(samples)
  const now = new Date().toISOString()
  const dateStr = now.slice(0, 10)
  const deviceShort = settingsStore.deviceId.slice(4, 12)
  const fileName = `lingstack-distill-${dateStr}-${deviceShort}-${cleanRecords.length}.json`

  const manifest: DatasetManifest = {
    packageId: crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    deviceId: settingsStore.deviceId,
    appVersion: (await import('../../../package.json')).version ?? '0.1.4',
    createdAt: now,
    sampleCount: cleanRecords.length,
    acceptedCount: samples.filter((s) => s.accepted).length,
    rejectedCount: samples.filter((s) => s.rejected).length,
    avgQualityScore: metrics.avgQualityScore,
    includedTaskTypes: [...new Set(samples.map((s) => s.taskType))],
    redactionVersion: REDACTION_VERSION,
    formatVersion: FORMAT_VERSION,
    sha256: hash,
    fileName,
  }

  return { manifest, dataset: datasetJsonl, metrics }
}
