<script setup lang="ts">
import { computed } from 'vue'
import { useOrchestrationStore } from '../store/orchestration.store'

const props = defineProps<{ threadId?: string }>()
const orchStore = useOrchestrationStore()

const orch = computed(() => {
  const tid = props.threadId
  return tid ? orchStore.getCurrentOrchestration(tid) : undefined
})

const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    idle: 'Idle', running: 'Running', paused: 'Paused',
    waiting_input: 'Waiting Input', waiting_approval: 'Approval',
    done: 'Done', failed: 'Failed',
  }
  return labels[orch.value?.status ?? 'idle'] ?? 'Idle'
})

const statusClass = computed(() => orch.value?.status ?? 'idle')

const currentStep = computed(() => {
  const o = orch.value
  if (!o?.currentStepId) return null
  return o.steps.find(s => s.id === o.currentStepId) ?? null
})

const stepCount = computed(() => {
  const o = orch.value
  if (!o || o.steps.length === 0) return ''
  const done = o.steps.filter(s => s.status === 'done' || s.status === 'skipped').length
  return `${done}/${o.steps.length}`
})

const isVisible = computed(() => !!orch.value && orch.value.status !== 'idle')
</script>

<template>
  <div v-if="isVisible" class="agent-run-bar" :class="`agent-run-bar--${statusClass}`">
    <span class="agent-run-bar__dot" :class="`agent-run-bar__dot--${statusClass}`"></span>
    <span class="agent-run-bar__label">{{ statusLabel }}</span>
    <span v-if="currentStep" class="agent-run-bar__step">{{ currentStep.title }}</span>
    <span v-if="stepCount" class="agent-run-bar__count">{{ stepCount }}</span>
  </div>
</template>

<style scoped>
.agent-run-bar {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 500;
  background: rgba(90, 147, 255, 0.08);
  color: var(--ls-text-secondary, #c3c9d4);
  white-space: nowrap;
  user-select: none;
}
.agent-run-bar--running { background: rgba(90, 147, 255, 0.12); }
.agent-run-bar--paused { background: rgba(142, 150, 166, 0.1); }
.agent-run-bar--done { background: rgba(84, 216, 140, 0.1); }
.agent-run-bar--failed { background: rgba(255, 107, 107, 0.1); }
.agent-run-bar__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--ls-text-hint, #5d667a);
}
.agent-run-bar__dot--running {
  background: var(--ls-accent, #5a93ff);
  animation: pulse-dot 1.5s ease-in-out infinite;
}
.agent-run-bar__dot--done { background: #54d88c; }
.agent-run-bar__dot--failed { background: #ff6b6b; }
.agent-run-bar__dot--paused { background: #8e96a6; }
.agent-run-bar__step {
  color: var(--ls-text-hint, #5d667a);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.agent-run-bar__count {
  color: var(--ls-text-hint, #5d667a);
  font-family: monospace;
  font-size: 9px;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
