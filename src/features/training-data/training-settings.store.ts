/**
 * training-settings.store.ts — 训练/学习设置 Store
 *
 * 管理 Learning Mode 开关、上传开关、设备 ID、同步记录等。
 * 持久化到 localStorage。
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { TrainingSettings, SyncRecord } from './training-sync.types'
import { DEFAULT_TRAINING_SETTINGS } from './training-sync.types'

const LS_SETTINGS_KEY = 'lingstack_training_settings'
const LS_SYNC_KEY = 'lingstack_training_sync_records'

/** 生成或读取设备匿名 ID */
function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem('lingstack_device_id')
    if (!id) {
      const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      id = 'dev_' + uuid
      localStorage.setItem('lingstack_device_id', id)
    }
    return id
  } catch {
    return 'dev_fallback'
  }
}

export const useTrainingSettingsStore = defineStore('training-settings', () => {
  // ---- State ----
  const settings = ref<TrainingSettings>({ ...DEFAULT_TRAINING_SETTINGS })
  const syncRecords = ref<SyncRecord[]>([])

  // ---- Init ----
  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(LS_SETTINGS_KEY)
      if (raw) {
        settings.value = { ...DEFAULT_TRAINING_SETTINGS, ...JSON.parse(raw) }
      }
    } catch { /* ignore */ }

    // 确保设备 ID 存在
    if (!settings.value.deviceId) {
      settings.value.deviceId = getOrCreateDeviceId()
    }

    try {
      const rawSync = localStorage.getItem(LS_SYNC_KEY)
      if (rawSync) syncRecords.value = JSON.parse(rawSync)
    } catch { /* ignore */ }
  }

  function persist() {
    try { localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings.value)) } catch { /* ignore */ }
    try { localStorage.setItem(LS_SYNC_KEY, JSON.stringify(syncRecords.value)) } catch { /* ignore */ }
  }

  // auto-persist
  watch(settings, persist, { deep: true })
  watch(syncRecords, persist, { deep: true })

  // ---- Getters ----
  const isLearningEnabled = computed(() => settings.value.learningEnabled)
  const isUploadEnabled = computed(() => settings.value.uploadEnabled)
  const deviceId = computed(() => settings.value.deviceId)
  const lastUploadAt = computed(() => settings.value.lastUploadAt)
  const uploadedCount = computed(() => settings.value.uploadedCount)
  const pendingCount = computed(() => syncRecords.value.filter((r) => r.status === 'pending').length)
  const syncedCount = computed(() => syncRecords.value.filter((r) => r.status === 'synced').length)
  const failedCount = computed(() => syncRecords.value.filter((r) => r.status === 'failed').length)

  // ---- Actions ----
  function setLearningEnabled(enabled: boolean) {
    settings.value.learningEnabled = enabled
  }

  function setUploadEnabled(enabled: boolean) {
    settings.value.uploadEnabled = enabled
  }

  function setUploadBaseUrl(url: string) {
    settings.value.uploadBaseUrl = url
  }

  function addSyncRecord(record: SyncRecord) {
    syncRecords.value.push(record)
  }

  function updateSyncRecord(packageId: string, patch: Partial<SyncRecord>) {
    const idx = syncRecords.value.findIndex((r) => r.packageId === packageId)
    if (idx !== -1) {
      syncRecords.value[idx] = { ...syncRecords.value[idx], ...patch }
    }
  }

  function markUploaded(packageId: string, sampleCount: number) {
    updateSyncRecord(packageId, { status: 'synced' })
    settings.value.lastUploadAt = new Date().toISOString()
    settings.value.uploadedCount += sampleCount
    settings.value.uploadedPackages += 1
  }

  function markUploadFailed(packageId: string, error: string) {
    updateSyncRecord(packageId, { status: 'failed', error })
  }

  function clearAllSyncRecords() {
    syncRecords.value = []
  }

  function resetSettings() {
    settings.value = { ...DEFAULT_TRAINING_SETTINGS, deviceId: settings.value.deviceId }
    syncRecords.value = []
  }

  // Init on first use
  loadFromStorage()

  return {
    settings,
    syncRecords,
    isLearningEnabled,
    isUploadEnabled,
    deviceId,
    lastUploadAt,
    uploadedCount,
    pendingCount,
    syncedCount,
    failedCount,
    setLearningEnabled,
    setUploadEnabled,
    setUploadBaseUrl,
    addSyncRecord,
    updateSyncRecord,
    markUploaded,
    markUploadFailed,
    clearAllSyncRecords,
    resetSettings,
    loadFromStorage,
  }
})
