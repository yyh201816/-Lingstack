<script setup lang="ts">
import { computed } from 'vue'
import { useOrchestrationStore } from '../store/orchestration.store'

const props = defineProps<{ threadId: string }>()
const orchStore = useOrchestrationStore()

const orch = computed(() => orchStore.getCurrentOrchestration(props.threadId))

const isFinished = computed(() => {
  const s = orch.value?.status
  return s === 'done' || s === 'failed'
})

const stats = computed(() => {
  const steps = orch.value?.steps ?? []
  return {
    total: steps.length,
    done: steps.filter(s => s.status === 'done').length,
    failed: steps.filter(s => s.status === 'failed').length,
    skipped: steps.filter(s => s.status === 'skipped').length,
  }
})

const duration = computed(() => {
  const steps = orch.value?.steps ?? []
  if (steps.length === 0) return ''
  const first = new Date(steps[0]!.createdAt || Date.now()).getTime()
  const last = new Date(steps[steps.length - 1]!.updatedAt || Date.now()).getTime()
  const diffSec = Math.max(0, Math.round((last - first) / 1000))
  if (diffSec < 60) return `${diffSec}s`
  return `${Math.floor(diffSec / 60)}m ${diffSec % 60}s`
})
</script>

<template>
  <div v-if="isFinished && orch" class="agent-summary">
    <div class="agent-summary__header">
      <span class="agent-summary__status" :class="`agent-summary__status--${orch.status}`">
        {{ orch.status === 'done' ? 'Completed' : 'Failed' }}
      </span>
      <span v-if="duration" class="agent-summary__duration">{{ duration }}</span>
    </div>
    <div class="agent-summary__stats">
      <span class="agent-summary__stat">{{ stats.done }} done</span>
      <span v-if="stats.failed > 0" class="agent-summary__stat agent-summary__stat--fail">{{ stats.failed }} failed</span>
      <span v-if="stats.skipped > 0" class="agent-summary__stat">{{ stats.skipped }} skipped</span>
      <span class="agent-summary__stat">/ {{ stats.total }} total</span>
    </div>
  </div>
</template>

<style scoped>
.agent-summary {
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
}
.agent-summary__header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.agent-summary__status {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.agent-summary__status--done { color: #54d88c; }
.agent-summary__status--failed { color: #ff6b6b; }
.agent-summary__duration {
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  font-family: monospace;
}
.agent-summary__stats { display: flex; gap: 8px; flex-wrap: wrap; }
.agent-summary__stat {
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
}
.agent-summary__stat--fail { color: #ff6b6b; }
</style>
