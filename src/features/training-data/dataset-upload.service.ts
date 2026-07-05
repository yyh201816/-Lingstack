/**
 * dataset-upload.service.ts — 数据集上传服务
 *
 * 将打包好的 redacted dataset 上传到服务器。
 * 支持 mock endpoint 用于前端流程验证。
 */

import type { DatasetPackage, UploadRequest, UploadResponse, SyncRecord } from './training-sync.types'
import { useTrainingSettingsStore } from './training-settings.store'

/** R32: 是否使用 mock endpoint（无真实服务器时） */
const USE_MOCK = false

/** mock 上传延迟 */
const MOCK_DELAY_MS = 800

/** Mock 上传：模拟成功响应 */
async function mockUpload(_request: UploadRequest): Promise<UploadResponse> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
  return { success: true, packageId: _request.manifest.packageId, message: 'Mock: dataset received' }
}

/** 真实上传 */
async function realUpload(request: UploadRequest, baseUrl: string): Promise<UploadResponse> {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error')
    return { success: false, error: `Upload failed (${response.status}): ${text}` }
  }

  try {
    return await response.json()
  } catch {
    return { success: true, message: 'Uploaded (no response body)' }
  }
}

/** 上传数据包 */
export async function uploadDatasetPackage(pkg: DatasetPackage): Promise<{ success: boolean; error?: string }> {
  const settingsStore = useTrainingSettingsStore()

  // 校验上传开关
  if (!settingsStore.isUploadEnabled) {
    return { success: false, error: '上传开关未开启，请在设置中开启 Learning Upload' }
  }

  // 校验样本数
  if (!pkg.dataset || pkg.dataset.trim().length === 0) {
    return { success: false, error: '数据集为空，无内容可上传' }
  }

  const request: UploadRequest = {
    manifest: pkg.manifest,
    dataset: pkg.dataset,
    metrics: pkg.metrics,
  }

  // 记录同步状态
  const syncRecord: SyncRecord = {
    packageId: pkg.manifest.packageId,
    fileName: pkg.manifest.fileName,
    sampleCount: pkg.manifest.sampleCount,
    uploadedAt: new Date().toISOString(),
    status: 'uploading',
  }
  settingsStore.addSyncRecord(syncRecord)

  try {
    const response = USE_MOCK
      ? await mockUpload(request)
      : await realUpload(request, settingsStore.settings.uploadBaseUrl)

    if (response.success) {
      settingsStore.markUploaded(pkg.manifest.packageId, pkg.manifest.sampleCount)
      return { success: true }
    } else {
      settingsStore.markUploadFailed(pkg.manifest.packageId, response.error || 'Unknown error')
      return { success: false, error: response.error || 'Upload failed' }
    }
  } catch (err) {
    const errorMsg = (err as Error).message || 'Network error'
    settingsStore.markUploadFailed(pkg.manifest.packageId, errorMsg)
    return { success: false, error: errorMsg }
  }
}
