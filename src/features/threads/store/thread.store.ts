import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { ThreadItem, ThreadMode, ThreadStatus, TaskType } from '../types'

const STORAGE_KEY = 'lingstack_threads'

function loadThreads(): ThreadItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Migration: ensure all threads have taskType (default 'chat' for legacy)
    return parsed.map((t: Record<string, unknown>) => ({
      ...t,
      taskType: t.taskType || 'chat',
    })) as unknown as ThreadItem[]
  } catch {
    return []
  }
}

function loadActiveThreadId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY + '_active') || null
  } catch {
    return null
  }
}

function saveActiveThreadId(id: string | null) {
  if (id) {
    localStorage.setItem(STORAGE_KEY + '_active', id)
  } else {
    localStorage.removeItem(STORAGE_KEY + '_active')
  }
}

function saveThreads(threads: ThreadItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(threads))
}

function generateId(): string {
  return 'thread_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}

export const useThreadStore = defineStore('thread', () => {
  // --- state ---
  const threads = ref<ThreadItem[]>(loadThreads())
  const activeThreadId = ref<string | null>(loadActiveThreadId())

  // Persist activeThreadId on change
  watch(activeThreadId, (newVal) => {
    saveActiveThreadId(newVal)
  })

  // --- getters ---
  const activeThread = computed<ThreadItem | null>(() =>
    threads.value.find((t) => t.id === activeThreadId.value) ?? null,
  )

  const pinnedThreads = computed(() =>
    threads.value.filter((t) => t.pinned && !t.archived),
  )

  const activeThreads = computed(() =>
    threads.value.filter((t) => !t.archived).sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }),
  )

  const threadsByProject = computed(() => {
    const map: Record<string, ThreadItem[]> = {}
    for (const t of threads.value) {
      const pid = t.projectId || '__none__'
      if (!map[pid]) map[pid] = []
      map[pid].push(t)
    }
    return map
  })

  // --- actions ---
  function setActiveThread(id: string | null) {
    activeThreadId.value = id
  }

  function createThread(
    title: string,
    projectId: string,
    mode: ThreadMode = 'local',
    taskType: TaskType = 'chat',
    taskOpts?: { goal?: string; targetScope?: string },
  ): ThreadItem {
    const now = new Date().toISOString()
    const thread: ThreadItem = {
      id: generateId(),
      title,
      projectId,
      mode,
      taskType,
      status: 'idle',
      pinned: false,
      archived: false,
      createdAt: now,
      updatedAt: now,
      ...(taskOpts?.goal ? { goal: taskOpts.goal } : {}),
      ...(taskOpts?.targetScope ? { targetScope: taskOpts.targetScope } : {}),
    }
    threads.value.unshift(thread)
    activeThreadId.value = thread.id
    persist()
    return thread
  }

  function renameThread(id: string, title: string) {
    const t = threads.value.find((th) => th.id === id)
    if (t) {
      t.title = title
      t.updatedAt = new Date().toISOString()
      persist()
    }
  }

  function pinThread(id: string) {
    const t = threads.value.find((th) => th.id === id)
    if (t) {
      t.pinned = !t.pinned
      t.updatedAt = new Date().toISOString()
      persist()
    }
  }

  function archiveThread(id: string) {
    const t = threads.value.find((th) => th.id === id)
    if (t) {
      t.archived = !t.archived
      t.updatedAt = new Date().toISOString()
      if (t.archived && activeThreadId.value === id) {
        const next = activeThreads.value.find((a) => a.id !== id)
        activeThreadId.value = next?.id ?? null
      }
      persist()
    }
  }

  function deleteThread(id: string) {
    threads.value = threads.value.filter((t) => t.id !== id)
    if (activeThreadId.value === id) {
      activeThreadId.value = threads.value[0]?.id ?? null
    }
    persist()
  }

  function updateThreadStatus(id: string, status: ThreadStatus) {
    const t = threads.value.find((th) => th.id === id)
    if (t) {
      t.status = status
      t.updatedAt = new Date().toISOString()
      persist()
    }
  }

  function setTaskResult(id: string, resultSummary: string) {
    const t = threads.value.find((th) => th.id === id)
    if (t) {
      t.resultSummary = resultSummary
      t.status = 'done'
      t.updatedAt = new Date().toISOString()
      persist()
    }
  }

  function updateTaskGoal(id: string, goal: string) {
    const t = threads.value.find((th) => th.id === id)
    if (t) {
      t.goal = goal
      t.updatedAt = new Date().toISOString()
      persist()
    }
  }

  function hydrate() {
    threads.value = loadThreads()
  }

  function persist() {
    saveThreads(threads.value)
  }

  return {
    // state
    threads,
    activeThreadId,
    // getters
    activeThread,
    pinnedThreads,
    activeThreads,
    threadsByProject,
    // actions
    setActiveThread,
    createThread,
    renameThread,
    pinThread,
    archiveThread,
    deleteThread,
    updateThreadStatus,
    setTaskResult,
    updateTaskGoal,
    hydrate,
    persist,
  }
})
