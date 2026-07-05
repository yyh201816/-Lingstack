<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBetaIterationStore } from '../store/beta-iteration.store'
import { useBootstrapTaskStore } from '@/features/bootstrap/store/bootstrap-task.store'
import { useReleaseHistoryStore } from '@/features/release/store/release-history.store'
import {
  Calendar, Plus, ArrowRight, Check, X, AlertTriangle,
  ChevronDown, ChevronRight, Shield, FileText, Rocket, Trash2,
  Loader2, Hammer, ExternalLink, CheckCircle2, RotateCcw,
} from 'lucide-vue-next'
import type { BetaIterationItem, ReleaseGateStatus, BetaChannel } from '../beta-iteration.types'

// ── Stores ──
const store = useBetaIterationStore()
const taskStore = useBootstrapTaskStore()
const releaseStore = useReleaseHistoryStore()

// ── Local state ──
const showCreate = ref(false)
const expandedId = ref<string | null>(null)
const selectedIterationId = ref<string>('')
const ver = ref('')
const title_ = ref('')
const obj = ref('')
const channel = ref<BetaChannel>('beta')
const taskIdsInput = ref('')
const showTaskDropdown = ref<string | null>(null)
const showSuccessMsg = ref(false)
const successMsgText = ref('')
const changelogDraft = ref('')
const showReleaseForm = ref(false)
const releaseNotes = ref('')
const releaseChannel = ref<'beta' | 'stable'>('beta')

// ── Computed ──
const currentIteration = computed(() =>
  store.iterations.find(i => i.id === selectedIterationId.value)
)

const nonArchivedTasks = computed(() =>
  taskStore.tasks.filter(t => t.status !== 'archived')
)

const activeP0Blockers = computed(() =>
  taskStore.p0Blockers
)

const gateProgress = computed(() => {
  const total = store.gateItems.length
  const pass = store.gatePassCount
  return total > 0 ? Math.round((pass / total) * 100) : 0
})

// ── Inline label helpers ──
const statusLabel = (s: string): string => {
  switch (s) {
    case 'planning': return 'Planning'
    case 'building': return 'Building'
    case 'testing': return 'Testing'
    case 'ready_to_release': return 'Ready to Release'
    case 'released': return 'Released'
    case 'rollback': return 'Rollback'
    default: return s
  }
}

const statusClass = (s: string): string => `bib__iter-status bib__iter-status--${s}`

const buildStatusLabel = (bs: string): string => {
  switch (bs) {
    case 'pending': return 'Pending'
    case 'building': return 'Building'
    case 'success': return 'Success'
    case 'failed': return 'Failed'
    default: return bs
  }
}

const buildStatusClass = (bs: string): string => `bib__build-badge bib__build-badge--${bs}`

const gateIcon = (gs: ReleaseGateStatus) =>
  gs === 'pass' ? Check : gs === 'fail' ? X : gs === 'partial' ? AlertTriangle : AlertTriangle

const gateIconCls = (gs: ReleaseGateStatus): string => `bib__gate-icon bib__gate-icon--${gs}`

// ── Flash success ──
function flash(msg: string) {
  successMsgText.value = msg
  showSuccessMsg.value = true
  setTimeout(() => { showSuccessMsg.value = false }, 2000)
}

// ── Create Iteration ──
function create() {
  if (!ver.value.trim()) return
  const taskIds = taskIdsInput.value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  store.createIteration(
    ver.value.trim(),
    title_.value.trim() || `Iteration ${ver.value.trim()}`,
    obj.value.trim(),
    { channel: channel.value, includedTaskIds: taskIds },
  )
  flash(`Iteration ${ver.value.trim()} created`)
  showCreate.value = false
  ver.value = ''
  title_.value = ''
  obj.value = ''
  channel.value = 'beta'
  taskIdsInput.value = ''
}

// ── Select/Collapse ──
function selectIteration(id: string) {
  selectedIterationId.value = id
  const it = store.iterations.find(i => i.id === id)
  if (it) changelogDraft.value = it.changelog
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}
function isExpanded(id: string): boolean {
  return expandedId.value === id
}

// ── Gate cycle ──
function cycleGate(id: string) {
  const g = store.gateItems.find(x => x.id === id)
  if (!g) return
  const order: ReleaseGateStatus[] = ['todo', 'pass', 'fail', 'partial']
  const idx = order.indexOf(g.status)
  store.updateGateItem(id, order[(idx + 1) % order.length])
}

// ── Build Status ──
function setBuildStatus(id: string, st: 'pending' | 'building' | 'success' | 'failed') {
  store.setBuildStatus(id, st)
  flash(`Build status: ${buildStatusLabel(st)}`)
}

// ── Changelog ──
function saveChangelog() {
  if (!currentIteration.value) return
  store.setChangelog(currentIteration.value.id, changelogDraft.value)
  flash('Changelog saved')
}

// ── Task Management ──
function addTaskToIteration(iterationId: string, taskId: string) {
  store.addTaskToIteration(iterationId, taskId)
  showTaskDropdown.value = null
  flash('Task added to iteration')
}

function getTaskTitle(taskId: string): string {
  const t = taskStore.getTask(taskId)
  return t ? t.title : taskId
}

function getTaskPriority(taskId: string): string {
  const t = taskStore.getTask(taskId)
  return t ? t.priority : '--'
}

function getTaskStatus(taskId: string): string {
  const t = taskStore.getTask(taskId)
  return t ? t.status : 'unknown'
}

function taskPriorityColor(p: string): string {
  switch (p) {
    case 'p0': return '#ff6b6b'
    case 'p1': return '#ffd463'
    case 'p2': return '#8e96a6'
    case 'p3': return '#5d667a'
    default: return '#8e96a6'
  }
}

// ── Create Release from Iteration ──
function createReleaseFromIteration() {
  const it = currentIteration.value
  if (!it) return
  releaseStore.addRelease({
    version: it.version,
    releaseNotes: releaseNotes.value.trim() || `Release ${it.version} - ${it.title}`,
    channel: releaseChannel.value,
    includedTaskIds: it.includedTaskIds,
    iterationId: it.id,
  })
  store.setIterationStatus(it.id, 'released')
  flash(`Release ${it.version} created and published`)
  showReleaseForm.value = false
  releaseNotes.value = ''
  releaseChannel.value = 'beta'
}

// ── Status transitions ──
function advanceStatus(it: BetaIterationItem) {
  const flow: Record<string, string> = {
    planning: 'building',
    building: 'testing',
    testing: 'ready_to_release',
    ready_to_release: 'released',
  }
  const next = flow[it.status]
  if (next) store.setIterationStatus(it.id, next as any)
}
</script>

<template>
  <div class="bib">
    <!-- ===== Success Toast ===== -->
    <Transition name="bib-fade">
      <div v-if="showSuccessMsg" class="bib__toast">{{ successMsgText }}</div>
    </Transition>

    <!-- ===== Header ===== -->
    <div class="bib__header">
      <div class="bib__header-left">
        <Calendar :size="15" />
        <h2 class="bib__title">Beta Iteration</h2>
        <span class="bib__badge">{{ store.iterations.length }}</span>
      </div>
      <button class="bib__new-btn" @click="showCreate = !showCreate">
        <Plus :size="13" /> New
      </button>
    </div>

    <!-- ===== Create Form ===== -->
    <Transition name="bib-slide">
      <div v-if="showCreate" class="bib__create-form">
        <div class="bib__form-row">
          <label class="bib__form-label">Version</label>
          <input v-model="ver" class="bib__input" placeholder="e.g. v0.1.7-beta" />
        </div>
        <div class="bib__form-row">
          <label class="bib__form-label">Title</label>
          <input v-model="title_" class="bib__input" placeholder="Iteration title (optional)" />
        </div>
        <div class="bib__form-row">
          <label class="bib__form-label">Objective</label>
          <input v-model="obj" class="bib__input" placeholder="What does this iteration target?" />
        </div>
        <div class="bib__form-row">
          <label class="bib__form-label">Channel</label>
          <select v-model="channel" class="bib__input bib__select">
            <option value="alpha">Alpha</option>
            <option value="beta">Beta</option>
            <option value="rc">RC</option>
          </select>
        </div>
        <div class="bib__form-row">
          <label class="bib__form-label">Included Tasks (comma-separated IDs)</label>
          <input v-model="taskIdsInput" class="bib__input" placeholder="bt_xxx, bt_yyy" />
        </div>
        <button class="bib__create-btn" @click="create">Create Iteration</button>
      </div>
    </Transition>

    <!-- ===== Release Conclusion Banner ===== -->
    <div
      v-if="currentIteration"
      :class="['bib__conclusion', `bib__conclusion--${store.releaseConclusion}`]"
    >
      <CheckCircle2 v-if="store.releaseConclusion === 'ready'" :size="13" />
      <AlertTriangle v-else-if="store.releaseConclusion === 'partial'" :size="13" />
      <X v-else :size="13" />
      <span>
        <template v-if="store.releaseConclusion === 'ready'">Ready to Release</template>
        <template v-else-if="store.releaseConclusion === 'partial'">
          Partially Ready -
          {{ store.gateFailCount }} gate fails, gate {{ gateProgress }}% passed
        </template>
        <template v-else>
          Blocked -
          <span v-if="store.gateFailCount > 0">{{ store.gateFailCount }} gate failures</span>
          <span v-if="activeP0Blockers.length > 0">
            {{ store.gateFailCount > 0 ? ', ' : '' }}{{ activeP0Blockers.length }} P0 blockers
          </span>
        </template>
      </span>
    </div>

    <!-- ===== Iteration List ===== -->
    <div class="bib__list">
      <div
        v-for="it in store.iterations"
        :key="it.id"
        :class="['bib__card', {
          'bib__card--active': it.id === selectedIterationId,
          'bib__card--expanded': isExpanded(it.id)
        }]"
      >
        <!-- Card Header -->
        <div class="bib__card-header" @click="selectIteration(it.id); toggleExpand(it.id)">
          <div class="bib__card-left">
            <span :class="statusClass(it.status)">{{ statusLabel(it.status) }}</span>
            <span
              :class="buildStatusClass(it.buildStatus)"
            >{{ buildStatusLabel(it.buildStatus) }}</span>
            <div>
              <h3 class="bib__card-title">{{ it.title || it.version }}</h3>
              <p class="bib__card-ver">{{ it.version }}</p>
            </div>
            <!-- Task count -->
            <span v-if="it.includedTaskIds.length > 0" class="bib__card-task-count">
              <FileText :size="10" /> {{ it.includedTaskIds.length }}
            </span>
          </div>
          <div class="bib__card-right">
            <!-- Advance status button -->
            <button
              v-if="['planning','building','testing','ready_to_release'].includes(it.status)"
              class="bib__card-act bib__card-act--adv"
              @click.stop="advanceStatus(it)"
            >
              <ArrowRight :size="10" />
              {{ it.status === 'planning' ? 'Build' : it.status === 'building' ? 'Test' : it.status === 'testing' ? 'Ready' : 'Release' }}
            </button>
            <span class="bib__card-date">{{ new Date(it.createdAt).toLocaleDateString() }}</span>
            <component
              :is="isExpanded(it.id) ? ChevronDown : ChevronRight"
              :size="14"
              class="bib__card-chevron"
            />
          </div>
        </div>

        <!-- Expanded Detail -->
        <Transition name="bib-expand">
          <div v-if="isExpanded(it.id)" class="bib__card-body">
            <!-- Build Status Actions -->
            <div class="bib__section">
              <div class="bib__section-title">Build Status</div>
              <div class="bib__build-actions">
                <button
                  class="bib__action bib__action--building"
                  @click="setBuildStatus(it.id, 'building')"
                  :disabled="it.buildStatus === 'building'"
                >
                  <Loader2 :size="11" :class="{ 'bib__spin': it.buildStatus === 'building' }" />
                  Mark Building
                </button>
                <button
                  class="bib__action bib__action--success"
                  @click="setBuildStatus(it.id, 'success')"
                >
                  <Check :size="11" /> Mark Success
                </button>
                <button
                  class="bib__action bib__action--failed"
                  @click="setBuildStatus(it.id, 'failed')"
                >
                  <X :size="11" /> Mark Failed
                </button>
                <button
                  class="bib__action bib__action--pending"
                  @click="setBuildStatus(it.id, 'pending')"
                >
                  <RotateCcw :size="11" /> Reset
                </button>
              </div>
            </div>

            <!-- Changelog Editor -->
            <div class="bib__section">
              <div class="bib__section-title">Changelog</div>
              <textarea
                v-model="changelogDraft"
                class="bib__textarea"
                rows="4"
                placeholder="Write changelog for this iteration..."
              />
              <button
                class="bib__save-btn"
                @click="saveChangelog"
                :disabled="changelogDraft === it.changelog"
              >Save Changelog</button>
            </div>

            <!-- Included Tasks -->
            <div class="bib__section">
              <div class="bib__section-header">
                <div class="bib__section-title">Included Tasks ({{ it.includedTaskIds.length }})</div>
                <button
                  class="bib__add-task-btn"
                  @click="showTaskDropdown = showTaskDropdown === it.id ? null : it.id"
                >
                  <Plus :size="11" /> Add Task
                </button>
              </div>

              <!-- Task list -->
              <div v-if="it.includedTaskIds.length > 0" class="bib__task-list">
                <div
                  v-for="tid in it.includedTaskIds"
                  :key="tid"
                  class="bib__task-item"
                >
                  <span
                    class="bib__task-priority"
                    :style="{ color: taskPriorityColor(getTaskPriority(tid)) }"
                  >[{{ getTaskPriority(tid).toUpperCase() }}]</span>
                  <span class="bib__task-title">{{ getTaskTitle(tid) }}</span>
                  <span class="bib__task-status">{{ getTaskStatus(tid) }}</span>
                  <code class="bib__task-id">{{ tid.slice(-10) }}</code>
                </div>
              </div>
              <div v-else class="bib__task-empty">No tasks included</div>

              <!-- Task dropdown -->
              <Transition name="bib-fade">
                <div v-if="showTaskDropdown === it.id" class="bib__task-dropdown">
                  <div
                    v-for="task in nonArchivedTasks.filter(t => !it.includedTaskIds.includes(t.taskId))"
                    :key="task.taskId"
                    class="bib__task-dropdown-item"
                    @click="addTaskToIteration(it.id, task.taskId)"
                  >
                    <span
                      class="bib__task-priority"
                      :style="{ color: taskPriorityColor(task.priority) }"
                    >[{{ task.priority.toUpperCase() }}]</span>
                    <span class="bib__task-dropdown-title">{{ task.title }}</span>
                    <code class="bib__task-id">{{ task.taskId.slice(-8) }}</code>
                  </div>
                  <div
                    v-if="nonArchivedTasks.filter(t => !it.includedTaskIds.includes(t.taskId)).length === 0"
                    class="bib__task-dropdown-empty"
                  >
                    All tasks already included
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Release Gate Checklist -->
            <div class="bib__section">
              <div class="bib__section-header">
                <div class="bib__section-title">
                  <Shield :size="12" /> Release Gate ({{ store.gatePassCount }}/{{ store.gateItems.length }})
                </div>
              </div>
              <!-- Gate progress bar -->
              <div class="bib__gate-progress">
                <div
                  class="bib__gate-progress-fill"
                  :style="{ width: gateProgress + '%' }"
                  :class="{ 'bib__gate-progress-fill--done': gateProgress === 100 }"
                />
              </div>
              <!-- Gate items -->
              <div class="bib__gate-list">
                <button
                  v-for="g in store.gateItems"
                  :key="g.id"
                  :class="['bib__gate-item', `bib__gate-item--${g.status}`]"
                  @click="cycleGate(g.id)"
                >
                  <component :is="gateIcon(g.status)" :size="11" :class="gateIconCls(g.status)" />
                  <span class="bib__gate-label">{{ g.label }}</span>
                  <span v-if="g.detail" class="bib__gate-detail">{{ g.detail }}</span>
                </button>
              </div>
            </div>

            <!-- Release Readiness Panel -->
            <div
              v-if="it.status !== 'released' && it.status !== 'rollback'"
              :class="['bib__readiness', `bib__readiness--${store.releaseConclusion}`]"
            >
              <div class="bib__readiness-header">
                <Rocket :size="13" />
                <span>Release Readiness</span>
              </div>
              <div class="bib__readiness-details">
                <div class="bib__readiness-row">
                  <span>Gate Status</span>
                  <span :class="store.releaseConclusion === 'ready' ? 'bib__text-ok' : store.releaseConclusion === 'blocked' ? 'bib__text-err' : 'bib__text-warn'">
                    {{ store.releaseConclusion === 'ready' ? 'Passed' : store.releaseConclusion === 'partial' ? 'Partial' : 'Blocked' }}
                  </span>
                </div>
                <div class="bib__readiness-row">
                  <span>P0 Blockers</span>
                  <span :class="activeP0Blockers.length === 0 ? 'bib__text-ok' : 'bib__text-err'">
                    {{ activeP0Blockers.length === 0 ? 'None' : activeP0Blockers.length + ' active' }}
                  </span>
                </div>
              </div>

              <!-- P0 Blocker list -->
              <div v-if="activeP0Blockers.length > 0" class="bib__blocker-list">
                <div
                  v-for="b in activeP0Blockers"
                  :key="b.taskId"
                  class="bib__blocker-item"
                >
                  <AlertTriangle :size="10" class="bib__text-err" />
                  <span>{{ b.title }}</span>
                </div>
              </div>

              <!-- Create Release button -->
              <div class="bib__readiness-actions">
                <button
                  class="bib__release-btn"
                  :class="{ 'bib__release-btn--ready': store.releaseConclusion === 'ready' }"
                  @click="showReleaseForm = !showReleaseForm"
                >
                  <Hammer :size="12" /> Create Release
                </button>
              </div>

              <!-- Release form -->
              <Transition name="bib-slide">
                <div v-if="showReleaseForm" class="bib__release-form">
                  <div class="bib__form-row">
                    <label class="bib__form-label">Version</label>
                    <input class="bib__input" :value="it.version" disabled />
                  </div>
                  <div class="bib__form-row">
                    <label class="bib__form-label">Channel</label>
                    <select v-model="releaseChannel" class="bib__input bib__select">
                      <option value="beta">Beta</option>
                      <option value="stable">Stable</option>
                    </select>
                  </div>
                  <div class="bib__form-row">
                    <label class="bib__form-label">Release Notes</label>
                    <textarea
                      v-model="releaseNotes"
                      class="bib__textarea"
                      rows="3"
                      :placeholder="`Release ${it.version} - ${it.title}`"
                    />
                  </div>
                  <div class="bib__form-row">
                    <div class="bib__form-hint">
                      Will include {{ it.includedTaskIds.length }} tasks from this iteration
                    </div>
                  </div>
                  <button class="bib__create-btn" @click="createReleaseFromIteration">
                    <Rocket :size="12" /> Confirm Release
                  </button>
                </div>
              </Transition>
            </div>

            <!-- Status Action Buttons -->
            <div class="bib__card-actions">
              <button
                v-if="it.status !== 'rollback'"
                class="bib__action bib__action--rollback"
                @click="store.setIterationStatus(it.id, 'rollback')"
              >
                <RotateCcw :size="11" /> Rollback
              </button>
              <button
                class="bib__action bib__action--del"
                @click="flash('Iteration removal not yet implemented in store')"
              >
                <Trash2 :size="11" /> Remove
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- ===== Empty State ===== -->
    <div v-if="!showCreate && store.iterations.length === 0" class="bib__empty">
      <Calendar :size="28" stroke-width="1.2" class="bib__empty-icon" />
      <p class="bib__empty-title">No beta iterations yet</p>
      <p class="bib__empty-desc">Create your first beta iteration to start tracking release readiness.</p>
    </div>
  </div>
</template>

<style scoped>
/* ── Base ── */
.bib {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  user-select: none;
  position: relative;
}

/* ── Toast ── */
.bib__toast {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  padding: 6px 16px;
  border-radius: 6px;
  background: rgba(84, 216, 140, 0.15);
  border: 1px solid rgba(84, 216, 140, 0.25);
  color: #54d88c;
  font-size: 11px;
  font-weight: 500;
  pointer-events: none;
}

/* ── Header ── */
.bib__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.bib__header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ls-accent, #5a93ff);
}
.bib__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ls-text-primary, #e9edf6);
  margin: 0;
}
.bib__badge {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 10px;
  background: rgba(90, 147, 255, 0.12);
  color: var(--ls-accent, #5a93ff);
  font-weight: 600;
  line-height: 18px;
}
.bib__new-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: transparent;
  color: var(--ls-text-secondary, #c3c9d4);
  font-size: 11px;
  cursor: pointer;
  transition: background 0.12s;
}
.bib__new-btn:hover {
  background: rgba(255, 255, 255, 0.04);
}

/* ── Create Form ── */
.bib__create-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(90, 147, 255, 0.15);
  background: rgba(90, 147, 255, 0.04);
  margin-bottom: 10px;
}
.bib__form-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bib__form-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--ls-text-hint, #5d667a);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.bib__input {
  height: 30px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--ls-bg-elevated, #101624);
  color: var(--ls-text-primary, #e9edf6);
  font-size: 11px;
  font-family: inherit;
  outline: none;
}
.bib__input:focus {
  border-color: rgba(90, 147, 255, 0.3);
}
.bib__input:disabled {
  opacity: 0.5;
}
.bib__select {
  appearance: none;
  cursor: pointer;
}
.bib__create-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px;
  border-radius: 6px;
  border: none;
  background: var(--ls-accent, #5a93ff);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.12s;
  margin-top: 2px;
}
.bib__create-btn:hover {
  opacity: 0.85;
}

/* ── Conclusion Banner ── */
.bib__conclusion {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 500;
}
.bib__conclusion--ready {
  background: rgba(84, 216, 140, 0.08);
  color: #54d88c;
}
.bib__conclusion--partial {
  background: rgba(255, 212, 99, 0.08);
  color: #ffd463;
}
.bib__conclusion--blocked {
  background: rgba(255, 107, 107, 0.08);
  color: #ff6b6b;
}

/* ── List ── */
.bib__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ── Card ── */
.bib__card {
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: var(--ls-bg-elevated, #101624);
  overflow: hidden;
  transition: border-color 0.15s;
}
.bib__card--active {
  border-color: rgba(90, 147, 255, 0.2);
}
.bib__card:hover {
  border-color: rgba(255, 255, 255, 0.1);
}

.bib__card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.12s;
  gap: 10px;
}
.bib__card-header:hover {
  background: rgba(255, 255, 255, 0.02);
}

.bib__card-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

/* ── Status Badge ── */
.bib__iter-status {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}
.bib__iter-status--planning {
  background: rgba(142, 150, 166, 0.12);
  color: #8e96a6;
}
.bib__iter-status--building {
  background: rgba(90, 147, 255, 0.12);
  color: #5a93ff;
}
.bib__iter-status--testing {
  background: rgba(161, 122, 255, 0.12);
  color: #a17aff;
}
.bib__iter-status--ready_to_release {
  background: rgba(84, 216, 140, 0.12);
  color: #54d88c;
}
.bib__iter-status--released {
  background: rgba(84, 216, 140, 0.06);
  color: #54d88c;
}
.bib__iter-status--rollback {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
}

/* ── Build Badge ── */
.bib__build-badge {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}
.bib__build-badge--pending {
  background: rgba(142, 150, 166, 0.08);
  color: #8e96a6;
}
.bib__build-badge--building {
  background: rgba(255, 212, 99, 0.12);
  color: #ffd463;
}
.bib__build-badge--success {
  background: rgba(84, 216, 140, 0.08);
  color: #54d88c;
}
.bib__build-badge--failed {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
}

/* ── Card title / version ── */
.bib__card-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--ls-text-primary, #e9edf6);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bib__card-ver {
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  font-family: monospace;
}
.bib__card-task-count {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  flex-shrink: 0;
}

/* ── Card Right ── */
.bib__card-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.bib__card-act {
  padding: 3px 10px;
  border-radius: 5px;
  border: none;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}
.bib__card-act--adv {
  display: flex;
  align-items: center;
  gap: 3px;
  background: rgba(90, 147, 255, 0.1);
  color: #5a93ff;
}
.bib__card-date {
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  white-space: nowrap;
}
.bib__card-chevron {
  color: var(--ls-text-hint, #5d667a);
  flex-shrink: 0;
}

/* ── Card Body (Expanded) ── */
.bib__card-body {
  padding: 0 12px 12px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  padding-top: 12px;
}

.bib__section {
  margin-bottom: 14px;
}
.bib__section:last-child {
  margin-bottom: 0;
}
.bib__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.bib__section-title {
  font-size: 10px;
  font-weight: 500;
  color: var(--ls-text-hint, #5d667a);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* ── Build Actions ── */
.bib__build-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* ── Textarea ── */
.bib__textarea {
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--ls-bg-elevated, #101624);
  color: var(--ls-text-primary, #e9edf6);
  font-size: 11px;
  font-family: inherit;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
}
.bib__textarea:focus {
  border-color: rgba(90, 147, 255, 0.3);
}

.bib__save-btn {
  margin-top: 6px;
  padding: 5px 12px;
  border-radius: 5px;
  border: none;
  background: rgba(90, 147, 255, 0.12);
  color: var(--ls-accent, #5a93ff);
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.12s;
}
.bib__save-btn:hover {
  opacity: 0.8;
}
.bib__save-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

/* ── Task List ── */
.bib__task-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 6px;
}
.bib__task-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.02);
  font-size: 10px;
}
.bib__task-priority {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 9px;
  font-weight: 600;
  flex-shrink: 0;
}
.bib__task-title {
  color: var(--ls-text-secondary, #c3c9d4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.bib__task-status {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(142, 150, 166, 0.1);
  color: #8e96a6;
  flex-shrink: 0;
}
.bib__task-id {
  font-size: 9px;
  color: var(--ls-text-hint, #5d667a);
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  flex-shrink: 0;
}
.bib__task-empty {
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  font-style: italic;
  margin-bottom: 6px;
}

.bib__add-task-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  background: transparent;
  color: var(--ls-text-hint, #5d667a);
  font-size: 10px;
  cursor: pointer;
  transition: all 0.12s;
}
.bib__add-task-btn:hover {
  border-color: rgba(90, 147, 255, 0.3);
  color: var(--ls-accent, #5a93ff);
}

/* ── Task Dropdown ── */
.bib__task-dropdown {
  max-height: 160px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  background: var(--ls-bg-elevated, #101624);
  margin-top: 4px;
}
.bib__task-dropdown-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 10px;
  transition: background 0.1s;
}
.bib__task-dropdown-item:hover {
  background: rgba(90, 147, 255, 0.06);
}
.bib__task-dropdown-title {
  color: var(--ls-text-secondary, #c3c9d4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.bib__task-dropdown-empty {
  padding: 8px 10px;
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  font-style: italic;
  text-align: center;
}

/* ── Gate Progress ── */
.bib__gate-progress {
  height: 3px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.06);
  margin-bottom: 8px;
  overflow: hidden;
}
.bib__gate-progress-fill {
  height: 100%;
  border-radius: 2px;
  background: #ffd463;
  transition: width 0.3s ease;
}
.bib__gate-progress-fill--done {
  background: #54d88c;
}

/* ── Gate List ── */
.bib__gate-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.bib__gate-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 8px;
  border-radius: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background 0.12s;
}
.bib__gate-item:hover {
  background: rgba(255, 255, 255, 0.03);
}
.bib__gate-item--pass .bib__gate-label {
  color: #54d88c;
}
.bib__gate-item--fail .bib__gate-label {
  color: #ff6b6b;
}
.bib__gate-item--partial .bib__gate-label {
  color: #ffd463;
}
.bib__gate-label {
  font-size: 11px;
  color: var(--ls-text-secondary, #c3c9d4);
}
.bib__gate-detail {
  font-size: 9px;
  color: var(--ls-text-hint, #5d667a);
  margin-left: auto;
}
.bib__gate-icon--pass {
  color: #54d88c;
}
.bib__gate-icon--fail {
  color: #ff6b6b;
}
.bib__gate-icon--partial {
  color: #ffd463;
}
.bib__gate-icon--todo {
  color: var(--ls-text-hint, #5d667a);
}

/* ── Release Readiness Panel ── */
.bib__readiness {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  margin-top: 8px;
}
.bib__readiness--ready {
  background: rgba(84, 216, 140, 0.04);
  border-color: rgba(84, 216, 140, 0.12);
}
.bib__readiness--partial {
  background: rgba(255, 212, 99, 0.04);
  border-color: rgba(255, 212, 99, 0.12);
}
.bib__readiness--blocked {
  background: rgba(255, 107, 107, 0.04);
  border-color: rgba(255, 107, 107, 0.1);
}
.bib__readiness-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--ls-text-primary, #e9edf6);
  margin-bottom: 8px;
}
.bib__readiness-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}
.bib__readiness-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
}
.bib__readiness-row span:first-child {
  color: var(--ls-text-hint, #5d667a);
}

/* ── Text Color Helpers ── */
.bib__text-ok {
  color: #54d88c;
  font-weight: 500;
}
.bib__text-warn {
  color: #ffd463;
  font-weight: 500;
}
.bib__text-err {
  color: #ff6b6b;
  font-weight: 500;
}

/* ── P0 Blocker List ── */
.bib__blocker-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 8px;
}
.bib__blocker-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: var(--ls-text-secondary, #c3c9d4);
  padding: 3px 6px;
  border-radius: 4px;
  background: rgba(255, 107, 107, 0.06);
}

/* ── Readiness Actions ── */
.bib__readiness-actions {
  margin-bottom: 0;
}
.bib__release-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  padding: 7px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--ls-text-secondary, #c3c9d4);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s;
}
.bib__release-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}
.bib__release-btn--ready {
  border-color: rgba(84, 216, 140, 0.2);
  background: rgba(84, 216, 140, 0.08);
  color: #54d88c;
}
.bib__release-btn--ready:hover {
  background: rgba(84, 216, 140, 0.14);
}

/* ── Release Form ── */
.bib__release-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid rgba(90, 147, 255, 0.12);
  background: rgba(90, 147, 255, 0.03);
}
.bib__form-hint {
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  font-style: italic;
}

/* ── Card Actions (Bottom) ── */
.bib__card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  margin-top: 10px;
}

/* ── Generic Action Buttons ── */
.bib__action {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 5px;
  border: none;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.12s;
}
.bib__action:hover {
  opacity: 0.8;
}
.bib__action:disabled {
  opacity: 0.4;
  cursor: default;
}
.bib__action--building {
  background: rgba(255, 212, 99, 0.1);
  color: #ffd463;
}
.bib__action--success {
  background: rgba(84, 216, 140, 0.1);
  color: #54d88c;
}
.bib__action--failed {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
}
.bib__action--pending {
  background: rgba(142, 150, 166, 0.1);
  color: #8e96a6;
}
.bib__action--rollback {
  background: rgba(255, 212, 99, 0.08);
  color: #ffd463;
}
.bib__action--del {
  background: rgba(255, 255, 255, 0.04);
  color: var(--ls-text-hint, #5d667a);
}
.bib__action--del:hover {
  color: #ff6b6b;
}

/* ── Spin Animation ── */
.bib__spin {
  animation: bib-spin 1s linear infinite;
}
@keyframes bib-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── Empty State ── */
.bib__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}
.bib__empty-icon {
  color: var(--ls-text-hint, #5d667a);
  margin-bottom: 12px;
  opacity: 0.5;
}
.bib__empty-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ls-text-secondary, #c3c9d4);
  margin: 0 0 6px;
}
.bib__empty-desc {
  font-size: 11px;
  color: var(--ls-text-hint, #5d667a);
  margin: 0;
  max-width: 260px;
  line-height: 1.5;
}

/* ── Transitions ── */
.bib-fade-enter-active,
.bib-fade-leave-active {
  transition: opacity 0.25s ease;
}
.bib-fade-enter-from,
.bib-fade-leave-to {
  opacity: 0;
}
.bib-slide-enter-active,
.bib-slide-leave-active {
  transition: all 0.2s ease;
}
.bib-slide-enter-from,
.bib-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.bib-expand-enter-active,
.bib-expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.bib-expand-enter-from,
.bib-expand-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
