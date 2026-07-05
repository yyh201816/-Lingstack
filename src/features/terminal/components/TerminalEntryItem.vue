<script setup lang="ts">
import type { TerminalEntry } from '@/features/terminal/types'

defineProps<{
  entry: TerminalEntry
}>()

const statusIcons: Record<string, string> = {
  running: '\u25B6',
  done: '\u2713',
  failed: '\u2717',
  killed: '\u25A0',
}
</script>

<template>
  <div
    class="term-entry"
    :class="`term-entry--${entry.status}`"
  >
    <div class="term-entry__header">
      <span class="term-entry__status" :class="`term-entry__status--${entry.status}`">
        {{ statusIcons[entry.status] }}
      </span>
      <code class="term-entry__command">$ {{ entry.command }}</code>
      <span class="term-entry__time">{{ new Date(entry.startedAt).toLocaleTimeString() }}</span>
    </div>
    <pre v-if="entry.output" class="term-entry__output">{{ entry.output }}</pre>
    <div v-if="entry.status === 'running'" class="term-entry__running-indicator">
      <span class="term-entry__spinner"></span> Running...
    </div>
    <div v-if="entry.exitCode !== undefined" class="term-entry__exit">
      Exit code: {{ entry.exitCode }}
      <span v-if="entry.source !== 'user'" class="term-entry__source">({{ entry.source }})</span>
    </div>
  </div>
</template>

<style scoped>
.term-entry {
  margin-bottom: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  overflow: hidden;
}
.term-entry--running { border-color: rgba(90, 147, 255, 0.2); }
.term-entry--done { border-color: rgba(84, 216, 140, 0.15); }
.term-entry--failed { border-color: rgba(255, 107, 107, 0.2); }
.term-entry--killed { border-color: rgba(255, 212, 99, 0.15); }
.term-entry__header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.02);
}
.term-entry__status { font-size: 10px; width: 16px; text-align: center; flex-shrink: 0; }
.term-entry__status--running { color: var(--ls-accent, #5a93ff); }
.term-entry__status--done { color: rgba(84, 216, 140, 0.9); }
.term-entry__status--failed { color: #ff6b6b; }
.term-entry__status--killed { color: #ffd463; }
.term-entry__command {
  flex: 1;
  font-size: 11px;
  color: var(--ls-accent, #5a93ff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.term-entry__time {
  font-size: 9px;
  color: var(--ls-text-hint, #5d667a);
  flex-shrink: 0;
}
.term-entry__output {
  padding: 6px 8px 4px;
  margin: 0;
  font-size: 11px;
  color: var(--ls-text-secondary, #c3c9d4);
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}
.term-entry__running-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  font-size: 10px;
  color: var(--ls-accent, #5a93ff);
}
.term-entry__spinner {
  width: 10px;
  height: 10px;
  border: 2px solid rgba(90, 147, 255, 0.2);
  border-top-color: var(--ls-accent, #5a93ff);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.term-entry__exit {
  padding: 2px 8px 4px;
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
}
.term-entry__source {
  font-size: 9px;
  opacity: 0.6;
}
</style>
