<script setup lang="ts">
import { ref, computed } from 'vue'
import TerminalToolbar from './TerminalToolbar.vue'
import TerminalEntryItem from './TerminalEntryItem.vue'
import TerminalEmptyState from './TerminalEmptyState.vue'
import { useTerminalStore } from '@/features/terminal/store/terminal.store'
import { useThreadStore } from '@/features/threads/store/thread.store'
import { useThreadSessionStore } from '@/features/threads/store/thread-session.store'
import { runCommand, stopCommand, setTerminalCallback } from '@/features/terminal/services/terminal-runtime.service'
import type { TerminalEntry } from '@/features/terminal/types'

const termStore = useTerminalStore()
const threadStore = useThreadStore()
const sessionStore = useThreadSessionStore()

const threadId = computed(() => threadStore.activeThreadId ?? '')
const entries = computed(() => threadId.value ? termStore.getEntries(threadId.value) : [])
const hasEntries = computed(() => entries.value.length > 0)
const cwd = computed(() => threadId.value ? termStore.getCurrentCwd(threadId.value) : 'G:\\')
const runningEntry = computed(() => threadId.value ? termStore.getRunningEntry(threadId.value) : null)

const inputCommand = ref('')

// Set terminal callback: when an entry completes, write back to thread
setTerminalCallback((entry: TerminalEntry) => {
  const tid = entry.threadId
  const statusText = entry.status === 'done' ? 'completed' : entry.status === 'failed' ? 'failed (exit ' + entry.exitCode + ')' : 'killed'
  const summary = `[Terminal] \`${entry.command}\` ${statusText}`
  sessionStore.appendMessage(tid, 'command', summary, 'system', {
    entryId: entry.id,
    command: entry.command,
    exitCode: entry.exitCode,
  })
})

function handleRun() {
  const cmd = inputCommand.value.trim()
  if (!cmd || !threadId.value) return
  runCommand(threadId.value, cmd, cwd.value, 'user')
  inputCommand.value = ''
}

function handleStop() {
  const running = runningEntry.value
  if (!running || !threadId.value) return
  stopCommand(threadId.value, running.id)
}

function handleClear() {
  if (threadId.value) {
    termStore.clearThreadTerminal(threadId.value)
  }
}

function handleCwdChange(newCwd: string) {
  if (threadId.value) {
    termStore.setCurrentCwd(threadId.value, newCwd)
  }
}
</script>

<template>
  <div class="terminal-pane">
    <TerminalToolbar
      v-if="hasEntries"
      :cwd="cwd"
      :is-running="!!runningEntry"
      @run="handleRun"
      @stop="handleStop"
      @clear="handleClear"
      @update:cwd="handleCwdChange"
    />
    <div v-if="hasEntries" class="terminal-pane__entries">
      <TerminalEntryItem
        v-for="entry in entries"
        :key="entry.id"
        :entry="entry"
      />
    </div>
    <TerminalEmptyState v-else />

    <!-- Command input -->
    <div class="terminal-pane__input-row">
      <span class="terminal-pane__input-prefix">$</span>
      <input
        v-model="inputCommand"
        class="terminal-pane__input"
        placeholder="Enter command..."
        :disabled="!!runningEntry"
        @keydown.enter="handleRun"
      />
      <button
        v-if="!runningEntry"
        class="terminal-pane__run-btn"
        :disabled="!inputCommand.trim()"
        @click="handleRun"
      >运行</button>
      <button
        v-else
        class="terminal-pane__stop-btn"
        @click="handleStop"
      >停止</button>
    </div>
  </div>
</template>

<style scoped>
.terminal-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.terminal-pane__entries {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 4px 8px;
}
.terminal-pane__input-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}
.terminal-pane__input-prefix {
  font-size: 12px;
  font-family: monospace;
  color: var(--ls-accent, #5a93ff);
  font-weight: 600;
  flex-shrink: 0;
}
.terminal-pane__input {
  flex: 1;
  min-width: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.2);
  color: var(--ls-text-primary, #e9edf6);
  font-size: 12px;
  font-family: monospace;
  padding: 4px 8px;
  outline: none;
}
.terminal-pane__input:focus { border-color: var(--ls-accent, #5a93ff); }
.terminal-pane__input::placeholder { color: var(--ls-text-hint, #5d667a); }
.terminal-pane__run-btn, .terminal-pane__stop-btn {
  padding: 3px 10px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 120ms ease;
}
.terminal-pane__run-btn {
  background: rgba(90, 147, 255, 0.15);
  color: var(--ls-accent, #5a93ff);
}
.terminal-pane__run-btn:hover:not(:disabled) { background: rgba(90, 147, 255, 0.25); }
.terminal-pane__run-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.terminal-pane__stop-btn {
  background: rgba(255, 107, 107, 0.15);
  color: #ff6b6b;
}
.terminal-pane__stop-btn:hover { background: rgba(255, 107, 107, 0.25); }
</style>
