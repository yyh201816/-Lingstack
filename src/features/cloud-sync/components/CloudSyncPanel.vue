<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCloudSyncStore } from '../store/cloud-sync.store'
import { SYNC_ENTITY_LABELS, SYNC_STATUS_LABELS, CONFLICT_STATE_LABELS } from '../types'
import type { SyncEntityType } from '../types'
import { performFullSync, checkSyncHealth, getCloudSyncConfig } from '../services/cloud-sync.service'
import { Cloud, CloudOff, RefreshCw, AlertTriangle, Check, Wifi, Clock } from 'lucide-vue-next'

const store = useCloudSyncStore()
const syncing = ref(false)
const health = ref<{ reachable: boolean; latencyMs: number; error?: string } | null>(null)
const healthError = ref('')

const config = getCloudSyncConfig()

async function handleFullSync() {
  syncing.value = true
  store.setSyncStatus('pending-upload')
  try {
    const result = await performFullSync()
    if (result.uploaded.length + result.conflicts.length + result.failed.length === 0 && result.pulled === 0) {
      // Local-only mode: mark test pass
      store.setLastFullSync(new Date().toISOString())
    }
  } catch (e: unknown) {
    /* errors already handled per-record in service */
  } finally {
    syncing.value = false
  }
}

async function handleHealthCheck() {
  health.value = null
  healthError.value = ''
  try {
    health.value = await checkSyncHealth()
  } catch (e: unknown) {
    healthError.value = e instanceof Error ? e.message : String(e)
  }
}

const statusBadgeClass = (s: string): string => {
  switch (s) {
    case 'synced': return 'badge--ok'
    case 'pending-upload': return 'badge--warn'
    case 'sync-failed': return 'badge--err'
    case 'conflict': return 'badge--err'
    default: return 'badge--dim'
  }
}

const entityTypes: SyncEntityType[] = [
  'beta_instance', 'beta_user', 'feedback', 'bootstrap_task',
  'beta_iteration', 'release_record', 'quality_score', 'release_plan',
]
</script>

<template>
  <div class="sync-panel">
    <div class="sync__header">
      <div class="sync__title">
        <CloudOff v-if="!config.enabled" :size="15" class="sync__title-icon--dim" />
        <Cloud v-else :size="15" />
        <span>Cloud Sync</span>
        <span v-if="!config.enabled" class="sync__tag sync__tag--off">OFF</span>
      </div>
      <div class="sync__actions">
        <button class="sync__btn sync__btn--ghost" @click="handleHealthCheck" title="Check server health">
          <Wifi :size="12" />
        </button>
        <button class="sync__btn sync__btn--primary" @click="handleFullSync" :disabled="syncing || !config.enabled">
          <RefreshCw :size="13" :class="{ 'sync__spin': syncing }" />
          <span>{{ syncing ? 'Syncing...' : 'Sync Now' }}</span>
        </button>
      </div>
    </div>

    <!-- Config notice -->
    <div v-if="!config.enabled" class="sync__notice">
      <CloudOff :size="13" />
      <span>Cloud sync is disabled. Enable it in config when the server is ready.</span>
    </div>

    <!-- Health check result -->
    <div v-if="health" class="sync__health" :class="health.reachable ? 'sync__health--ok' : 'sync__health--err'">
      <span>{{ health.reachable ? 'Server reachable' : 'Server unreachable' }}</span>
      <span v-if="health.latencyMs > 0">{{ health.latencyMs }}ms</span>
      <span v-if="health.error" class="sync__health-error">{{ health.error }}</span>
    </div>
    <div v-if="healthError" class="sync__health sync__health--err">{{ healthError }}</div>

    <!-- Summary cards -->
    <div class="sync__cards">
      <div class="sync__card sync__card--ok">
        <div class="sync__card-value">{{ store.summary.syncedCount }}</div>
        <div class="sync__card-label"><Check :size="9" /> Synced</div>
      </div>
      <div class="sync__card sync__card--warn">
        <div class="sync__card-value">{{ store.summary.pendingCount }}</div>
        <div class="sync__card-label">Pending</div>
      </div>
      <div class="sync__card sync__card--err">
        <div class="sync__card-value">{{ store.summary.failedCount }}</div>
        <div class="sync__card-label"><AlertTriangle :size="9" /> Failed</div>
      </div>
      <div class="sync__card sync__card--err">
        <div class="sync__card-value">{{ store.summary.conflictCount }}</div>
        <div class="sync__card-label">Conflicts</div>
      </div>
    </div>

    <!-- Last sync time -->
    <div class="sync__last" v-if="store.lastFullSync">
      <Clock :size="10" />
      <span>Last sync: {{ store.lastFullSync.slice(0, 16).replace('T', ' ') }}</span>
    </div>

    <!-- Per-entity-type breakdown -->
    <div class="sync__breakdown">
      <div v-for="et of entityTypes" :key="et" class="sync__entity-row">
        <span class="sync__entity-label">{{ SYNC_ENTITY_LABELS[et] }}</span>
        <span class="sync__entity-counts">
          <span v-if="store.recordsByType[et]?.length">
            {{ store.recordsByType[et].filter(r => r.syncStatus === 'synced').length }} synced /
            {{ store.recordsByType[et].filter(r => r.syncStatus === 'pending-upload').length }} pending /
            {{ store.recordsByType[et].filter(r => r.syncStatus === 'sync-failed').length }} failed
          </span>
          <span v-else class="sync__entity-counts--none">None</span>
        </span>
      </div>
    </div>

    <!-- Failed records detail -->
    <div v-if="store.failedRecords.length > 0" class="sync__failed-section">
      <div class="sync__failed-header">Failed Records</div>
      <div v-for="r of store.failedRecords.slice(0, 10)" :key="r.id" class="sync__failed-row">
        <span>{{ SYNC_ENTITY_LABELS[r.entityType] }}: {{ r.entityId }}</span>
        <span class="sync__failed-error">{{ r.lastError }}</span>
      </div>
    </div>

    <div class="sync__footer">
      <button class="sync__btn sync__btn--ghost" @click="store.retryAllFailed" :disabled="store.failedRecords.length === 0">
        Retry All Failed
      </button>
    </div>
  </div>
</template>

<style scoped>
.sync-panel {
  display: flex; flex-direction: column; height: 100%;
  background: var(--ls-bg-panel, #0b0f18);
  color: var(--ls-text-primary, #c3c9d4);
  overflow-y: auto;
}
.sync__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,.06);
}
.sync__title {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 600; color: var(--ls-accent, #5a93ff);
}
.sync__title-icon--dim { color: #5d667a; }
.sync__tag { font-size: 9px; padding: 1px 5px; border-radius: 4px; font-weight: 600; margin-left: 4px; }
.sync__tag--off { background: rgba(255,107,107,.12); color: #ff6b6b; }
.sync__actions { display: flex; gap: 6px; }
.sync__notice {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; font-size: 11px; color: #8e96a6;
  border-bottom: 1px solid rgba(255,255,255,.04);
  background: rgba(255,159,67,.04);
}
.sync__health {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; font-size: 11px;
  border-bottom: 1px solid rgba(255,255,255,.04);
}
.sync__health--ok { color: #54d88c; }
.sync__health--err { color: #ff6b6b; }
.sync__health-error { color: #8e96a6; font-style: italic; }
.sync__cards {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 12px 16px;
}
.sync__card {
  background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.05);
  border-radius: 10px; padding: 10px 12px; text-align: center;
}
.sync__card--ok { border-color: rgba(84,216,140,.15); }
.sync__card--warn { border-color: rgba(255,159,67,.15); }
.sync__card--err { border-color: rgba(255,107,107,.15); }
.sync__card-value { font-size: 20px; font-weight: 700; }
.sync__card-label { font-size: 10px; color: #5d667a; text-transform: uppercase; margin-top: 2px; display: flex; align-items: center; gap: 3px; justify-content: center; }
.sync__last {
  display: flex; align-items: center; gap: 6px; padding: 4px 16px 8px;
  font-size: 10px; color: #5d667a;
}
.sync__breakdown { padding: 0 16px 8px; }
.sync__entity-row { display: flex; justify-content: space-between; font-size: 10px; padding: 2px 0; }
.sync__entity-label { color: #8e96a6; }
.sync__entity-counts { color: #5d667a; }
.sync__entity-counts--none { color: #3a4050; }
.sync__failed-section { padding: 8px 16px; border-top: 1px solid rgba(255,255,255,.04); }
.sync__failed-header { font-size: 11px; font-weight: 600; color: #ff6b6b; margin-bottom: 6px; }
.sync__failed-row { display: flex; flex-direction: column; margin-bottom: 6px; font-size: 10px; }
.sync__failed-error { color: #ff6b6b; margin-top: 2px; }
.sync__footer { padding: 8px 16px 16px; }
.sync__btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; padding: 4px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,.08);
  background: transparent; color: #c3c9d4; cursor: pointer; transition: all .12s;
}
.sync__btn:disabled { opacity: .4; cursor: not-allowed; }
.sync__btn:hover:not(:disabled) { background: rgba(255,255,255,.04); }
.sync__btn--primary { background: rgba(90,147,255,.12); border-color: rgba(90,147,255,.2); color: #5a93ff; }
.sync__btn--primary:hover { background: rgba(90,147,255,.18); }
.sync__btn--ghost { border-color: transparent; color: #8e96a6; }
.sync__spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.badge--ok { color: #54d88c; }
.badge--warn { color: #ff9f43; }
.badge--err { color: #ff6b6b; }
.badge--dim { color: #5d667a; }
</style>
