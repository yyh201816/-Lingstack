<script setup lang="ts">
const props = defineProps<{
  cwd: string
  isRunning: boolean
}>()

const emit = defineEmits<{
  (e: 'run'): void
  (e: 'stop'): void
  (e: 'clear'): void
  (e: 'update:cwd', value: string): void
}>()
</script>

<template>
  <div class="term-toolbar">
    <div class="term-toolbar__cwd">
      <span class="term-toolbar__cwd-label">cwd:</span>
      <input
        class="term-toolbar__cwd-input"
        :value="cwd"
        @input="emit('update:cwd', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <div class="term-toolbar__actions">
      <span v-if="isRunning" class="term-toolbar__running">Running...</span>
      <button
        v-if="!isRunning"
        class="term-toolbar__btn term-toolbar__btn--clear"
        @click="emit('clear')"
      >Clear</button>
    </div>
  </div>
</template>

<style scoped>
.term-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}
.term-toolbar__cwd {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.term-toolbar__cwd-label {
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  text-transform: uppercase;
  flex-shrink: 0;
}
.term-toolbar__cwd-input {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  font-family: monospace;
  color: var(--ls-text-primary, #e9edf6);
  background: transparent;
  border: none;
  outline: none;
}
.term-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.term-toolbar__running {
  font-size: 10px;
  color: var(--ls-accent, #5a93ff);
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.term-toolbar__btn {
  padding: 2px 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  background: transparent;
  color: var(--ls-text-hint, #5d667a);
  font-size: 10px;
  cursor: pointer;
  transition: all 120ms ease;
}
.term-toolbar__btn:hover { background: rgba(255, 255, 255, 0.04); color: var(--ls-text-secondary, #c3c9d4); }
</style>
