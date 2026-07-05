/**
 * training-sync.types.ts — Distillation Alpha 同步数据类型
 *
 * 定义数据包结构、上传契约、同步元数据。
 * 上传的只能是 redacted dataset + manifest + metrics，绝不含 raw transcript。
 */

/** 数据包 manifest */
export interface DatasetManifest {
  /** 数据包 ID (UUID) */
  packageId: string
  /** 设备匿名 ID */
  deviceId: string
  /** 应用版本 */
  appVersion: string
  /** 创建时间 ISO */
  createdAt: string
  /** 总样本数 */
  sampleCount: number
  /** 已采纳数 */
  acceptedCount: number
  /** 已否决数 */
  rejectedCount: number
  /** 平均质量分 */
  avgQualityScore: number
  /** 包含的任务类型 */
  includedTaskTypes: string[]
  /** 脱敏规则版本 */
  redactionVersion: number
  /** 数据格式版本 */
  formatVersion: number
  /** 数据集文件 SHA256 */
  sha256: string
  /** 数据集文件名 */
  fileName: string
}

/** 聚合指标（不含 raw transcript） */
export interface DatasetMetrics {
  totalSamples: number
  highQualityCount: number
  acceptedCount: number
  rejectedCount: number
  avgQualityScore: number
  byTaskType: Record<string, number>
  generatedAt: string
}

/** 完整数据包 */
export interface DatasetPackage {
  manifest: DatasetManifest
  dataset: string  // JSONL string，只含 redacted SFT records
  metrics: DatasetMetrics
}

/** 上传请求体 */
export interface UploadRequest {
  manifest: DatasetManifest
  dataset: string
  metrics: DatasetMetrics
}

/** 上传响应 */
export interface UploadResponse {
  success: boolean
  packageId?: string
  message?: string
  error?: string
}

/** 本地同步状态 */
export interface SyncRecord {
  packageId: string
  fileName: string
  sampleCount: number
  uploadedAt: string
  status: 'pending' | 'uploading' | 'synced' | 'failed'
  error?: string
}

/** Training settings 配置 */
export interface TrainingSettings {
  /** 是否开启本地训练数据采集 */
  learningEnabled: boolean
  /** 是否允许上传脱敏数据到服务器 */
  uploadEnabled: boolean
  /** 上传服务器地址 */
  uploadBaseUrl: string
  /** 设备匿名 ID */
  deviceId: string
  /** 最近一次上传时间 */
  lastUploadAt: string | null
  /** 已上传样本数 */
  uploadedCount: number
  /** 已上传包数 */
  uploadedPackages: number
}

export const DEFAULT_TRAINING_SETTINGS: TrainingSettings = {
  learningEnabled: false,
  uploadEnabled: false,
  uploadBaseUrl: 'https://ai.tadanpay.cn/api/learning',
  deviceId: '',
  lastUploadAt: null,
  uploadedCount: 0,
  uploadedPackages: 0,
}

/** 脱敏规则版本号（递增，用于 manifest） */
export const REDACTION_VERSION = 2

/** 数据格式版本 */
export const FORMAT_VERSION = 1
