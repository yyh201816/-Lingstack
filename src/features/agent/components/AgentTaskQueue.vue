<script setup lang="ts">
import { computed } from 'vue'
import { useOrchestrationStore } from '../store/orchestration.store'
import type { OrchestrationStep } from '../types/orchestration.types'

const props = defineProps<{ threadId: string }>()
const orchStore = useOrchestrationStore()

const steps = computed<OrchestrationStep[]>(() => orchStore.currentSteps(props.threadId))

const stepTypeIcons: Record<string, string> = {
  plan: '\uD83D\uDCDD', context: '\uD83D\uDCC1', tool: '\uD83D\uDD27',
  review: '\uD83D\uDCDD', goal: '\uD83C\uDFAF', automation: '\u2699',
  approval: '\u2705', done: '\u2714', failed: '\u274C',
}

const stepStatusLabels: Record<string, string> = {
  pending: 'Pending', running: 'Running', done: 'Done', failed: 'Failed', skipped: 'Skipped',
}

function formatTime(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="agent-queue">
    <div v-if="steps.length === 0" class="agent-queue__empty">No steps yet</div>
    <div
      v-for="step in steps"
      :key="step.id"
      class="agent-queue__item"
      :class="`agent-queue__item--${step.status}`"
    >
      <span class="agent-queue__icon">{{ stepTypeIcons[step.type] || '\u2022' }}</span>
      <div class="agent-queue__info">
        <span class="agent-queue__title">{{ step.title }}</span>
        <span v-if="step.detail" class="agent-queue__detail">{{ step.detail }}</span>
      </div>
      <span class="agent-queue__badge" :class="`agent-queue__badge--${step.status}`">
        {{ stepStatusLabels[step.status] || step.status }}
      </span>
      <span class="agent-queue__time">{{ formatTime(step.updatedAt || '') }}</span>
    </div>
  </div>
</template>

<style scoped>
.agent-queue { display: flex; flex-direction: column; gap: 2px; }
.agent-queue__empty {
  text-align: center;
  padding: 16px;
  font-size: 11px;
  color: var(--ls-text-hint, #5d667a);
}
.agent-queue__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  transition: background 140ms ease;
}
.agent-queue__item:hover { background: rgba(255, 255, 255, 0.03); }
.agent-queue__item--running {
  background: rgba(90, 147, 255, 0.06);
  border-left: 2px solid var(--ls-accent, #5a93ff);
}
.agent-queue__icon { font-size: 13px; flex-shrink: 0; }
.agent-queue__info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.agent-queue__title {
  font-size: 11px;
  font-weight: 500;
  color: var(--ls-text-primary, #e8eaed);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.agent-queue__detail {
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.agent-queue__badge {
  font-size: 9px;
  font-weight: 500;
  padding: 1px 5px;
  border-radius: 4px;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: rgba(255, 255, 255, 0.05);
  color: var(--ls-text-hint, #5d667a);
}
.agent-queue__badge--running { background: rgba(90, 147, 255, 0.12); color: var(--ls-accent, #5a93ff); }
.agent-queue__badge--done { background: rgba(84, 216, 140, 0.1); color: #54d88c; }
.agent-queue__badge--failed { background: rgba(255, 107, 107, 0.1); color: #ff6b6b; }
.agent-queue__badge--skipped { color: var(--ls-text-hint, #5d667a); }
.agent-queue__time {
  font-size: 9px;
  color: var(--ls-text-hint, #5d667a);
  font-family: monospace;
  flex-shrink: 0;
}
</style>
