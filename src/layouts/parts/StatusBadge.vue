<template>
  <span :class="['sb', `sb--${variant}`]">
    <span v-if="variant !== 'idle'" class="sb__dot" />
    <slot />
  </span>
</template>

<script setup lang="ts">
defineProps<{ variant?: 'online' | 'ready' | 'offline' | 'idle' | 'warning' }>()
</script>

<style scoped>
.sb {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 2px 8px; border-radius: 4px;
  font-size: 10px; font-weight: 500;
  line-height: 1.5; white-space: nowrap; user-select: none;
}
.sb--online  { color: var(--ls-success); background: var(--ls-success-soft); }
.sb--ready   { color: var(--ls-accent); background: var(--ls-accent-soft); }
.sb--offline { color: var(--ls-text-muted); background: var(--ls-bg-muted); }
.sb--idle    { color: var(--ls-text-muted); background: var(--ls-bg-panel); }
.sb--warning { color: var(--ls-warning); background: var(--ls-warning-soft); }
.sb__dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
</style>
