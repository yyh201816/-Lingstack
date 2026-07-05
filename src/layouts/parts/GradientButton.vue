<template>
  <button :class="['gbtn', `gbtn--${variant}`]" :disabled="disabled"><slot /></button>
</template>

<script setup lang="ts">
defineProps<{ variant?: 'primary' | 'secondary' | 'ghost'; disabled?: boolean }>()
</script>

<style scoped>
.gbtn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 20px; border-radius: 10px;
  font-size: 12px; font-weight: 500;
  border: none; cursor: pointer;
  transition: all .18s var(--ls-ease-standard);
  outline: none;
}
.gbtn:disabled { opacity: .45; cursor: not-allowed; pointer-events: none; }

.gbtn--primary {
  background: linear-gradient(135deg, var(--ls-accent-hover), var(--ls-accent));
  color: #fff;
  box-shadow: 0 4px 14px rgba(37,99,235,.22);
}
.gbtn--primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(37,99,235,.3); }
.gbtn--primary:active:not(:disabled) { transform: translateY(0); box-shadow: 0 2px 8px rgba(37,99,235,.18); }

.gbtn--secondary {
  background: var(--ls-bg-elevated);
  border: 1px solid var(--ls-border-default);
  color: var(--ls-text-secondary);
  backdrop-filter: blur(10px);
}
.gbtn--secondary:hover:not(:disabled) { background: var(--ls-bg-surface); border-color: var(--ls-border-strong); }
.gbtn--secondary:active:not(:disabled) { background: var(--ls-bg-elevated); }

.gbtn--ghost { background: transparent; color: var(--ls-text-muted); }
.gbtn--ghost:hover:not(:disabled) { background: var(--ls-bg-panel-hover); color: var(--ls-text-secondary); }
.gbtn--ghost:active:not(:disabled) { background: var(--ls-accent-softer); }
</style>
