<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBootstrapTaskStore } from '@/features/bootstrap/store/bootstrap-task.store'
import type { TaskCandidateSource, BootstrapTaskPriority } from '@/features/bootstrap/types'
import {
  Lightbulb, Plus, ArrowRight, X
} from 'lucide-vue-next'

const store = useBootstrapTaskStore()

// ── Local state ──
const showManualForm = ref(false)
const manualSourceType = ref<TaskCandidateSource>('user-feedback')
const manualTitle = ref('')
const manualReason = ref('')
const manualPriority = ref<BootstrapTaskPriority>('p1')
const activeFilter = ref<TaskCandidateSource | 'all'>('all')
const convertFeedback = ref<string | null>(null) // candidateId that was just converted

// ── Computed: non-ignored candidates ──
const visibleCandidates = computed(() =>
  store.candidates.filter(c => !c.ignored)
)

// ── Computed: filtered ──
const filteredCandidates = computed(() => {
  if (activeFilter.value === 'all') return visibleCandidates.value
  return visibleCandidates.value.filter(c => c.sourceType === activeFilter.value)
})

// ── Stats ──
const sourceCounts = computed(() => {
  const counts: Record<TaskCandidateSource, number> = {
    'thread-summary': 0,
    'failed-task': 0,
    'blocked-task': 0,
    'regression-fail': 0,
    'beta-smoke-issue': 0,
    'user-feedback': 0,
  }
  for (const c of visibleCandidates.value) {
    counts[c.sourceType]++
  }
  return counts
})

// ── Source type styling ──
const sourceTypeColor: Record<TaskCandidateSource, string> = {
  'thread-summary': '#8e96a6',
  'failed-task': '#ff6b6b',
  'blocked-task': '#ffd463',
  'regression-fail': '#ff6b6b',
  'beta-smoke-issue': '#a17aff',
  'user-feedback': '#5a93ff',
}

const sourceTypeLabel: Record<TaskCandidateSource, string> = {
  'thread-summary': 'Thread',
  'failed-task': 'Failed',
  'blocked-task': 'Blocked',
  'regression-fail': 'Regression',
  'beta-smoke-issue': 'Beta',
  'user-feedback': 'Feedback',
}

// ── Filter config ──
const FILTERS: { key: TaskCandidateSource | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'thread-summary', label: 'Thread' },
  { key: 'failed-task', label: 'Failed' },
  { key: 'blocked-task', label: 'Blocked' },
  { key: 'regression-fail', label: 'Regression' },
  { key: 'beta-smoke-issue', label: 'Beta' },
  { key: 'user-feedback', label: 'Feedback' },
]

// ── Methods ──
function handleConvert(candidateId: string) {
  const result = store.convertCandidate(candidateId)
  if (result) {
    convertFeedback.value = candidateId
    setTimeout(() => {
      if (convertFeedback.value === candidateId) {
        convertFeedback.value = null
      }
    }, 2000)
  }
}

function handleIgnore(candidateId: string) {
  store.ignoreCandidate(candidateId)
}

function handleAddManual() {
  if (!manualTitle.value.trim()) return
  store.addCandidate({
    sourceType: manualSourceType.value,
    title: manualTitle.value.trim(),
    reason: manualReason.value.trim(),
    suggestedPriority: manualPriority.value,
  })
  manualTitle.value = ''
  manualReason.value = ''
  showManualForm.value = false
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function truncated(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '...'
}
</script>

<template>
  <div class="tcp">
    <!-- Header -->
    <div class="tcp__header">
      <div class="tcp__header-left">
        <Lightbulb :size="15" />
        <h2 class="tcp__title">Task Candidates</h2>
      </div>
      <span v-if="visibleCandidates.length > 0" class="tcp__count-badge">
        {{ visibleCandidates.length }}
      </span>
    </div>

    <!-- Info banner -->
    <div class="tcp__banner">
      <Lightbulb :size="11" class="tcp__banner-icon" />
      <span>Auto-generated from threads, regression failures, and feedback</span>
    </div>

    <!-- Stats bar -->
    <div class="tcp__stats" v-if="visibleCandidates.length > 0">
      <span class="tcp__stats-total">{{ visibleCandidates.length }} total</span>
      <span
        v-for="(count, source) in sourceCounts"
        :key="source"
        v-show="count > 0"
        class="tcp__stats-chip"
        :style="{ background: sourceTypeColor[source as TaskCandidateSource] + '18', color: sourceTypeColor[source as TaskCandidateSource] }"
      >
        {{ sourceTypeLabel[source as TaskCandidateSource] }} {{ count }}
      </span>
    </div>

    <!-- Filter bar -->
    <div class="tcp__filters" v-if="visibleCandidates.length > 0">
      <button
        v-for="f in FILTERS"
        :key="f.key"
        :class="['tcp__filter-btn', { 'tcp__filter-btn--active': activeFilter === f.key }]"
        @click="activeFilter = f.key"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- Candidate list -->
    <div class="tcp__list" v-if="filteredCandidates.length > 0">
      <div
        v-for="candidate in filteredCandidates"
        :key="candidate.candidateId"
        :class="['tcp__card', { 'tcp__card--converted': convertFeedback === candidate.candidateId }]"
      >
        <div class="tcp__card-top">
          <!-- Source badge -->
          <span
            class="tcp__card-source"
            :style="{
              background: sourceTypeColor[candidate.sourceType] + '14',
              color: sourceTypeColor[candidate.sourceType],
              borderColor: sourceTypeColor[candidate.sourceType] + '30',
            }"
          >
            {{ sourceTypeLabel[candidate.sourceType] }}
          </span>

          <!-- Priority badge -->
          <span :class="['tcp__card-pri', `tcp__card-pri--${candidate.suggestedPriority}`]">
            {{ candidate.suggestedPriority.toUpperCase() }}
          </span>

          <!-- Timestamp -->
          <span class="tcp__card-time">{{ formatTimestamp(candidate.createdAt) }}</span>
        </div>

        <!-- Title -->
        <h3 class="tcp__card-title">{{ candidate.title }}</h3>

        <!-- Reason -->
        <p class="tcp__card-reason">{{ truncated(candidate.reason, 100) }}</p>

        <!-- Meta -->
        <div class="tcp__card-meta">
          <span v-if="candidate.relatedThreadId" class="tcp__card-thread">
            Thread {{ candidate.relatedThreadId.slice(-6) }}
          </span>
          <span v-if="candidate.relatedVersion" class="tcp__card-version">
            v{{ candidate.relatedVersion }}
          </span>
        </div>

        <!-- Actions -->
        <div class="tcp__card-actions">
          <button
            class="tcp__card-btn tcp__card-btn--convert"
            @click="handleConvert(candidate.candidateId)"
          >
            <ArrowRight :size="11" />
            {{ convertFeedback === candidate.candidateId ? 'Converted!' : 'Convert to Task' }}
          </button>
          <button
            class="tcp__card-btn tcp__card-btn--ignore"
            @click="handleIgnore(candidate.candidateId)"
          >
            <X :size="11" />
            Ignore
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="visibleCandidates.length === 0" class="tcp__empty">
      <Lightbulb :size="28" stroke-width="1.2" class="tcp__empty-icon" />
      <p class="tcp__empty-title">No pending candidates</p>
      <p class="tcp__empty-desc">
        Task candidates are generated from thread summaries, regression failures, and blocked tasks.
        Use the form below to create one manually.
      </p>
    </div>

    <!-- Filter empty state -->
    <div v-else-if="filteredCandidates.length === 0" class="tcp__empty tcp__empty--small">
      <Lightbulb :size="20" stroke-width="1.2" class="tcp__empty-icon" />
      <p class="tcp__empty-title">No candidates match filter</p>
    </div>

    <!-- Manual candidate form toggle -->
    <div class="tcp__manual-section">
      <button
        class="tcp__toggle-btn"
        @click="showManualForm = !showManualForm"
      >
        <Plus :size="12" />
        {{ showManualForm ? 'Cancel' : 'Add Candidate' }}
      </button>

      <div v-if="showManualForm" class="tcp__manual-form">
        <select v-model="manualSourceType" class="tcp__select">
          <option value="user-feedback">User Feedback</option>
          <option value="thread-summary">Thread Summary</option>
          <option value="failed-task">Failed Task</option>
          <option value="blocked-task">Blocked Task</option>
          <option value="regression-fail">Regression Fail</option>
          <option value="beta-smoke-issue">Beta Smoke Issue</option>
        </select>
        <input
          v-model="manualTitle"
          class="tcp__input"
          placeholder="Candidate title..."
          @keyup.enter="handleAddManual"
        />
        <textarea
          v-model="manualReason"
          class="tcp__textarea"
          placeholder="Reason / description..."
          rows="2"
        ></textarea>
        <div class="tcp__form-row">
          <select v-model="manualPriority" class="tcp__select tcp__select--sm">
            <option value="p1">P1 - High</option>
            <option value="p0">P0 - Critical</option>
            <option value="p2">P2 - Medium</option>
            <option value="p3">P3 - Low</option>
          </select>
          <button
            class="tcp__form-submit"
            @click="handleAddManual"
            :disabled="!manualTitle.trim()"
          >
            <Plus :size="12" /> Add
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Root ── */
.tcp {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  user-select: none;
}

/* ── Header ── */
.tcp__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.tcp__header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ls-accent, #5a93ff);
}
.tcp__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ls-text-primary, #e9edf6);
  margin: 0;
}
.tcp__count-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(90, 147, 255, 0.12);
  color: var(--ls-accent, #5a93ff);
}

/* ── Banner ── */
.tcp__banner {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(90, 147, 255, 0.05);
  border: 1px solid rgba(90, 147, 255, 0.1);
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  margin-bottom: 10px;
}
.tcp__banner-icon {
  color: var(--ls-accent, #5a93ff);
  flex-shrink: 0;
}

/* ── Stats bar ── */
.tcp__stats {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.tcp__stats-total {
  font-size: 10px;
  font-weight: 600;
  color: var(--ls-text-secondary, #c3c9d4);
  margin-right: 4px;
}
.tcp__stats-chip {
  font-size: 9px;
  font-weight: 500;
  padding: 1px 7px;
  border-radius: 999px;
}

/* ── Filter bar ── */
.tcp__filters {
  display: flex;
  gap: 3px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.tcp__filter-btn {
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: transparent;
  color: var(--ls-text-hint, #5d667a);
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s;
}
.tcp__filter-btn:hover {
  border-color: rgba(255, 255, 255, 0.12);
  color: var(--ls-text-secondary, #c3c9d4);
}
.tcp__filter-btn--active {
  background: rgba(90, 147, 255, 0.12);
  border-color: rgba(90, 147, 255, 0.25);
  color: var(--ls-accent, #5a93ff);
}

/* ── Candidate list ── */
.tcp__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

/* ── Candidate card ── */
.tcp__card {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: var(--ls-bg-elevated, #101624);
  transition: all 0.2s;
}
.tcp__card:hover {
  border-color: rgba(255, 255, 255, 0.1);
}
.tcp__card--converted {
  border-color: rgba(84, 216, 140, 0.3);
  background: rgba(84, 216, 140, 0.04);
}
.tcp__card-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.tcp__card-source {
  font-size: 9px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;
  border: 1px solid;
}
.tcp__card-pri {
  font-size: 8px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
}
.tcp__card-pri--p0 { background: rgba(255, 107, 107, 0.12); color: #ff6b6b; }
.tcp__card-pri--p1 { background: rgba(90, 147, 255, 0.12); color: #5a93ff; }
.tcp__card-pri--p2 { background: rgba(142, 150, 166, 0.12); color: #8e96a6; }
.tcp__card-pri--p3 { background: rgba(142, 150, 166, 0.08); color: #8e96a6; }
.tcp__card-time {
  font-size: 9px;
  color: var(--ls-text-hint, #5d667a);
  margin-left: auto;
}
.tcp__card-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--ls-text-primary, #e9edf6);
  margin: 0 0 4px;
}
.tcp__card-reason {
  font-size: 11px;
  color: var(--ls-text-hint, #5d667a);
  margin: 0 0 6px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.tcp__card-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.tcp__card-thread,
.tcp__card-version {
  font-size: 9px;
  color: var(--ls-text-hint, #5d667a);
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.03);
}
.tcp__card-actions {
  display: flex;
  gap: 4px;
}
.tcp__card-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 5px;
  border: none;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s;
}
.tcp__card-btn--convert {
  background: rgba(90, 147, 255, 0.12);
  color: #5a93ff;
}
.tcp__card-btn--convert:hover {
  background: rgba(90, 147, 255, 0.2);
}
.tcp__card-btn--ignore {
  background: transparent;
  color: #8e96a6;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.tcp__card-btn--ignore:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--ls-text-secondary, #c3c9d4);
}

/* ── Empty state ── */
.tcp__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}
.tcp__empty--small {
  flex: 0;
  padding: 24px 20px;
}
.tcp__empty-icon {
  color: var(--ls-text-hint, #5d667a);
  margin-bottom: 12px;
  opacity: 0.5;
}
.tcp__empty-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ls-text-secondary, #c3c9d4);
  margin: 0 0 6px;
}
.tcp__empty-desc {
  font-size: 11px;
  color: var(--ls-text-hint, #5d667a);
  margin: 0;
  max-width: 280px;
  line-height: 1.5;
}

/* ── Manual section ── */
.tcp__manual-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.tcp__toggle-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  background: transparent;
  color: var(--ls-text-hint, #5d667a);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.12s;
  width: 100%;
  justify-content: center;
}
.tcp__toggle-btn:hover {
  border-color: rgba(90, 147, 255, 0.3);
  color: var(--ls-accent, #5a93ff);
}
.tcp__manual-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(90, 147, 255, 0.12);
  background: rgba(90, 147, 255, 0.03);
}
.tcp__input,
.tcp__select {
  height: 30px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--ls-bg-elevated, #101624);
  color: var(--ls-text-primary, #e9edf6);
  font-size: 11px;
  outline: none;
}
.tcp__input:focus,
.tcp__select:focus {
  border-color: rgba(90, 147, 255, 0.3);
}
.tcp__select--sm {
  height: 28px;
  padding: 0 6px;
}
.tcp__textarea {
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--ls-bg-elevated, #101624);
  color: var(--ls-text-primary, #e9edf6);
  font-size: 11px;
  outline: none;
  resize: vertical;
  font-family: inherit;
  line-height: 1.4;
}
.tcp__textarea:focus {
  border-color: rgba(90, 147, 255, 0.3);
}
.tcp__form-row {
  display: flex;
  gap: 6px;
  align-items: center;
}
.tcp__form-submit {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 16px;
  border-radius: 6px;
  border: none;
  background: var(--ls-accent, #5a93ff);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s;
}
.tcp__form-submit:hover:not(:disabled) {
  filter: brightness(1.1);
}
.tcp__form-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
