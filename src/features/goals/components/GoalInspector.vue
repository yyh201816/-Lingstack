<script setup lang="ts">
import { computed } from 'vue'
import { useGoalStore } from '../store/goal.store'
import { recordGoalEvent } from '../services/goal-progress.service'
import type { GoalStatus } from '../types/goal.types'

const props = defineProps<{
  goalId: string
}>()

const goalStore = useGoalStore()

const goal = computed(() => goalStore.goals.find((g) => g.id === props.goalId))

const statusLabels: Record<GoalStatus, string> = {
  inactive: 'Inactive',
  active: 'Active',
  paused: 'Paused',
  done: 'Done',
  blocked: 'Blocked',
}

const canPauseResume = computed(() => goal.value?.status === 'active' || goal.value?.status === 'paused')
const isActive = computed(() => goal.value?.status === 'active')
const isPaused = computed(() => goal.value?.status === 'paused')
const isTerminal = computed(() => goal.value?.status === 'done' || goal.value?.status === 'blocked')

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

function handlePause() {
  if (!goal.value) return
  goalStore.pauseGoal(goal.value.id)
  recordGoalEvent(goal.value.id, 'paused')
}

function handleResume() {
  if (!goal.value) return
  goalStore.resumeGoal(goal.value.id)
  recordGoalEvent(goal.value.id, 'resumed')
}

function handleComplete() {
  if (!goal.value) return
  goalStore.completeGoal(goal.value.id)
  recordGoalEvent(goal.value.id, 'completed')
}

function handleBlock() {
  if (!goal.value) return
  goalStore.blockGoal(goal.value.id)
  recordGoalEvent(goal.value.id, 'blocked')
}
</script>

<template>
  <div v-if="goal" class="goal-inspector">
    <div class="goal-inspector__header">
      <h3 class="goal-inspector__title">{{ goal.title }}</h3>
      <span
        class="goal-inspector__badge"
        :class="`goal-inspector__badge--${goal.status}`"
      >{{ statusLabels[goal.status] }}</span>
    </div>

    <div class="goal-inspector__section">
      <span class="goal-inspector__label">Objective</span>
      <p class="goal-inspector__text">{{ goal.objective }}</p>
    </div>

    <div class="goal-inspector__section">
      <span class="goal-inspector__label">Progress</span>
      <div class="goal-inspector__progress-row">
        <div class="goal-inspector__bar-track">
          <div
            class="goal-inspector__bar-fill"
            :style="{ width: goal.progressPercent + '%' }"
          ></div>
        </div>
        <span class="goal-inspector__percent">{{ goal.progressPercent }}%</span>
      </div>
    </div>

    <div v-if="goal.currentSummary" class="goal-inspector__section">
      <span class="goal-inspector__label">Summary</span>
      <p class="goal-inspector__text goal-inspector__text--muted">{{ goal.currentSummary }}</p>
    </div>

    <div class="goal-inspector__section goal-inspector__dates">
      <div class="goal-inspector__date">
        <span class="goal-inspector__label">Created</span>
        <span class="goal-inspector__date-val">{{ formatDate(goal.createdAt) }}</span>
      </div>
      <div class="goal-inspector__date">
        <span class="goal-inspector__label">Updated</span>
        <span class="goal-inspector__date-val">{{ formatDate(goal.updatedAt) }}</span>
      </div>
    </div>

    <div v-if="!isTerminal" class="goal-inspector__actions">
      <button
        v-if="canPauseResume"
        class="goal-inspector__btn"
        @click="isActive ? handlePause() : handleResume()"
      >
        {{ isActive ? '\u23F8 Pause' : '\u25B6 Resume' }}
      </button>
      <button
        v-if="!isTerminal"
        class="goal-inspector__btn goal-inspector__btn--success"
        @click="handleComplete"
      >
        \u2713 Complete
      </button>
      <button
        v-if="!isTerminal"
        class="goal-inspector__btn goal-inspector__btn--danger"
        @click="handleBlock"
      >
        \u2717 Block
      </button>
    </div>
  </div>
</template>

<style scoped>
.goal-inspector {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  font-family: var(--ls-font-sans, 'Inter', sans-serif);
  color: var(--ls-text-primary, #111827);
}
.goal-inspector__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.goal-inspector__title {
  font-size: 15px;
  font-weight: 650;
  color: var(--ls-text-primary, #111827);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.goal-inspector__badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  flex-shrink: 0;
  white-space: nowrap;
}
.goal-inspector__badge--active {
  background: rgba(79, 110, 247, 0.12);
  color: var(--ls-accent, #4f6ef7);
}
.goal-inspector__badge--paused {
  background: rgba(100, 116, 139, 0.12);
  color: var(--ls-text-muted, #64748b);
}
.goal-inspector__badge--done {
  background: rgba(16, 185, 129, 0.12);
  color: var(--ls-success, #10b981);
}
.goal-inspector__badge--blocked {
  background: rgba(239, 68, 68, 0.12);
  color: var(--ls-danger, #ef4444);
}
.goal-inspector__badge--inactive {
  background: rgba(100, 116, 139, 0.08);
  color: var(--ls-text-muted, #64748b);
}
.goal-inspector__section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.goal-inspector__label {
  font-size: 10px;
  font-weight: 600;
  color: var(--ls-text-muted, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.goal-inspector__text {
  font-size: 13px;
  line-height: 1.55;
  color: var(--ls-text-primary, #111827);
  margin: 0;
  word-break: break-word;
}
.goal-inspector__text--muted {
  color: var(--ls-text-muted, #64748b);
  font-size: 12px;
}
.goal-inspector__progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.goal-inspector__bar-track {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--ls-border, rgba(99, 115, 129, 0.16));
  overflow: hidden;
}
.goal-inspector__bar-fill {
  height: 100%;
  border-radius: 3px;
  background: var(--ls-accent, #4f6ef7);
  transition: width var(--ls-duration-fast, 140ms) var(--ls-ease-standard, cubic-bezier(.2,.8,.2,1));
}
.goal-inspector__percent {
  font-size: 12px;
  font-weight: 600;
  color: var(--ls-text-primary, #111827);
  min-width: 32px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.goal-inspector__dates {
  display: flex;
  gap: 20px;
}
.goal-inspector__date {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.goal-inspector__date-val {
  font-size: 12px;
  color: var(--ls-text-primary, #111827);
  font-variant-numeric: tabular-nums;
}
.goal-inspector__actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--ls-border, rgba(99, 115, 129, 0.16));
  margin-top: 4px;
}
.goal-inspector__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 30px;
  padding: 0 12px;
  font-size: 11px;
  font-weight: 550;
  font-family: var(--ls-font-sans, 'Inter', sans-serif);
  border: 1px solid var(--ls-border, rgba(99, 115, 129, 0.16));
  border-radius: var(--ls-radius-sm, 10px);
  background: var(--ls-bg-panel, #f3f5f9);
  color: var(--ls-text-primary, #111827);
  cursor: pointer;
  transition: background-color var(--ls-duration-fast, 140ms),
              color var(--ls-duration-fast, 140ms),
              border-color var(--ls-duration-fast, 140ms);
  white-space: nowrap;
}
.goal-inspector__btn:hover {
  background: var(--ls-bg-panel-hover, #eef2f8);
}
.goal-inspector__btn--success {
  background: rgba(16, 185, 129, 0.08);
  color: var(--ls-success, #10b981);
  border-color: rgba(16, 185, 129, 0.2);
}
.goal-inspector__btn--success:hover {
  background: var(--ls-success, #10b981);
  color: #fff;
  border-color: var(--ls-success, #10b981);
}
.goal-inspector__btn--danger {
  background: rgba(239, 68, 68, 0.08);
  color: var(--ls-danger, #ef4444);
  border-color: rgba(239, 68, 68, 0.2);
}
.goal-inspector__btn--danger:hover {
  background: var(--ls-danger, #ef4444);
  color: #fff;
  border-color: var(--ls-danger, #ef4444);
}
</style>
