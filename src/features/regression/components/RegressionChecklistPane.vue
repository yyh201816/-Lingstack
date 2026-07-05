<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRegressionChecklistStore } from '@/features/regression/store/regression-checklist.store'
import type { RegressionChecklistItem, RegressionItemStatus, RegressionArea } from '@/features/regression/types'
import {
  ClipboardCheck, Check, X, AlertTriangle, Plus, ArrowRight
} from 'lucide-vue-next'

const store = useRegressionChecklistStore()

// ── Local state ──
const showCreateForm = ref(false)
const newTaskId = ref('')
const newVersion = ref('')
const newChecklistTaskId = ref('')
const activeNoteKey = ref<string | null>(null)
const noteDraft = ref('')

// ── Computed ──
const totalItems = computed(() => store.active?.items.length ?? 0)

const progressionPct = computed(() => {
  if (!totalItems.value) return 0
  return Math.round((store.activePassCount / totalItems.value) * 100)
})

const overallStatusLabel = computed(() => {
  if (!store.active) return ''
  if (store.isAllPass) return 'All Pass'
  if (store.activeFailCount > 0) return `${store.activeFailCount} Failures`
  if (store.activePendingCount > 0) return `${store.activePendingCount} Remaining`
  return 'Pending'
})

const overallStatusColor = computed(() => {
  if (!store.active) return 'var(--ls-text-hint)'
  if (store.isAllPass) return '#54d88c'
  if (store.activeFailCount > 0) return '#ff6b6b'
  if (store.activePendingCount === totalItems.value) return '#8e96a6'
  return '#ffd463'
})

// ── Area grouping ──
const AREAS: RegressionArea[] = [
  'packaging', 'startup', 'workspace', 'thread', 'review',
  'terminal', 'git', 'skill-runner', 'update', 'settings', 'persistence'
]

const areaLabels: Record<RegressionArea, string> = {
  packaging: 'Packaging',
  startup: 'Startup',
  workspace: 'Workspace',
  thread: 'Thread',
  review: 'Review',
  terminal: 'Terminal',
  git: 'Git',
  'skill-runner': 'Skill Runner',
  update: 'Update',
  settings: 'Settings',
  persistence: 'Persistence',
}

const groupedItems = computed(() => {
  if (!store.active) return []
  const groups: { area: RegressionArea; items: RegressionChecklistItem[] }[] = []
  for (const area of AREAS) {
    const items = store.active.items.filter(i => i.area === area)
    if (items.length > 0) {
      groups.push({ area, items })
    }
  }
  return groups
})

// ── Methods ──
function handleToggleItem(itemKey: string) {
  store.toggleActiveItem(itemKey)
}

function handleMarkFail(itemKey: string) {
  store.updateActiveItem(itemKey, 'fail')
}

function handleItemRightClick(itemKey: string, e: MouseEvent) {
  e.preventDefault()
  handleMarkFail(itemKey)
}

function startEditingNote(item: RegressionChecklistItem) {
  activeNoteKey.value = item.key
  noteDraft.value = item.note ?? ''
}

function saveNote(itemKey: string) {
  if (activeNoteKey.value !== itemKey) return
  store.updateActiveItem(itemKey, store.active?.items.find(i => i.key === itemKey)?.status ?? 'pending', noteDraft.value || undefined)
  activeNoteKey.value = null
  noteDraft.value = ''
}

function cancelNote() {
  activeNoteKey.value = null
  noteDraft.value = ''
}

function handleCreateChecklist() {
  if (!newTaskId.value.trim()) return
  store.createChecklist(newTaskId.value.trim(), newVersion.value.trim() || undefined)
  newTaskId.value = ''
  newVersion.value = ''
  showCreateForm.value = false
}

function handleCreateNew() {
  if (!newChecklistTaskId.value.trim()) return
  store.createChecklist(newChecklistTaskId.value.trim())
  newChecklistTaskId.value = ''
}

function handleResetAll() {
  if (!store.active) return
  store.resetChecklist(store.active.id)
}

function handleMarkAllPass() {
  if (!store.active) return
  for (const item of store.active.items) {
    if (item.status !== 'pass') {
      store.updateActiveItem(item.key, 'pass')
    }
  }
}

// ── Status helpers ──
function statusIcon(item: RegressionChecklistItem) {
  switch (item.status) {
    case 'pass': return Check
    case 'fail': return AlertTriangle
    case 'skipped': return X
    default: return null
  }
}

function statusIconClass(status: RegressionItemStatus) {
  switch (status) {
    case 'pass': return 'rcp__status-icon--pass'
    case 'fail': return 'rcp__status-icon--fail'
    case 'skipped': return 'rcp__status-icon--skip'
    default: return 'rcp__status-icon--pending'
  }
}

function formatTimestamp(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="rcp">
    <!-- Header -->
    <div class="rcp__header">
      <div class="rcp__header-left">
        <ClipboardCheck :size="15" />
        <h2 class="rcp__title">Regression Checklist</h2>
      </div>
      <span
        v-if="store.active"
        class="rcp__status-badge"
        :style="{ background: overallStatusColor + '18', color: overallStatusColor }"
      >
        {{ overallStatusLabel }}
      </span>
    </div>

    <!-- Active Checklist -->
    <template v-if="store.active">
      <!-- Summary bar -->
      <div class="rcp__summary">
        <div class="rcp__summary-text">
          <span class="rcp__summary-count">
            {{ store.activePassCount }}/{{ totalItems }} passed
          </span>
          <span v-if="store.activeFailCount > 0" class="rcp__summary-fail">
            &middot; {{ store.activeFailCount }} failed
          </span>
        </div>
        <div class="rcp__progress-track">
          <div
            class="rcp__progress-fill"
            :style="{ width: progressionPct + '%', background: overallStatusColor }"
          ></div>
        </div>
      </div>

      <!-- Checklist meta -->
      <div class="rcp__meta">
        <span class="rcp__meta-item">Task: {{ store.active.taskId }}</span>
        <span v-if="store.active.version" class="rcp__meta-item">v{{ store.active.version }}</span>
      </div>

      <!-- Area-grouped items -->
      <div class="rcp__list">
        <div
          v-for="group in groupedItems"
          :key="group.area"
          class="rcp__area-group"
        >
          <div class="rcp__area-header">
            <span class="rcp__area-dot"></span>
            <span class="rcp__area-label">{{ areaLabels[group.area] }}</span>
            <span class="rcp__area-count">{{ group.items.filter(i => i.status === 'pass').length }}/{{ group.items.length }}</span>
          </div>

          <div
            v-for="item in group.items"
            :key="item.key"
            :class="['rcp__item', `rcp__item--${item.status}`]"
            @contextmenu="handleItemRightClick(item.key, $event)"
          >
            <!-- Checkbox toggle -->
            <button
              class="rcp__item-check"
              :class="`rcp__item-check--${item.status}`"
              @click="handleToggleItem(item.key)"
              :title="item.status === 'pass' ? 'Click to uncheck' : 'Click to pass'"
            >
              <Check v-if="item.status === 'pass'" :size="11" />
              <AlertTriangle v-else-if="item.status === 'fail'" :size="11" />
              <X v-else-if="item.status === 'skipped'" :size="11" />
            </button>

            <!-- Label -->
            <span class="rcp__item-label" @click="startEditingNote(item)">
              {{ item.label }}
            </span>

            <!-- Status icon -->
            <component
              v-if="statusIcon(item)"
              :is="statusIcon(item)"
              :size="12"
              :class="['rcp__status-icon', statusIconClass(item.status)]"
            />

            <!-- Timestamp -->
            <span v-if="item.checkedAt" class="rcp__item-time">
              {{ formatTimestamp(item.checkedAt) }}
            </span>

            <!-- Note -->
            <template v-if="activeNoteKey === item.key">
              <div class="rcp__note-overlay" @click="cancelNote"></div>
              <div class="rcp__note-inline">
                <input
                  v-model="noteDraft"
                  class="rcp__note-input"
                  placeholder="Add note..."
                  @keyup.enter="saveNote(item.key)"
                  @keyup.escape="cancelNote"
                />
                <button class="rcp__note-save" @click="saveNote(item.key)">
                  <Check :size="11" />
                </button>
              </div>
            </template>
            <span
              v-else-if="item.note"
              class="rcp__item-note-indicator"
              @click="startEditingNote(item)"
            >
              &bull; {{ item.note }}
            </span>

            <!-- Fail button -->
            <button
              v-if="item.status !== 'fail'"
              class="rcp__item-fail-btn"
              @click="handleMarkFail(item.key)"
              title="Mark as fail"
            >
              <X :size="10" />
            </button>
          </div>
        </div>
      </div>

      <!-- Action bar -->
      <div class="rcp__actions">
        <button class="rcp__action-btn rcp__action-btn--reset" @click="handleResetAll">
          <ArrowRight :size="11" /> Reset All
        </button>
        <button class="rcp__action-btn rcp__action-btn--pass-all" @click="handleMarkAllPass">
          <Check :size="11" /> Mark All Pass
        </button>
      </div>

      <!-- Create New -->
      <div class="rcp__new-section">
        <input
          v-model="newChecklistTaskId"
          class="rcp__new-input"
          placeholder="Task ID for new checklist..."
          @keyup.enter="handleCreateNew"
        />
        <button class="rcp__new-btn" @click="handleCreateNew" :disabled="!newChecklistTaskId.trim()">
          <Plus :size="12" /> Create New
        </button>
      </div>
    </template>

    <!-- No active checklist: Create form -->
    <div v-else class="rcp__create">
      <ClipboardCheck :size="32" stroke-width="1.2" class="rcp__create-icon" />
      <p class="rcp__create-title">No Active Checklist</p>
      <p class="rcp__create-desc">
        Create a regression checklist to verify your build across all functional areas.
      </p>

      <template v-if="showCreateForm">
        <div class="rcp__create-form">
          <input
            v-model="newTaskId"
            class="rcp__input"
            placeholder="Task ID (e.g. build-2026-07-04)"
            @keyup.enter="handleCreateChecklist"
          />
          <input
            v-model="newVersion"
            class="rcp__input"
            placeholder="Version (optional, e.g. 1.2.0)"
            @keyup.enter="handleCreateChecklist"
          />
          <button class="rcp__btn rcp__btn--primary" @click="handleCreateChecklist" :disabled="!newTaskId.trim()">
            <Plus :size="12" /> Create Checklist
          </button>
        </div>
      </template>
      <button v-else class="rcp__btn rcp__btn--primary" @click="showCreateForm = true">
        <Plus :size="13" /> Create Checklist
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ── Root ── */
.rcp {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  user-select: none;
}

/* ── Header ── */
.rcp__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.rcp__header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ls-accent, #5a93ff);
}
.rcp__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ls-text-primary, #e9edf6);
  margin: 0;
}
.rcp__status-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
}

/* ── Summary bar ── */
.rcp__summary {
  margin-bottom: 10px;
}
.rcp__summary-text {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.rcp__summary-count {
  font-size: 11px;
  font-weight: 500;
  color: var(--ls-text-secondary, #c3c9d4);
}
.rcp__summary-fail {
  font-size: 11px;
  color: #ff6b6b;
  font-weight: 500;
}
.rcp__progress-track {
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
}
.rcp__progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.25s ease, background 0.25s ease;
}

/* ── Meta ── */
.rcp__meta {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}
.rcp__meta-item {
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  padding: 1px 7px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

/* ── Area groups ── */
.rcp__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}
.rcp__area-group {
  margin-bottom: 4px;
}
.rcp__area-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 4px 4px;
}
.rcp__area-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--ls-accent, #5a93ff);
  opacity: 0.5;
}
.rcp__area-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--ls-text-hint, #5d667a);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  flex: 1;
}
.rcp__area-count {
  font-size: 9px;
  color: var(--ls-text-hint, #5d667a);
  opacity: 0.7;
}

/* ── Item row ── */
.rcp__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background 0.12s;
  position: relative;
}
.rcp__item:hover {
  background: rgba(255, 255, 255, 0.03);
}
.rcp__item--pass {
  /* subtle green tint handled by label */
}
.rcp__item--fail {
  background: rgba(255, 107, 107, 0.06);
}
.rcp__item--fail:hover {
  background: rgba(255, 107, 107, 0.1);
}

/* ── Item checkbox ── */
.rcp__item-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: all 0.12s;
  color: transparent;
}
.rcp__item-check--pending {
  border-color: rgba(255, 255, 255, 0.12);
}
.rcp__item-check--pass {
  border-color: #54d88c;
  background: rgba(84, 216, 140, 0.12);
  color: #54d88c;
}
.rcp__item-check--fail {
  border-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.12);
  color: #ff6b6b;
}
.rcp__item-check--skipped {
  border-color: #ffd463;
  background: rgba(255, 212, 99, 0.12);
  color: #ffd463;
}

/* ── Item label ── */
.rcp__item-label {
  font-size: 12px;
  color: var(--ls-text-secondary, #c3c9d4);
  flex: 1;
  cursor: pointer;
  transition: color 0.12s;
}
.rcp__item--pass .rcp__item-label {
  color: #54d88c;
}
.rcp__item--fail .rcp__item-label {
  color: #ff6b6b;
}

/* ── Status icon ── */
.rcp__status-icon {
  flex-shrink: 0;
}
.rcp__status-icon--pass {
  color: #54d88c;
}
.rcp__status-icon--fail {
  color: #ff6b6b;
}
.rcp__status-icon--skip {
  color: #ffd463;
}
.rcp__status-icon--pending {
  color: rgba(255, 255, 255, 0.15);
}

/* ── Timestamp ── */
.rcp__item-time {
  font-size: 9px;
  color: var(--ls-text-hint, #5d667a);
  opacity: 0.6;
  white-space: nowrap;
}

/* ── Fail button ── */
.rcp__item-fail-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  border: none;
  background: transparent;
  color: rgba(255, 107, 107, 0.3);
  cursor: pointer;
  opacity: 0;
  transition: all 0.12s;
  padding: 0;
}
.rcp__item:hover .rcp__item-fail-btn {
  opacity: 1;
}
.rcp__item-fail-btn:hover {
  background: rgba(255, 107, 107, 0.15);
  color: #ff6b6b;
}

/* ── Note indicator ── */
.rcp__item-note-indicator {
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  opacity: 0.8;
}
.rcp__item-note-indicator:hover {
  opacity: 1;
  color: var(--ls-accent, #5a93ff);
}

/* ── Note inline ── */
.rcp__note-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
}
.rcp__note-inline {
  position: absolute;
  right: 8px;
  top: 100%;
  z-index: 2;
  display: flex;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--ls-bg-elevated, #101624);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}
.rcp__note-input {
  width: 180px;
  height: 26px;
  padding: 0 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: var(--ls-bg-panel, #0b0f18);
  color: var(--ls-text-primary, #e9edf6);
  font-size: 11px;
  outline: none;
}
.rcp__note-input:focus {
  border-color: var(--ls-accent, #5a93ff);
}
.rcp__note-save {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  border: none;
  background: var(--ls-accent, #5a93ff);
  color: #fff;
  cursor: pointer;
  padding: 0;
}

/* ── Actions bar ── */
.rcp__actions {
  display: flex;
  gap: 6px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.rcp__action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: transparent;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s;
}
.rcp__action-btn--reset {
  color: #8e96a6;
}
.rcp__action-btn--reset:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--ls-text-secondary, #c3c9d4);
}
.rcp__action-btn--pass-all {
  color: #54d88c;
  border-color: rgba(84, 216, 140, 0.15);
}
.rcp__action-btn--pass-all:hover {
  background: rgba(84, 216, 140, 0.08);
}

/* ── Create New section ── */
.rcp__new-section {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.rcp__new-input {
  flex: 1;
  height: 30px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--ls-bg-elevated, #101624);
  color: var(--ls-text-primary, #e9edf6);
  font-size: 11px;
  outline: none;
}
.rcp__new-input:focus {
  border-color: rgba(90, 147, 255, 0.3);
}
.rcp__new-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 14px;
  border-radius: 6px;
  border: none;
  background: rgba(90, 147, 255, 0.12);
  color: var(--ls-accent, #5a93ff);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.12s;
}
.rcp__new-btn:hover:not(:disabled) {
  background: rgba(90, 147, 255, 0.2);
}
.rcp__new-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Empty / Create form ── */
.rcp__create {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}
.rcp__create-icon {
  color: var(--ls-text-hint, #5d667a);
  margin-bottom: 12px;
  opacity: 0.5;
}
.rcp__create-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ls-text-secondary, #c3c9d4);
  margin: 0 0 6px;
}
.rcp__create-desc {
  font-size: 11px;
  color: var(--ls-text-hint, #5d667a);
  margin: 0 0 16px;
  max-width: 280px;
  line-height: 1.5;
}
.rcp__create-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 260px;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--ls-bg-elevated, #101624);
}
.rcp__input {
  height: 32px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--ls-bg-panel, #0b0f18);
  color: var(--ls-text-primary, #e9edf6);
  font-size: 11px;
  outline: none;
}
.rcp__input:focus {
  border-color: rgba(90, 147, 255, 0.3);
}

/* ── Buttons ── */
.rcp__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 6px;
  border: none;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s;
}
.rcp__btn--primary {
  background: var(--ls-accent, #5a93ff);
  color: #fff;
}
.rcp__btn--primary:hover:not(:disabled) {
  filter: brightness(1.1);
}
.rcp__btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
