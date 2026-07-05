<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  disabled?: boolean
  tooltip?: string
  active?: boolean
}>(), {
  variant: 'ghost',
  size: 'md',
  disabled: false,
  active: false,
})

const emit = defineEmits<{ click: [e: MouseEvent] }>()

const cls = computed(() => [
  'ui-icon-btn',
  'ui-icon-btn--' + props.variant,
  'ui-icon-btn--' + props.size,
  props.active ? 'ui-icon-btn--active' : '',
])
</script>

<template>
  <button :class="cls" :disabled="disabled" :title="tooltip" @click="emit('click', $event)">
    <slot />
  </button>
</template>

<style scoped>
.ui-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid transparent; border-radius: var(--ls-radius-sm);
  cursor: pointer; flex-shrink: 0;
  transition: background-color var(--ls-duration-fast) var(--ls-ease-standard),
              color var(--ls-duration-fast) var(--ls-ease-standard),
              border-color var(--ls-duration-fast) var(--ls-ease-standard);
}
.ui-icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.ui-icon-btn--sm { width: 28px; height: 28px; }
.ui-icon-btn--md { width: 32px; height: 32px; }

.ui-icon-btn--ghost { color: var(--ls-text-muted); }
.ui-icon-btn--ghost:hover:not(:disabled) { background: var(--ls-bg-panel-hover); color: var(--ls-text-primary); }
.ui-icon-btn--ghost:active:not(:disabled) { background: var(--ls-bg-panel); }

.ui-icon-btn--secondary { color: var(--ls-text-secondary); border-color: var(--ls-border-default); background: var(--ls-bg-surface); }
.ui-icon-btn--secondary:hover:not(:disabled) { background: var(--ls-bg-panel-hover); border-color: var(--ls-border-strong); }
.ui-icon-btn--secondary:active:not(:disabled) { background: var(--ls-bg-panel); }

.ui-icon-btn--primary { background: var(--ls-accent); color: var(--ls-text-on-accent); }
.ui-icon-btn--primary:hover:not(:disabled) { background: var(--ls-accent-hover); }
.ui-icon-btn--primary:active:not(:disabled) { background: var(--ls-accent-active); }

.ui-icon-btn--danger { color: var(--ls-danger); }
.ui-icon-btn--danger:hover:not(:disabled) { background: var(--ls-danger-soft); }
.ui-icon-btn--active { color: var(--ls-accent); background: var(--ls-accent-soft); }
</style>
