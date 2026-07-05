<script setup lang="ts">
interface Props {
  size?: "sm" | "md"
  variant?: "primary" | "outline" | "ghost" | "danger"
  disabled?: boolean
  loading?: boolean
}
withDefaults(defineProps<Props>(), { size: "md", variant: "primary", disabled: false, loading: false })
defineEmits<{ click: [] }>()
</script>

<template>
  <button
    :class="['ls-btn', `ls-btn--${size}`, `ls-btn--${variant}`]"
    :disabled="disabled || loading"
    @click="$emit('click')"
  >
    <span v-if="loading" class="ls-btn__spinner" />
    <slot />
  </button>
</template>

<style scoped>
.ls-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border: none; border-radius: var(--ls-radius-lg);
  font-family: var(--ls-font-sans); font-weight: var(--ls-font-weight-semibold);
  cursor: pointer; transition: all 140ms ease; user-select: none;
  white-space: nowrap; line-height: 1;
}
.ls-btn--sm { padding: 8px 16px; font-size: 13px; }
.ls-btn--md { padding: 10px 20px; font-size: 14px; }

.ls-btn--primary {
  background: var(--ls-brand-500); color: #fff;
  box-shadow: var(--ls-shadow-theme-xs);
}
.ls-btn--primary:hover:not(:disabled) { background: var(--ls-brand-600); }
.ls-btn--primary:active:not(:disabled) { background: var(--ls-brand-700); }

.ls-btn--outline {
  background: #fff; color: var(--ls-text-secondary);
  border: 1px solid var(--ls-border-default);
}
.ls-btn--outline:hover:not(:disabled) { background: var(--ls-bg-soft); border-color: var(--ls-brand-300); }

.ls-btn--ghost {
  background: transparent; color: var(--ls-text-muted);
}
.ls-btn--ghost:hover:not(:disabled) { background: var(--ls-bg-muted); color: var(--ls-text-primary); }

.ls-btn--danger {
  background: var(--ls-danger-500); color: #fff;
}
.ls-btn--danger:hover:not(:disabled) { background: var(--ls-danger-600); }

.ls-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.ls-btn__spinner {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%; animation: ls-spin 0.6s linear infinite;
}
@keyframes ls-spin { to { transform: rotate(360deg); } }
</style>
