<script setup lang="ts">
import { onMounted } from 'vue'
import { Shield, RefreshCw, MessageSquare, CheckCircle, AlertCircle, Clock } from 'lucide-vue-next'
import { useBetaFeedbackStore } from '../store/beta-feedback.store'
import { getVersionInfo } from '../services/beta-release.service'

const betaStore = useBetaFeedbackStore()

onMounted(async () => {
  const info = await getVersionInfo()
  betaStore.setVersionInfo(info)
})

function formatTime(iso?: string): string {
  if (!iso) return 'Never'
  try { return new Date(iso).toLocaleString() } catch { return iso }
}
</script>

<template>
  <div class="beta-status">
    <div class="beta-status__header">
      <Shield :size="18" />
      <h3>Beta Status</h3>
      <span class="beta-status__badge">BETA</span>
    </div>

    <div class="beta-status__grid">
      <div class="beta-status__row">
        <span class="beta-status__label">App Version</span>
        <span class="beta-status__value mono">v{{ betaStore.versionInfo.appVersion }}</span>
      </div>
      <div class="beta-status__row">
        <span class="beta-status__label">Build Channel</span>
        <span class="beta-status__value">
          <span class="beta-status__channel">{{ betaStore.versionInfo.buildChannel }}</span>
        </span>
      </div>
      <div class="beta-status__row">
        <span class="beta-status__label">Update Available</span>
        <span class="beta-status__value">
          <CheckCircle v-if="!betaStore.versionInfo.updateAvailable" :size="14" color="#54d88c" />
          <RefreshCw v-else :size="14" color="#5a93ff" />
          {{ betaStore.versionInfo.updateAvailable ? 'Yes' : 'Up to date' }}
        </span>
      </div>
      <div class="beta-status__row">
        <span class="beta-status__label">Last Update Check</span>
        <span class="beta-status__value">
          <Clock :size="12" />
          {{ formatTime(betaStore.versionInfo.lastUpdateCheck) }}
        </span>
      </div>
      <div class="beta-status__row">
        <span class="beta-status__label">Feedback Channel</span>
        <span class="beta-status__value">
          <span class="beta-status__channel beta-status__channel--ok">Active (local)</span>
        </span>
      </div>
    </div>

    <div class="beta-status__summary">
      <div class="beta-status__stat">
        <MessageSquare :size="14" />
        <span>{{ betaStore.feedbackCount }} feedbacks submitted</span>
      </div>
      <div v-if="betaStore.failedFeedbacks.length > 0" class="beta-status__stat beta-status__stat--warn">
        <AlertCircle :size="14" />
        <span>{{ betaStore.failedFeedbacks.length }} pending retry</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.beta-status {
  padding: 16px;
  border-radius: 10px;
  background: var(--ls-bg-elevated, #101624);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.beta-status__header {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 16px; padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: var(--ls-text-primary, #e8ecf1);
}
.beta-status__header h3 { font-size: 14px; font-weight: 600; flex: 1; }
.beta-status__badge {
  font-size: 9px; padding: 2px 7px; border-radius: 4px;
  background: rgba(90, 147, 255, 0.12); color: #5a93ff;
  font-weight: 600; letter-spacing: 0.05em;
}
.beta-status__grid { display: flex; flex-direction: column; gap: 10px; }
.beta-status__row {
  display: flex; align-items: center; justify-content: space-between;
}
.beta-status__label { font-size: 12px; color: var(--ls-text-muted, #8a92a4); }
.beta-status__value {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: var(--ls-text-secondary, #c3c9d4);
}
.beta-status__value.mono { font-family: monospace; font-size: 11px; }
.beta-status__channel {
  font-size: 10px; padding: 1px 6px; border-radius: 4px;
  background: rgba(255, 255, 255, 0.04); color: var(--ls-text-muted, #8a92a4);
  font-weight: 500;
}
.beta-status__channel--ok { background: rgba(84, 216, 140, 0.1); color: #54d88c; }
.beta-status__summary {
  margin-top: 14px; padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex; flex-direction: column; gap: 6px;
}
.beta-status__stat {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--ls-text-muted, #8a92a4);
}
.beta-status__stat--warn { color: #ffd93d; }
</style>
