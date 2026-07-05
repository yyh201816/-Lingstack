<script setup lang="ts">
import { ref } from 'vue'
import { useSelfHealStore } from '../store/self-heal.store'
import type { SelfHealTaskItem, TaskStatus, ValidationMethod } from '../types/self-heal.types'
import {
  CheckCircle, Circle, SkipForward, XCircle, Clock,
  Play, ChevronDown, ChevronUp, FileText, Check, X, MessageSquare
} from 'lucide-vue-next'

const shStore = useSelfHealStore()

const expandedTaskId = ref<string | null>(null)
const validationNote = ref('')
const showValidationFor = ref<string | null>(null)
const historyExpanded = ref(false)

const statusConfig: Record<TaskStatus, { label: string; icon: any; color: string }> = {
  todo: { label: '待处理', icon: Circle, color: 'var(--ls-text-muted)' },
  accepted: { label: '已采纳', icon: Clock, color: 'var(--ls-accent)' },
  done: { label: '已完成', icon: CheckCircle, color: 'var(--ls-success, #22c55e)' },
  skipped: { label: '已跳过', icon: SkipForward, color: 'var(--ls-text-subtle)' },
  failed: { label: '失败', icon: XCircle, color: 'var(--ls-danger, #e0556a)' },
}

const priorityColors: Record<string, string> = {
  P0: 'var(--ls-danger, #e0556a)',
  P1: 'var(--ls-warning, #f59e0b)',
  P2: 'var(--ls-text-muted)',
}

function cycleStatus(task: SelfHealTaskItem) {
  const order: TaskStatus[] = ['todo', 'accepted', 'done', 'skipped', 'failed']
  const idx = order.indexOf(task.status)
  const next = order[(idx + 1) % order.length]
  shStore.updateTaskStatus(task.id, next)
}

function setStatus(taskId: string, status: TaskStatus) {
  shStore.updateTaskStatus(taskId, status)
}

function toggleExpand(taskId: string) {
  expandedTaskId.value = expandedTaskId.value === taskId ? null : taskId
}

function openValidation(taskId: string) {
  showValidationFor.value = taskId
  validationNote.value = ''
}

function submitValidation(taskId: string, passed: boolean) {
  shStore.addValidation(taskId, 'manual', passed, validationNote.value || undefined)
  showValidationFor.value = null
  validationNote.value = ''
}

function getTaskValidations(taskId: string) {
  return shStore.getTaskValidations(taskId)
}
</script>

<template>
  <div class="task-board">
    <div class="task-board__stats">
      <div class="task-board__stat">
        <span class="task-board__stat-num">{{ shStore.taskStats.total }}</span>
        <span class="task-board__stat-label">总计</span>
      </div>
      <div class="task-board__stat">
        <span class="task-board__stat-num">{{ shStore.taskStats.todo }}</span>
        <span class="task-board__stat-label">待处理</span>
      </div>
      <div class="task-board__stat">
        <span class="task-board__stat-num task-board__stat-num--accent">{{ shStore.taskStats.accepted }}</span>
        <span class="task-board__stat-label">已采纳</span>
      </div>
      <div class="task-board__stat">
        <span class="task-board__stat-num task-board__stat-num--success">{{ shStore.taskStats.done }}</span>
        <span class="task-board__stat-label">已完成</span>
      </div>
      <div class="task-board__stat">
        <span class="task-board__stat-num">{{ shStore.taskStats.skipped }}</span>
        <span class="task-board__stat-label">已跳过</span>
      </div>
    </div>

    <div v-if="shStore.activeExecution" class="task-board__summary">
      <div v-if="shStore.activeExecution.parsed.currentPhase" class="task-board__summary-item">
        <span class="task-board__summary-label">当前阶段</span>
        <span class="task-board__summary-val">{{ shStore.activeExecution.parsed.currentPhase }}</span>
      </div>
      <div v-if="shStore.activeExecution.parsed.chosenTarget" class="task-board__summary-item">
        <span class="task-board__summary-label">修复目标</span>
        <span class="task-board__summary-val">{{ shStore.activeExecution.parsed.chosenTarget }}</span>
      </div>
      <div v-if="shStore.activeExecution.parsed.nextStep" class="task-board__summary-item">
        <span class="task-board__summary-label">下一步</span>
        <span class="task-board__summary-val">{{ shStore.activeExecution.parsed.nextStep }}</span>
      </div>
    </div>

    <div class="task-board__list">
      <div
        v-for="task in shStore.activeTasks"
        :key="task.id"
        :class="['task-board__item', `task-board__item--${task.status}`]"
      >
        <div class="task-board__item-header" @click="toggleExpand(task.id)">
          <div class="task-board__item-left">
            <component
              :is="statusConfig[task.status].icon"
              :size="15"
              :style="{ color: statusConfig[task.status].color }"
              class="task-board__item-status-icon"
              :title="statusConfig[task.status].label"
              @click.stop="cycleStatus(task)"
            />
            <span
              class="task-board__item-priority"
              :style="{ color: priorityColors[task.priority] }"
            >{{ task.priority }}</span>
            <span class="task-board__item-type">{{ task.type }}</span>
            <span class="task-board__item-title">{{ task.title }}</span>
          </div>
          <div class="task-board__item-right">
            <span v-if="task.validationSteps?.length" class="task-board__item-vcount">
              {{ task.validationSteps.length }} 项验证
            </span>
            <component :is="expandedTaskId === task.id ? ChevronUp : ChevronDown" :size="13" />
          </div>
        </div>

        <div v-if="expandedTaskId === task.id" class="task-board__item-detail">
          <p v-if="task.description && task.description !== task.title" class="task-board__item-desc">
            {{ task.description }}
          </p>

          <div v-if="task.targetFiles?.length" class="task-board__item-files">
            <FileText :size="11" />
            <span v-for="f in task.targetFiles" :key="f" class="task-board__item-file">{{ f }}</span>
          </div>

          <div v-if="task.validationSteps?.length" class="task-board__item-validations">
            <span class="task-board__item-validations-label">验证步骤：</span>
            <div v-for="(step, i) in task.validationSteps" :key="i" class="task-board__item-step">
              <code>{{ step }}</code>
            </div>
          </div>

          <div v-if="getTaskValidations(task.id).length > 0" class="task-board__item-val-records">
            <span class="task-board__item-val-records-label">验证记录：</span>
            <div
              v-for="v in getTaskValidations(task.id)"
              :key="v.id"
              :class="['task-board__item-val-record', v.passed ? 'task-board__item-val-record--pass' : 'task-board__item-val-record--fail']"
            >
              <component :is="v.passed ? Check : X" :size="12" />
              <span>{{ v.passed ? '通过' : '失败' }}</span>
              <span v-if="v.note" class="task-board__item-val-note">{{ v.note }}</span>
              <span class="task-board__item-val-time">{{ new Date(v.createdAt).toLocaleTimeString() }}</span>
            </div>
          </div>

          <div v-if="task.resultNote" class="task-board__item-note">
            <MessageSquare :size="11" />
            <span>{{ task.resultNote }}</span>
          </div>

          <div class="task-board__item-actions">
            <button v-if="task.status === 'todo'" class="task-board__action-btn task-board__action-btn--accept" @click="setStatus(task.id, 'accepted')">
              <Play :size="11" /> 采纳
            </button>
            <button v-if="task.status === 'accepted'" class="task-board__action-btn task-board__action-btn--done" @click="setStatus(task.id, 'done')">
              <CheckCircle :size="11" /> 完成
            </button>
            <button class="task-board__action-btn" @click="setStatus(task.id, 'skipped')">
              <SkipForward :size="11" /> 跳过
            </button>
            <button class="task-board__action-btn task-board__action-btn--fail" @click="setStatus(task.id, 'failed')">
              <XCircle :size="11" /> 失败
            </button>
            <button class="task-board__action-btn" @click="openValidation(task.id)">
              <Check :size="11" /> 验证
            </button>
          </div>

          <div v-if="showValidationFor === task.id" class="task-board__val-input">
            <input v-model="validationNote" class="task-board__val-input-field" type="text" placeholder="验证备注（可选）" />
            <div class="task-board__val-input-actions">
              <button class="task-board__val-btn task-board__val-btn--pass" @click="submitValidation(task.id, true)">
                <Check :size="11" /> 通过
              </button>
              <button class="task-board__val-btn task-board__val-btn--fail" @click="submitValidation(task.id, false)">
                <X :size="11" /> 失败
              </button>
              <button class="task-board__val-btn" @click="showValidationFor = null">取消</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="shStore.executionCount > 1" class="task-board__history">
      <button class="task-board__history-toggle" @click="historyExpanded = !historyExpanded">
        <component :is="historyExpanded ? ChevronUp : ChevronDown" :size="12" />
        历史执行记录（{{ shStore.executionCount }} 次）
      </button>
      <div v-if="historyExpanded" class="task-board__history-list">
        <div
          v-for="exec in [...shStore.executions].reverse()"
          :key="exec.id"
          :class="['task-board__history-item', { 'task-board__history-item--active': exec.id === shStore.activeExecutionId }]"
          @click="shStore.setActiveExecution(exec.id)"
        >
          <span class="task-board__history-skill">{{ exec.skillId }}</span>
          <span class="task-board__history-time">{{ new Date(exec.createdAt).toLocaleString() }}</span>
          <span class="task-board__history-tasks">{{ exec.taskIds.length }} 项任务</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-board { display: flex; flex-direction: column; gap: 12px; padding: var(--ls-space-4); border: 1px solid var(--ls-border-subtle); border-radius: var(--ls-radius-lg); background: var(--ls-bg-surface); }
.task-board__stats { display: flex; gap: 0; padding: 8px; border-radius: var(--ls-radius-sm); background: var(--ls-bg-muted); }
.task-board__stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.task-board__stat-num { font-size: 16px; font-weight: 600; color: var(--ls-text-main); }
.task-board__stat-num--accent { color: var(--ls-accent); }
.task-board__stat-num--success { color: var(--ls-success, #22c55e); }
.task-board__stat-label { font-size: 10px; color: var(--ls-text-hint); }
.task-board__summary { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border-radius: var(--ls-radius-sm); background: var(--ls-bg-muted); font-size: var(--ls-font-caption); }
.task-board__summary-item { display: flex; gap: 8px; }
.task-board__summary-label { font-weight: 600; color: var(--ls-text-hint); white-space: nowrap; min-width: 60px; }
.task-board__summary-val { color: var(--ls-text-body); }
.task-board__list { display: flex; flex-direction: column; gap: 4px; }
.task-board__item { border: 1px solid var(--ls-border-subtle); border-radius: var(--ls-radius-sm); background: var(--ls-bg-surface); transition: all .12s; }
.task-board__item:hover { border-color: var(--ls-border-accent); }
.task-board__item--done { opacity: .65; }
.task-board__item--skipped { opacity: .5; }
.task-board__item--failed { border-color: rgba(239,68,68,0.2); }
.task-board__item-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; cursor: pointer; user-select: none; }
.task-board__item-left { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
.task-board__item-status-icon { flex-shrink: 0; cursor: pointer; }
.task-board__item-priority { font-size: 10px; font-weight: 700; font-family: var(--ls-font-mono, monospace); flex-shrink: 0; }
.task-board__item-type { font-size: 9px; padding: 1px 5px; border-radius: 3px; background: var(--ls-bg-muted); color: var(--ls-text-hint); text-transform: uppercase; flex-shrink: 0; }
.task-board__item-title { font-size: var(--ls-font-caption); font-weight: 500; color: var(--ls-text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.task-board__item-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.task-board__item-vcount { font-size: 10px; color: var(--ls-text-hint); }
.task-board__item-detail { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 10px; border-top: 1px solid var(--ls-border-subtle); padding-top: 10px; }
.task-board__item-desc { font-size: var(--ls-font-caption); color: var(--ls-text-body); line-height: 1.5; margin: 0; }
.task-board__item-files { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 10px; color: var(--ls-text-hint); }
.task-board__item-file { background: var(--ls-bg-muted); padding: 2px 6px; border-radius: 3px; font-family: var(--ls-font-mono, monospace); font-size: 10px; }
.task-board__item-validations { display: flex; flex-direction: column; gap: 4px; }
.task-board__item-validations-label { font-size: 10px; font-weight: 600; color: var(--ls-text-hint); }
.task-board__item-step code { font-size: 11px; padding: 3px 7px; border-radius: 4px; background: var(--ls-bg-muted); color: var(--ls-text-body); font-family: var(--ls-font-mono, monospace); }
.task-board__item-val-records { display: flex; flex-direction: column; gap: 4px; }
.task-board__item-val-records-label { font-size: 10px; font-weight: 600; color: var(--ls-text-hint); }
.task-board__item-val-record { display: flex; align-items: center; gap: 6px; font-size: 11px; padding: 4px 8px; border-radius: 4px; }
.task-board__item-val-record--pass { background: rgba(34,197,94,0.06); color: var(--ls-success, #22c55e); }
.task-board__item-val-record--fail { background: rgba(239,68,68,0.06); color: var(--ls-danger, #e0556a); }
.task-board__item-val-note { color: var(--ls-text-body); font-style: italic; }
.task-board__item-val-time { margin-left: auto; font-size: 10px; color: var(--ls-text-hint); }
.task-board__item-note { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--ls-text-body); font-style: italic; }
.task-board__item-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.task-board__action-btn { display: flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 4px; border: 1px solid var(--ls-border-subtle); background: var(--ls-bg-surface); font-size: 11px; font-weight: 500; color: var(--ls-text-body); cursor: pointer; transition: all .12s; }
.task-board__action-btn:hover { border-color: var(--ls-border-accent); color: var(--ls-accent); }
.task-board__action-btn--accept:hover { background: rgba(79,110,247,0.04); }
.task-board__action-btn--done { color: var(--ls-success, #22c55e); }
.task-board__action-btn--done:hover { border-color: var(--ls-success, #22c55e); background: rgba(34,197,94,0.04); }
.task-board__action-btn--fail:hover { border-color: var(--ls-danger, #e0556a); color: var(--ls-danger, #e0556a); background: rgba(239,68,68,0.04); }
.task-board__val-input { display: flex; flex-direction: column; gap: 8px; padding: 10px; border-radius: var(--ls-radius-sm); background: var(--ls-bg-muted); }
.task-board__val-input-field { height: 32px; padding: 0 10px; background: var(--ls-bg-surface); color: var(--ls-text-primary); border: 1px solid var(--ls-border-default); border-radius: 4px; font-size: 12px; outline: none; }
.task-board__val-input-field:focus { border-color: var(--ls-accent); }
.task-board__val-input-actions { display: flex; gap: 6px; }
.task-board__val-btn { display: flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 4px; border: 1px solid var(--ls-border-subtle); background: var(--ls-bg-surface); font-size: 11px; cursor: pointer; transition: all .12s; }
.task-board__val-btn:hover { border-color: var(--ls-border-accent); }
.task-board__val-btn--pass { color: var(--ls-success, #22c55e); }
.task-board__val-btn--fail { color: var(--ls-danger, #e0556a); }
.task-board__history { margin-top: 4px; }
.task-board__history-toggle { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--ls-text-hint); background: none; border: none; cursor: pointer; padding: 4px 0; }
.task-board__history-toggle:hover { color: var(--ls-text-body); }
.task-board__history-list { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
.task-board__history-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: var(--ls-radius-sm); border: 1px solid var(--ls-border-subtle); background: var(--ls-bg-surface); cursor: pointer; transition: all .12s; font-size: 11px; }
.task-board__history-item:hover { border-color: var(--ls-border-accent); }
.task-board__history-item--active { border-color: var(--ls-accent); background: rgba(79,110,247,0.03); }
.task-board__history-skill { font-weight: 600; color: var(--ls-text-main); }
.task-board__history-time { color: var(--ls-text-hint); }
.task-board__history-tasks { margin-left: auto; color: var(--ls-text-hint); }
</style>
