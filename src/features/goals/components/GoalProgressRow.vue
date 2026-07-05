<script setup lang="ts">
import { computed } from 'vue'
import { useGoalStore } from '../store/goal.store'
import type { GoalStatus } from '../types/goal.types'

const props = defineProps<{
  threadId: string
}>()

const goalStore = useGoalStore()

const goal = computed(() => goalStore.activeGoal(props.threadId))

const statusLabels: Record<GoalStatus, string> = {
  inactive: 'Inactive',
  active: 'Active',
  paused: 'Paused',
  done: 'Done',
  blocked: 'Blocked',
}
</script>

<template>
  <div v-if="goal" class="goal-row">
    <span class="goal-row__title">{{ goal.title }}</span>
    <div class="goal-row__bar-track">
      <div
        class="goal-row__bar-fill"
        :style="{ width: goal.progressPercent + '%' }"
      ></div>
    </div>
    <span class="goal-row__percent">{{ goal.progressPercent }}%</span>
    <span
      class="goal-row__badge"
      :class="`goal-row__badge--${goal.status}`"
    >{{ statusLabels[goal.status] }}</span>
  </div>
</template>

<style scoped>
.goal-row {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  padding: 0 4px;
  min-width: 0;
  font-family: var(--ls-font-sans, 'Inter', sans-serif);
}
.goal-row__title {
  font-size: 11px;
  font-weight: 500;
  color: var(--ls-text-primary, #111827);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
  flex-shrink: 1;
}
.goal-row__bar-track {
  flex: 1;
  min-width: 48px;
  height: 4px;
  border-radius: 2px;
  background: var(--ls-border, rgba(99, 115, 129, 0.16));
  overflow: hidden;
}
.goal-row__bar-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--ls-accent, #4f6ef7);
  transition: width var(--ls-duration-fast, 140ms) var(--ls-ease-standard, cubic-bezier(.2,.8,.2,1));
}
.goal-row__percent {
  font-size: 10px;
  font-weight: 600;
  color: var(--ls-text-muted, #64748b);
  min-width: 28px;
  text-align: right;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.goal-row__badge {
  font-size: 9px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 999px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  flex-shrink: 0;
  white-space: nowrap;
}
.goal-row__badge--active {
  background: rgba(79, 110, 247, 0.12);
  color: var(--ls-accent, #4f6ef7);
}
.goal-row__badge--paused {
  background: rgba(100, 116, 139, 0.12);
  color: var(--ls-text-muted, #64748b);
}
.goal-row__badge--done {
  background: rgba(16, 185, 129, 0.12);
  color: var(--ls-success, #10b981);
}
.goal-row__badge--blocked {
  background: rgba(239, 68, 68, 0.12);
  color: var(--ls-danger, #ef4444);
}
.goal-row__badge--inactive {
  background: rgba(100, 116, 139, 0.08);
  color: var(--ls-text-muted, #64748b);
}
</style>
