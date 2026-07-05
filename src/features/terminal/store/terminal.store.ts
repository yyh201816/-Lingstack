import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TerminalEntry } from '../types'

const STORAGE_KEY = 'lingstack_terminal_sessions'

function loadEntries(): Record<string, TerminalEntry[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveEntries(data: Record<string, TerminalEntry[]>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function generateId(): string {
  return 'term_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}

export const useTerminalStore = defineStore('terminal', () => {
  // --- state ---
  const isOpen = ref(false)
  const entriesByThread = ref<Record<string, TerminalEntry[]>>(loadEntries())
  const currentCwdByThread = ref<Record<string, string>>({})
  const runningEntryIdByThread = ref<Record<string, string | null>>({})

  // --- getters ---
  function getEntries(threadId: string): TerminalEntry[] {
    return entriesByThread.value[threadId] ?? []
  }

  function getRunningEntry(threadId: string): TerminalEntry | null {
    const id = runningEntryIdByThread.value[threadId]
    if (!id) return null
    return getEntries(threadId).find((e) => e.id === id) ?? null
  }

  function getCurrentCwd(threadId: string): string {
    return currentCwdByThread.value[threadId] ?? 'G:\\'
  }

  // --- actions ---
  function toggle() { isOpen.value = !isOpen.value }
  function open() { isOpen.value = true }
  function close() { isOpen.value = false }

  function setCurrentCwd(threadId: string, cwd: string) {
    currentCwdByThread.value[threadId] = cwd
  }

  function createEntry(
    threadId: string,
    command: string,
    cwd: string,
    source: TerminalEntry['source'] = 'user',
  ): TerminalEntry {
    if (!entriesByThread.value[threadId]) {
      entriesByThread.value[threadId] = []
    }
    const entry: TerminalEntry = {
      id: generateId(),
      threadId,
      command,
      cwd,
      startedAt: new Date().toISOString(),
      status: 'running',
      output: '',
      source,
    }
    entriesByThread.value[threadId].push(entry)
    runningEntryIdByThread.value[threadId] = entry.id
    persist()
    return entry
  }

  function appendOutput(threadId: string, entryId: string, output: string) {
    const entries = entriesByThread.value[threadId]
    if (!entries) return
    const entry = entries.find((e) => e.id === entryId)
    if (entry) {
      entry.output += output
    }
  }

  function finishEntry(threadId: string, entryId: string, exitCode: number) {
    const entries = entriesByThread.value[threadId]
    if (!entries) return
    const entry = entries.find((e) => e.id === entryId)
    if (entry) {
      entry.finishedAt = new Date().toISOString()
      entry.exitCode = exitCode
      entry.status = exitCode === 0 ? 'done' : 'failed'
      runningEntryIdByThread.value[threadId] = null
      persist()
    }
  }

  function killEntry(threadId: string, entryId: string) {
    const entries = entriesByThread.value[threadId]
    if (!entries) return
    const entry = entries.find((e) => e.id === entryId)
    if (entry) {
      entry.status = 'killed'
      entry.finishedAt = new Date().toISOString()
      runningEntryIdByThread.value[threadId] = null
      persist()
    }
  }

  function clearThreadTerminal(threadId: string) {
    delete entriesByThread.value[threadId]
    persist()
  }

  function hydrate() {
    entriesByThread.value = loadEntries()
  }

  function persist() {
    saveEntries(entriesByThread.value)
  }

  return {
    // state
    isOpen,
    entriesByThread,
    currentCwdByThread,
    runningEntryIdByThread,
    // getters
    getEntries,
    getRunningEntry,
    getCurrentCwd,
    // actions
    toggle,
    open,
    close,
    setCurrentCwd,
    createEntry,
    appendOutput,
    finishEntry,
    killEntry,
    clearThreadTerminal,
    hydrate,
    persist,
  }
})
