/**
 * R26 — 自修复任务 Store
 *
 * 管理 skill 执行结果 + 任务状态 + 验证记录。
 * 持久化到 localStorage `lingstack_self_heal`。
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  SelfHealExecutionResult,
  SelfHealTaskItem,
  ValidationRecord,
  TaskStatus,
  SelfHealState,
  ValidationMethod,
} from '../types/self-heal.types'
import { parseSkillOutput } from '../services/self-heal-parser.service'

const LS_KEY = 'lingstack_self_heal'
const MAX_EXECUTIONS = 10

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function loadState(): SelfHealState {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as SelfHealState
      if (Array.isArray(parsed.executions) && Array.isArray(parsed.tasks)) return parsed
    }
  } catch { /* ignore */ }
  return { executions: [], tasks: [], validations: [], activeExecutionId: null }
}

function saveState(state: SelfHealState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch { /* ignore */ }
}

export const useSelfHealStore = defineStore('self-heal', () => {
  const state = loadState()
  const executions = ref<SelfHealExecutionResult[]>(state.executions)
  const tasks = ref<SelfHealTaskItem[]>(state.tasks)
  const validations = ref<ValidationRecord[]>(state.validations)
  const activeExecutionId = ref<string | null>(state.activeExecutionId)

  // ========== Getters ==========

  const activeExecution = computed(() =>
    executions.value.find(e => e.id === activeExecutionId.value) ?? null,
  )

  const activeTasks = computed(() =>
    tasks.value.filter(t => t.executionId === activeExecutionId.value),
  )

  const tasksByStatus = computed(() => {
    const map: Record<TaskStatus, SelfHealTaskItem[]> = {
      todo: [], accepted: [], done: [], skipped: [], failed: [],
    }
    for (const t of activeTasks.value) {
      map[t.status].push(t)
    }
    return map
  })

  const taskStats = computed(() => {
    const list = activeTasks.value
    return {
      total: list.length,
      todo: list.filter(t => t.status === 'todo').length,
      accepted: list.filter(t => t.status === 'accepted').length,
      done: list.filter(t => t.status === 'done').length,
      skipped: list.filter(t => t.status === 'skipped').length,
      failed: list.filter(t => t.status === 'failed').length,
    }
  })

  const hasActiveExecution = computed(() => activeExecutionId.value !== null)
  const executionCount = computed(() => executions.value.length)

  // ========== Actions ==========

  function persist() {
    saveState({
      executions: executions.value,
      tasks: tasks.value,
      validations: validations.value,
      activeExecutionId: activeExecutionId.value,
    })
  }

  /** 处理 skill 执行结果：解析 → 创建执行记录 → 生成任务 */
  function processSkillResult(skillId: string, rawOutput: string): SelfHealExecutionResult {
    const id = generateId()
    const { parsed, tasks: parsedTasks } = parseSkillOutput(rawOutput, id)

    const execution: SelfHealExecutionResult = {
      id,
      skillId,
      rawOutput,
      parsed,
      taskIds: parsedTasks.map(t => t.id),
      createdAt: new Date().toISOString(),
    }

    const now = new Date().toISOString()
    const newTasks: SelfHealTaskItem[] = parsedTasks.map(t => ({
      ...t,
      executionId: id,
      createdAt: now,
      updatedAt: now,
    }))

    executions.value.push(execution)
    tasks.value.push(...newTasks)
    activeExecutionId.value = id

    // 裁剪旧记录
    if (executions.value.length > MAX_EXECUTIONS) {
      const removed = executions.value.splice(0, executions.value.length - MAX_EXECUTIONS)
      const removedIds = new Set(removed.map(e => e.id))
      tasks.value = tasks.value.filter(t => !removedIds.has(t.executionId))
      const removedTaskIds = new Set(removed.flatMap(e => e.taskIds))
      validations.value = validations.value.filter(v => !removedTaskIds.has(v.taskId))
    }

    persist()
    return execution
  }

  /** 更新任务状态 */
  function updateTaskStatus(taskId: string, status: TaskStatus, note?: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return
    task.status = status
    task.updatedAt = new Date().toISOString()
    if (note !== undefined) task.resultNote = note
    persist()
  }

  /** 添加验证记录 */
  function addValidation(
    taskId: string,
    method: ValidationMethod,
    passed: boolean,
    note?: string,
  ): ValidationRecord {
    const record: ValidationRecord = {
      id: generateId(),
      taskId,
      method,
      passed,
      note,
      createdAt: new Date().toISOString(),
    }
    validations.value.push(record)
    persist()
    return record
  }

  /** 获取任务的验证记录 */
  function getTaskValidations(taskId: string): ValidationRecord[] {
    return validations.value.filter(v => v.taskId === taskId)
  }

  /** 切换活跃执行 */
  function setActiveExecution(id: string) {
    activeExecutionId.value = id
    persist()
  }

  /** 清除所有数据 */
  function clearAll() {
    executions.value = []
    tasks.value = []
    validations.value = []
    activeExecutionId.value = null
    persist()
  }

  return {
    executions,
    tasks,
    validations,
    activeExecutionId,
    activeExecution,
    activeTasks,
    tasksByStatus,
    taskStats,
    hasActiveExecution,
    executionCount,
    processSkillResult,
    updateTaskStatus,
    addValidation,
    getTaskValidations,
    setActiveExecution,
    clearAll,
  }
})
