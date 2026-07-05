<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAutomationStore } from '../store/automation.store'
import { runAutomation } from '../services/automation-runner.service'
import AutomationEmptyState from './AutomationEmptyState.vue'
import AutomationEditor from './AutomationEditor.vue'
import AutomationRunHistory from './AutomationRunHistory.vue'
import type { AutomationRunStatus } from '../types/automation.types'

const store = useAutomationStore()

const showEditor = ref(false)
const editingId = ref<string | undefined>(undefined)
const runningIds = ref<Set<string>>(new Set())

const hasAutomations = computed(() => store.automations.length > 0)

const lastRunStatus = computed(() => {
  const map: Record<string, AutomationRunStatus | undefined> = {}
  for (const a of store.automations) {
    const runs = store.recentRuns(a.id)
    map[a.id] = runs[0]?.status
  }
  return map
})

function openCreate() {
  editingId.value = undefined
  showEditor.value = true
}

function openEdit(id: string) {
  editingId.value = id
  showEditor.value = true
}

function handleEditorSave() {
  showEditor.value = false
  editingId.value = undefined
}

function handleEditorCancel() {
  showEditor.value = false
  editingId.value = undefined
}

function handleDelete(id: string) {
  store.removeAutomation(id)
}

function handleToggle(id: string) {
  const a = store.automations.find((item) => item.id === id)
  if (!a) return
  if (a.enabled) {
    store.disableAutomation(id)
  } else {
    store.enableAutomation(id)
  }
}

async function handleRun(id: string) {
  if (runningIds.value.has(id)) return
  runningIds.value.add(id)
  try {
    await runAutomation(id)
  } catch {
    /* error is already recorded in run history */
  } finally {
    runningIds.value.delete(id)
  }
}

function statusDotClass(status?: AutomationRunStatus): string {
  if (status === 'done') return 'auto-list__dot--done'
  if (status === 'failed') return 'auto-list__dot--failed'
  if (status === 'running' || status === 'queued') return 'auto-list__dot--running'
  return ''
}
</script>

<template>
  <div class="auto-list">
    <template v-if="showEditor">
      <AutomationEditor
        :automation-id="editingId"
        @save="handleEditorSave"
        @cancel="handleEditorCancel"
      />
    </template>

    <template v-else-if="hasAutomations">
      <div class="auto-list__toolbar">
        <span class="auto-list__heading">Automations</span>
        <button class="auto-list__add-btn" @click="openCreate">+ New</button>
      </div>

      <div class="auto-list__items">
        <div
          v-for="a in store.automations"
          :key="a.id"
          class="auto-list__item"
        >
          <div class="auto-list__item-top">
            <span class="auto-list__item-name">{{ a.name }}</span>
            <span
              v-if="lastRunStatus[a.id]"
              :class="['auto-list__dot', statusDotClass(lastRunStatus[a.id])]"
              :title="lastRunStatus[a.id]"
            />
          </div>

          <span class="auto-list__schedule">{{ a.schedule || 'Manual' }}</span>

          <div class="auto-list__item-actions">
            <label class="auto-list__toggle" :title="a.enabled ? 'Disable' : 'Enable'">
              <input
                type="checkbox"
                :checked="a.enabled"
                @change="handleToggle(a.id)"
              />
              <span class="auto-list__toggle-track" />
            </label>

            <button
              class="auto-list__btn auto-list__btn--run"
              :disabled="runningIds.has(a.id)"
              title="Run Now"
              @click="handleRun(a.id)"
            >
              {{ runningIds.has(a.id) ? '...' : '\u25B6' }}
            </button>

            <button
              class="auto-list__btn auto-list__btn--edit"
              title="Edit"
              @click="openEdit(a.id)"
            >&#x270E;</button>

            <button
              class="auto-list__btn auto-list__btn--del"
              title="Delete"
              @click="handleDelete(a.id)"
            >&#x2715;</button>
          </div>

          <AutomationRunHistory :automation-id="a.id" />
        </div>
      </div>
    </template>

    <AutomationEmptyState v-else @create="openCreate" />
  </div>
</template>

<style scoped>
.auto-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.auto-list__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--ls-border, rgba(255,255,255,0.06));
}
.auto-list__heading {
  font-size: 13px;
  font-weight: 600;
  color: var(--ls-text-primary, #c3c9d4);
}
.auto-list__add-btn {
  padding: 4px 12px;
  border: none;
  border-radius: var(--ls-radius-sm, 4px);
  background: var(--ls-accent, #5b8af5);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity var(--ls-duration-fast, 0.15s);
}
.auto-list__add-btn:hover { opacity: 0.85; }

.auto-list__items {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.auto-list__item {
  padding: 10px 12px;
  border-radius: var(--ls-radius-sm, 4px);
  background: var(--ls-bg-panel, #1e1f23);
  border: 1px solid var(--ls-border, rgba(255,255,255,0.06));
  transition: border-color var(--ls-duration-fast, 0.15s);
}
.auto-list__item:hover {
  border-color: var(--ls-bg-panel-hover, rgba(255,255,255,0.1));
}
.auto-list__item-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}
.auto-list__item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ls-text-primary, #c3c9d4);
}
.auto-list__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.auto-list__dot--done { background: var(--ls-success, #4caf50); }
.auto-list__dot--failed { background: var(--ls-danger, #e53935); }
.auto-list__dot--running { background: var(--ls-accent, #5b8af5); animation: pulse-dot 1.2s infinite; }
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.auto-list__schedule {
  font-size: 11px;
  color: var(--ls-text-muted, #5d667a);
  margin-bottom: 8px;
  display: block;
}
.auto-list__item-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

/* Toggle switch */
.auto-list__toggle {
  position: relative;
  display: inline-block;
  width: 30px;
  height: 16px;
  cursor: pointer;
}
.auto-list__toggle input { display: none; }
.auto-list__toggle-track {
  position: absolute;
  inset: 0;
  background: var(--ls-border, rgba(255,255,255,0.1));
  border-radius: 8px;
  transition: background var(--ls-duration-fast, 0.15s);
}
.auto-list__toggle-track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  transition: transform var(--ls-duration-fast, 0.15s);
}
.auto-list__toggle input:checked + .auto-list__toggle-track {
  background: var(--ls-success, #4caf50);
}
.auto-list__toggle input:checked + .auto-list__toggle-track::after {
  transform: translateX(14px);
}

.auto-list__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--ls-radius-sm, 4px);
  background: transparent;
  color: var(--ls-text-muted, #5d667a);
  font-size: 12px;
  cursor: pointer;
  transition: color var(--ls-duration-fast, 0.15s), background var(--ls-duration-fast, 0.15s);
}
.auto-list__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.auto-list__btn--run:hover:not(:disabled) { color: var(--ls-accent, #5b8af5); background: rgba(91,138,245,0.1); }
.auto-list__btn--edit:hover:not(:disabled) { color: var(--ls-text-primary, #c3c9d4); background: rgba(255,255,255,0.06); }
.auto-list__btn--del:hover:not(:disabled) { color: var(--ls-danger, #e53935); background: rgba(229,57,53,0.1); }
</style>
