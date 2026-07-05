<script setup lang="ts">
import { computed } from 'vue'
import { useAutomationStore } from '../store/automation.store'
import type { AutomationRunStatus } from '../types/automation.types'

const props = defineProps<{
  automationId: string
}>()

const store = useAutomationStore()

const runs = computed(() => store.recentRuns(props.automationId))

const statusLabel: Record<AutomationRunStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  done: 'Done',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

const statusClass: Record<AutomationRunStatus, string> = {
  queued: 'auto-run-hist__badge--queued',
  running: 'auto-run-hist__badge--running',
  done: 'auto-run-hist__badge--done',
  failed: 'auto-run-hist__badge--failed',
  cancelled: 'auto-run-hist__badge--cancelled',
}

function formatTime(iso?: string): string {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleString()
}
</script>

<template>
  <div class="auto-run-hist">
    <div class="auto-run-hist__header">
      <span class="auto-run-hist__title">Run History</span>
      <span class="auto-run-hist__count">{{ runs.length }} runs</span>
    </div>

    <div v-if="runs.length === 0" class="auto-run-hist__empty">
      <p>No runs yet.</p>
    </div>

    <div v-else class="auto-run-hist__list">
      <div v-for="run in runs" :key="run.id" class="auto-run-hist__row">
        <span :class="['auto-run-hist__badge', statusClass[run.status]]">
          {{ statusLabel[run.status] }}
        </span>
        <span class="auto-run-hist__time">{{ formatTime(run.startedAt) }}</span>
        <span v-if="run.threadId" class="auto-run-hist__thread" :title="run.threadId">
          {{ run.threadId }}
        </span>
        <span v-if="run.summary" class="auto-run-hist__summary">{{ run.summary }}</span>
        <span v-if="run.errorMessage" class="auto-run-hist__error">{{ run.errorMessage }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auto-run-hist {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.auto-run-hist__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--ls-border, rgba(255,255,255,0.06));
}
.auto-run-hist__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ls-text-primary, #c3c9d4);
}
.auto-run-hist__count {
  font-size: 11px;
  color: var(--ls-text-muted, #5d667a);
}
.auto-run-hist__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--ls-text-muted, #5d667a);
  font-size: 12px;
}
.auto-run-hist__list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.auto-run-hist__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--ls-radius-sm, 4px);
  background: var(--ls-bg-panel, #1e1f23);
  border: 1px solid var(--ls-border, rgba(255,255,255,0.06));
}
.auto-run-hist__badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.auto-run-hist__badge--queued {
  background: var(--ls-warning, #e6a817);
  color: #1e1f23;
}
.auto-run-hist__badge--running {
  background: var(--ls-accent, #5b8af5);
  color: #fff;
}
.auto-run-hist__badge--done {
  background: var(--ls-success, #4caf50);
  color: #fff;
}
.auto-run-hist__badge--failed {
  background: var(--ls-danger, #e53935);
  color: #fff;
}
.auto-run-hist__badge--cancelled {
  background: var(--ls-text-muted, #5d667a);
  color: #fff;
}
.auto-run-hist__time {
  font-size: 11px;
  color: var(--ls-text-muted, #5d667a);
}
.auto-run-hist__thread {
  font-size: 10px;
  font-family: monospace;
  color: var(--ls-accent, #5b8af5);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.auto-run-hist__summary {
  width: 100%;
  font-size: 11px;
  color: var(--ls-text-primary, #c3c9d4);
  line-height: 1.4;
}
.auto-run-hist__error {
  width: 100%;
  font-size: 11px;
  color: var(--ls-danger, #e53935);
  line-height: 1.4;
}
</style>
