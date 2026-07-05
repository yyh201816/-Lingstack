<script setup lang="ts">
import type { BootstrapTaskItem, BootstrapTaskStatus } from '../types'
import { STATUS_LABELS, SOURCE_LABELS } from '../types'
import { MessageSquare, AlertTriangle } from 'lucide-vue-next'

const props = defineProps<{
  task: BootstrapTaskItem
}>()

const emit = defineEmits<{
  start: [taskId: string]
  statusChange: [taskId: string, newStatus: BootstrapTaskStatus]
  openThread: [threadId: string]
}>()

// ── Priority config ──
const priorityConfig: Record<string, { color: string; label: string }> = {
  p0: { color: '#ff6b6b', label: 'P0' },
  p1: { color: '#5a93ff', label: 'P1' },
  p2: { color: '#ffd463', label: 'P2' },
  p3: { color: '#8e96a6', label: 'P3' },
}

// ── Status dot config ──
const statusDotConfig: Record<BootstrapTaskStatus, { color: string; pulse: boolean }> = {
  backlog: { color: '#8e96a6', pulse: false },
  ready: { color: '#ffd463', pulse: false },
  running: { color: '#5a93ff', pulse: true },
  review: { color: '#a17aff', pulse: false },
  blocked: { color: '#ff6b6b', pulse: false },
  verified: { color: '#54d88c', pulse: false },
  released: { color: '#54d88c', pulse: false },
  archived: { color: '#8e96a6', pulse: false },
}

// ── Severity badge color ──
const severityColor: Record<string, string> = {
  critical: '#ff6b6b',
  high: '#ffd463',
  medium: '#8e96a6',
  low: '#54d88c',
}

// ── Type badge config ──
const typeLabel: Record<string, string> = {
  bugfix: 'Bugfix',
  ux: 'UX',
  workflow: 'Workflow',
  review: 'Review',
  release: 'Release',
  regression: 'Regression',
  docs: 'Docs',
  refactor: 'Refactor',
  'ci-cd': 'CI/CD',
}

// ── Helpers ──
function handleAction(action: string) {
  switch (action) {
    case 'ready':
      emit('statusChange', props.task.taskId, 'ready')
      break
    case 'start':
      emit('start', props.task.taskId)
      break
    case 'review':
      emit('statusChange', props.task.taskId, 'review')
      break
    case 'block':
      emit('statusChange', props.task.taskId, 'blocked')
      break
    case 'unblock':
      emit('statusChange', props.task.taskId, 'backlog')
      break
    case 'verify':
      emit('statusChange', props.task.taskId, 'verified')
      break
    case 'release':
      emit('statusChange', props.task.taskId, 'released')
      break
  }
}
</script>

<template>
  <div
    :class="['btc-card', `btc-card--pri-${task.priority}`]"
  >
    <div class="btc-card__top">
      <span
        :class="['btc-dot', { 'btc-dot--pulse': statusDotConfig[task.status].pulse }]"
        :style="{ backgroundColor: statusDotConfig[task.status].color }"
      ></span>
      <div class="btc-card__info">
        <h4 class="btc-card__title">{{ task.title }}</h4>
        <p v-if="task.description" class="btc-card__desc">{{ task.description }}</p>
        <div class="btc-card__meta">
          <!-- Priority badge -->
          <span
            class="btc-card__badge"
            :style="{
              background: priorityConfig[task.priority].color + '1a',
              color: priorityConfig[task.priority].color,
            }"
          >
            {{ priorityConfig[task.priority].label }}
          </span>
          <!-- Type badge -->
          <span class="btc-card__badge btc-card__badge--muted">
            {{ typeLabel[task.type] || task.type }}
          </span>
          <!-- Source badge -->
          <span class="btc-card__badge btc-card__badge--muted">
            {{ SOURCE_LABELS[task.source] || task.source }}
          </span>
          <!-- Severity badge -->
          <span
            class="btc-card__badge"
            :style="{
              background: (severityColor[task.severity] || '#8e96a6') + '12',
              color: severityColor[task.severity] || '#8e96a6',
            }"
          >
            {{ task.severity }}
          </span>
          <!-- Thread link -->
          <button
            v-if="task.relatedThreadId"
            class="btc-card__thread-link"
            @click.stop="emit('openThread', task.relatedThreadId!)"
          >
            <MessageSquare :size="10" />
            {{ task.relatedThreadId.slice(-6) }}
          </button>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="btc-card__actions">
      <button
        v-if="task.status === 'backlog'"
        class="btc-card__btn btc-card__btn--ready"
        @click.stop="handleAction('ready')"
      >Ready</button>

      <button
        v-if="task.status === 'ready'"
        class="btc-card__btn btc-card__btn--start"
        @click.stop="handleAction('start')"
      >Start</button>

      <template v-if="task.status === 'running'">
        <button
          class="btc-card__btn btc-card__btn--review"
          @click.stop="handleAction('review')"
        >Review</button>
        <button
          class="btc-card__btn btc-card__btn--block"
          @click.stop="handleAction('block')"
        >
          <AlertTriangle :size="10" /> Block
        </button>
      </template>

      <template v-if="task.status === 'review'">
        <button
          class="btc-card__btn btc-card__btn--verify"
          @click.stop="handleAction('verify')"
        >Verify</button>
        <button
          class="btc-card__btn btc-card__btn--block"
          @click.stop="handleAction('block')"
        >
          <AlertTriangle :size="10" /> Block
        </button>
      </template>

      <button
        v-if="task.status === 'blocked'"
        class="btc-card__btn btc-card__btn--unblock"
        @click.stop="handleAction('unblock')"
      >Unblock</button>

      <button
        v-if="task.status === 'verified'"
        class="btc-card__btn btc-card__btn--release"
        @click.stop="handleAction('release')"
      >Release</button>
    </div>
  </div>
</template>

<style scoped>
/* ── Card ── */
.btc-card {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: var(--ls-bg-elevated, #101624);
  transition: background 0.12s;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.btc-card:hover {
  background: rgba(255, 255, 255, 0.02);
}

/* Priority left border */
.btc-card--pri-p0 { border-left: 3px solid #ff6b6b; }
.btc-card--pri-p1 { border-left: 3px solid #5a93ff; }
.btc-card--pri-p2 { border-left: 3px solid #ffd463; }
.btc-card--pri-p3 { border-left: 3px solid #8e96a6; }

/* ── Top row ── */
.btc-card__top {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

/* ── Status dot ── */
.btc-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}
.btc-dot--pulse {
  animation: btc-pulse 1.2s ease infinite;
}
@keyframes btc-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ── Info area ── */
.btc-card__info {
  flex: 1;
  min-width: 0;
}
.btc-card__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--ls-text-primary, #e9edf6);
  margin: 0 0 2px;
  line-height: 1.35;
}
.btc-card__desc {
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  margin: 0 0 6px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Meta badges ── */
.btc-card__meta {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  align-items: center;
}
.btc-card__badge {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 600;
  line-height: 1.4;
}
.btc-card__badge--muted {
  background: rgba(142, 150, 166, 0.12);
  color: var(--ls-text-hint, #5d667a);
  font-weight: 500;
}

/* ── Thread link ── */
.btc-card__thread-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: transparent;
  color: var(--ls-accent, #5a93ff);
  cursor: pointer;
  transition: background 0.12s;
  line-height: 1.4;
}
.btc-card__thread-link:hover {
  background: rgba(90, 147, 255, 0.08);
}

/* ── Actions ── */
.btc-card__actions {
  display: flex;
  gap: 4px;
}
.btc-card__btn {
  padding: 3px 10px;
  border-radius: 5px;
  border: none;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.btc-card__btn:hover {
  filter: brightness(1.2);
}
.btc-card__btn--ready {
  background: rgba(255, 212, 99, 0.12);
  color: #ffd463;
}
.btc-card__btn--start {
  background: rgba(90, 147, 255, 0.12);
  color: #5a93ff;
}
.btc-card__btn--review {
  background: rgba(161, 122, 255, 0.12);
  color: #a17aff;
}
.btc-card__btn--verify {
  background: rgba(84, 216, 140, 0.12);
  color: #54d88c;
}
.btc-card__btn--release {
  background: rgba(84, 216, 140, 0.12);
  color: #54d88c;
}
.btc-card__btn--block {
  background: transparent;
  color: #8e96a6;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.btc-card__btn--unblock {
  background: rgba(90, 147, 255, 0.12);
  color: #5a93ff;
}
</style>
