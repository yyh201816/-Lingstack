/**
 * cloud-sync.store.ts — Phase 14
 * Unified cloud sync state management for beta ops entities
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type {
  SyncRecord,
  SyncEntityType,
  SyncStatus,
  ConflictState,
  SyncSummary,
} from '../types'

const STORAGE_KEY = 'lingstack_cloud_sync_records'

function loadRecords(): SyncRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SyncRecord[]
  } catch {
    return []
  }
}

function saveRecords(records: SyncRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const useCloudSyncStore = defineStore('cloudSync', () => {
  const records = ref<SyncRecord[]>(loadRecords())
  const isSyncing = ref(false)
  const lastFullSync = ref<string | null>(null)

  // ── computed ──

  const summary = computed<SyncSummary>(() => ({
    totalRecords: records.value.length,
    syncedCount: records.value.filter(r => r.syncStatus === 'synced').length,
    pendingCount: records.value.filter(r => r.syncStatus === 'pending-upload').length,
    failedCount: records.value.filter(r => r.syncStatus === 'sync-failed').length,
    conflictCount: records.value.filter(r => r.conflictState !== 'none').length,
    lastFullSync: lastFullSync.value,
    isSyncing: isSyncing.value,
  }))

  const pendingRecords = computed(() =>
    records.value.filter(r => r.syncStatus === 'pending-upload'),
  )

  const failedRecords = computed(() =>
    records.value.filter(r => r.syncStatus === 'sync-failed'),
  )

  const recordsByType = computed(() => {
    const map: Record<string, SyncRecord[]> = {}
    for (const r of records.value) {
      if (!map[r.entityType]) map[r.entityType] = []
      map[r.entityType].push(r)
    }
    return map
  })

  // ── actions ──

  function findOrCreate(entityType: SyncEntityType, entityId: string): SyncRecord {
    const existing = records.value.find(
      r => r.entityType === entityType && r.entityId === entityId,
    )
    if (existing) return existing

    const now = new Date().toISOString()
    const record: SyncRecord = {
      id: `sync_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      entityType,
      entityId,
      version: 1,
      updatedAt: now,
      syncStatus: 'local-only',
      lastSyncAt: null,
      conflictState: 'none',
      remoteUpdatedAt: null,
      lastError: null,
      retryCount: 0,
    }
    records.value.push(record)
    saveRecords(records.value)
    return record
  }

  function markForUpload(entityType: SyncEntityType, entityId: string) {
    const record = findOrCreate(entityType, entityId)
    if (record.syncStatus === 'synced' || record.syncStatus === 'local-only') {
      record.syncStatus = 'pending-upload'
      record.version += 1
      record.updatedAt = new Date().toISOString()
      saveRecords(records.value)
    }
  }

  function markSynced(entityType: SyncEntityType, entityId: string, remoteUpdatedAt?: string) {
    const record = findOrCreate(entityType, entityId)
    record.syncStatus = 'synced'
    record.lastSyncAt = new Date().toISOString()
    record.remoteUpdatedAt = remoteUpdatedAt ?? null
    record.conflictState = 'none'
    record.lastError = null
    record.retryCount = 0
    saveRecords(records.value)
  }

  function markFailed(entityType: SyncEntityType, entityId: string, error: string) {
    const record = findOrCreate(entityType, entityId)
    record.syncStatus = 'sync-failed'
    record.lastError = error
    record.retryCount += 1
    record.updatedAt = new Date().toISOString()
    saveRecords(records.value)
  }

  function markConflict(entityType: SyncEntityType, entityId: string, state: ConflictState) {
    const record = findOrCreate(entityType, entityId)
    record.syncStatus = 'conflict'
    record.conflictState = state
    record.updatedAt = new Date().toISOString()
    saveRecords(records.value)
  }

  function setSyncStatus(status: SyncStatus) {
    isSyncing.value = status === 'pending-upload'
  }

  function setLastFullSync(time: string) {
    lastFullSync.value = time
  }

  function retryAllFailed() {
    for (const r of records.value) {
      if (r.syncStatus === 'sync-failed') {
        r.syncStatus = 'pending-upload'
        r.lastError = null
      }
    }
    saveRecords(records.value)
  }

  function getRecordsForType(entityType: SyncEntityType): SyncRecord[] {
    return records.value.filter(r => r.entityType === entityType)
  }

  function clearSyncData() {
    records.value = []
    lastFullSync.value = null
    saveRecords(records.value)
  }

  return {
    records,
    isSyncing,
    lastFullSync,
    summary,
    pendingRecords,
    failedRecords,
    recordsByType,
    findOrCreate,
    markForUpload,
    markSynced,
    markFailed,
    markConflict,
    setSyncStatus,
    setLastFullSync,
    retryAllFailed,
    getRecordsForType,
    clearSyncData,
  }
})
