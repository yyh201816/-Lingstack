import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { GoalItem, GoalStatus } from '../types/goal.types'

const STORAGE_KEY = 'lingstack_goals'

function loadGoals(): GoalItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveGoals(goals: GoalItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
  } catch { /* ignore */ }
}

function generateId(): string {
  return 'goal_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}

export const useGoalStore = defineStore('goal', () => {
  // --- state ---
  const goals = ref<GoalItem[]>(loadGoals())

  // --- auto-persist ---
  watch(goals, (val) => saveGoals(val), { deep: true })

  // --- getters ---
  function goalsByThread(threadId: string): GoalItem[] {
    return goals.value.filter((g) => g.threadId === threadId)
  }

  function activeGoal(threadId: string): GoalItem | undefined {
    return goals.value.find((g) => g.threadId === threadId && g.status === 'active')
  }

  const allActiveGoals = computed(() =>
    goals.value.filter((g) => g.status === 'active'),
  )

  // --- helpers ---
  function touchGoal(goal: GoalItem, status?: GoalStatus) {
    if (status) goal.status = status
    goal.updatedAt = new Date().toISOString()
  }

  // --- actions ---
  function createGoal(threadId: string, title: string, objective: string): GoalItem {
    const now = new Date().toISOString()
    const goal: GoalItem = {
      id: generateId(),
      threadId,
      title,
      objective,
      status: 'active',
      progressPercent: 0,
      createdAt: now,
      updatedAt: now,
    }
    goals.value.push(goal)
    return goal
  }

  function updateGoalProgress(goalId: string, percent: number, summary?: string) {
    const goal = goals.value.find((g) => g.id === goalId)
    if (!goal) return
    goal.progressPercent = Math.max(0, Math.min(100, Math.round(percent)))
    if (summary !== undefined) goal.currentSummary = summary
    touchGoal(goal)
  }

  function pauseGoal(goalId: string) {
    const goal = goals.value.find((g) => g.id === goalId)
    if (!goal) return
    touchGoal(goal, 'paused')
  }

  function resumeGoal(goalId: string) {
    const goal = goals.value.find((g) => g.id === goalId)
    if (!goal) return
    touchGoal(goal, 'active')
  }

  function completeGoal(goalId: string) {
    const goal = goals.value.find((g) => g.id === goalId)
    if (!goal) return
    goal.progressPercent = 100
    touchGoal(goal, 'done')
  }

  function blockGoal(goalId: string, reason?: string) {
    const goal = goals.value.find((g) => g.id === goalId)
    if (!goal) return
    if (reason !== undefined) goal.currentSummary = reason
    touchGoal(goal, 'blocked')
  }

  function clearGoal(goalId: string) {
    const idx = goals.value.findIndex((g) => g.id === goalId)
    if (idx !== -1) goals.value.splice(idx, 1)
  }

  return {
    // state
    goals,
    // getters
    goalsByThread,
    activeGoal,
    allActiveGoals,
    // actions
    createGoal,
    updateGoalProgress,
    pauseGoal,
    resumeGoal,
    completeGoal,
    blockGoal,
    clearGoal,
  }
})
