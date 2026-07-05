<script setup lang="ts">
import { ref } from 'vue'
import { useBootstrapTaskStore } from '@/features/bootstrap/store/bootstrap-task.store'
import { useThreadStore } from '@/features/threads/store/thread.store'
import BootstrapTaskCard from './BootstrapTaskCard.vue'
import { Plus, ClipboardList, AlertTriangle } from 'lucide-vue-next'
import type { BootstrapTaskStatus, BootstrapTaskType, BootstrapTaskSource, BootstrapTaskPriority, BootstrapTaskSeverity } from '../types'

const store = useBootstrapTaskStore()
const threadStore = useThreadStore()

// ── New task form ──
const showNewForm = ref(false)
const newTitle = ref('')
const newType = ref<BootstrapTaskType>('bugfix')
const newPriority = ref<BootstrapTaskPriority>('p1')
const newSource = ref<BootstrapTaskSource>('manual-create')
const newDescription = ref('')
const newSeverity = ref<BootstrapTaskSeverity>('medium')

// ── Column definitions ──
const columns = [
  { id: 'backlog' as const, label: 'Backlog', items: store.backlogItems, color: '#8e96a6' },
  { id: 'running' as const, label: 'Running', items: store.runningItems, color: '#5a93ff' },
  { id: 'review' as const, label: 'Review', items: store.reviewItems, color: '#a17aff' },
  { id: 'released' as const, label: 'Released', items: store.releasedItems, color: '#54d88c' },
]

// ── New task submit ──
function addTask() {
  if (!newTitle.value.trim()) return
  store.addTask({
    title: newTitle.value.trim(),
    description: newDescription.value.trim(),
    type: newType.value,
    source: newSource.value,
    priority: newPriority.value,
    severity: newSeverity.value,
  })
  // Reset form
  newTitle.value = ''
  newDescription.value = ''
  newType.value = 'bugfix'
  newPriority.value = 'p1'
  newSource.value = 'manual-create'
  newSeverity.value = 'medium'
  showNewForm.value = false
}

// ── Handle card Start: create thread, attach, then start task ──
function handleStart(taskId: string) {
  const task = store.getTask(taskId)
  if (!task) return
  const thread = threadStore.createThread(
    task.title,
    threadStore.activeThread?.projectId ?? '',
    'local',
    'chat',
  )
  if (thread?.id) {
    store.attachThread(taskId, thread.id)
  }
  store.startTask(taskId)
}

// ── Handle status change from card ──
function handleStatusChange(taskId: string, newStatus: BootstrapTaskStatus) {
  switch (newStatus) {
    case 'backlog': store.moveToBacklog(taskId); break
    case 'ready': store.markReady(taskId); break
    case 'running': store.startTask(taskId); break
    case 'review': store.markReview(taskId); break
    case 'blocked': store.markBlocked(taskId); break
    case 'verified': store.markVerified(taskId); break
    case 'released': store.markReleased(taskId); break
    case 'archived': store.archiveTask(taskId); break
  }
}

// ── Handle open thread from card ──
function handleOpenThread(threadId: string) {
  threadStore.activeThreadId = threadId
}
</script>

<template>
  <div class="btb-board">
    <!-- Header -->
    <div class="btb-board__header">
      <div class="btb-board__header-left">
        <ClipboardList :size="15" />
        <h2 class="btb-board__title">Bootstrap Board</h2>
      </div>
      <div class="btb-board__header-right">
        <span class="btb-board__count">{{ store.activeCount }} active</span>
        <button class="btb-board__add-btn" @click="showNewForm = !showNewForm">
          <Plus :size="13" /> New Task
        </button>
      </div>
    </div>

    <!-- P0 Blockers Warning -->
    <div v-if="store.p0Blockers.length > 0" class="btb-board__p0-bar">
      <AlertTriangle :size="14" />
      <span>{{ store.p0Blockers.length }} P0 blocker(s) must be resolved before release</span>
    </div>

    <!-- New Task Form -->
    <Transition name="btb-form-fade">
      <div v-if="showNewForm" class="btb-board__new-form">
        <input
          v-model="newTitle"
          class="btb-board__input"
          placeholder="Task title..."
          @keyup.enter="addTask"
        />
        <input
          v-model="newDescription"
          class="btb-board__input"
          placeholder="Description (optional)..."
        />
        <div class="btb-board__form-row">
          <select v-model="newType" class="btb-board__select">
            <option value="bugfix">Bugfix</option>
            <option value="ux">UX</option>
            <option value="workflow">Workflow</option>
            <option value="review">Review</option>
            <option value="release">Release</option>
            <option value="regression">Regression</option>
            <option value="docs">Docs</option>
            <option value="refactor">Refactor</option>
            <option value="ci-cd">CI/CD</option>
          </select>
          <select v-model="newPriority" class="btb-board__select">
            <option value="p0">P0</option>
            <option value="p1">P1</option>
            <option value="p2">P2</option>
            <option value="p3">P3</option>
          </select>
          <select v-model="newSource" class="btb-board__select">
            <option value="user-feedback">User Feedback</option>
            <option value="self-heal-scan">Self-Heal Scan</option>
            <option value="beta-smoke-fail">Beta Smoke</option>
            <option value="update-regression">Regression</option>
            <option value="manual-create">Manual</option>
          </select>
          <select v-model="newSeverity" class="btb-board__select">
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button class="btb-board__form-submit" @click="addTask">Add</button>
        </div>
      </div>
    </Transition>

    <!-- Kanban Columns -->
    <div class="btb-board__columns">
      <div
        v-for="col in columns"
        :key="col.id"
        class="btb-col"
      >
        <div class="btb-col__header">
          <div class="btb-col__header-left">
            <span
              class="btb-col__bar"
              :style="{ backgroundColor: col.color }"
            ></span>
            <span class="btb-col__label">{{ col.label }}</span>
          </div>
          <span class="btb-col__count">{{ col.items.length }}</span>
        </div>

        <div class="btb-col__list">
          <BootstrapTaskCard
            v-for="task in col.items"
            :key="task.taskId"
            :task="task"
            @start="handleStart"
            @status-change="handleStatusChange"
            @open-thread="handleOpenThread"
          />

          <!-- Column empty state -->
          <div v-if="col.items.length === 0" class="btb-col__empty">
            <span class="btb-col__empty-text">No tasks</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Board container ── */
.btb-board {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 16px;
  user-select: none;
}

/* ── Header ── */
.btb-board__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.btb-board__header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ls-accent, #5a93ff);
}
.btb-board__header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.btb-board__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ls-text-primary, #e9edf6);
  margin: 0;
}
.btb-board__count {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(84, 216, 140, 0.12);
  color: #54d88c;
  font-weight: 500;
}
.btb-board__add-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  background: transparent;
  color: var(--ls-text-hint, #5d667a);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.12s;
}
.btb-board__add-btn:hover {
  border-color: rgba(90, 147, 255, 0.3);
  color: var(--ls-accent, #5a93ff);
}

/* ── P0 Blockers Bar ── */
.btb-board__p0-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(255, 107, 107, 0.08);
  color: #ff6b6b;
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 12px;
  flex-shrink: 0;
}

/* ── New Task Form ── */
.btb-board__new-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(90, 147, 255, 0.15);
  background: rgba(90, 147, 255, 0.04);
  flex-shrink: 0;
}
.btb-board__input {
  height: 30px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--ls-bg-elevated, #101624);
  color: var(--ls-text-primary, #e9edf6);
  font-size: 11px;
  outline: none;
}
.btb-board__input::placeholder {
  color: var(--ls-text-hint, #5d667a);
}
.btb-board__select {
  height: 28px;
  padding: 0 6px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--ls-bg-elevated, #101624);
  color: var(--ls-text-secondary, #c3c9d4);
  font-size: 11px;
  outline: none;
  cursor: pointer;
}
.btb-board__form-row {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}
.btb-board__form-submit {
  padding: 5px 14px;
  border-radius: 6px;
  border: none;
  background: var(--ls-accent, #5a93ff);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: filter 0.12s;
  margin-left: auto;
}
.btb-board__form-submit:hover {
  filter: brightness(1.15);
}

/* Form transition */
.btb-form-fade-enter-active,
.btb-form-fade-leave-active {
  transition: all 0.15s ease;
}
.btb-form-fade-enter-from,
.btb-form-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
  max-height: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* ── Columns container ── */
.btb-board__columns {
  display: flex;
  gap: 10px;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  min-height: 0;
}

/* ── Single Column ── */
.btb-col {
  flex: 1;
  min-width: 200px;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background: var(--ls-bg-panel, #0b0f18);
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

/* ── Column Header ── */
.btb-col__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  flex-shrink: 0;
}
.btb-col__header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.btb-col__bar {
  width: 3px;
  height: 14px;
  border-radius: 2px;
}
.btb-col__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--ls-text-primary, #e9edf6);
}
.btb-col__count {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(142, 150, 166, 0.12);
  color: var(--ls-text-hint, #5d667a);
  font-weight: 500;
}

/* ── Column List ── */
.btb-col__list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ── Column Empty State ── */
.btb-col__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 8px;
}
.btb-col__empty-text {
  font-size: 11px;
  color: var(--ls-text-hint, #5d667a);
  opacity: 0.6;
}
</style>
