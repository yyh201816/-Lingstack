<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  block?: boolean
}>(), {
  variant: 'secondary',
  size: 'md',
  disabled: false,
  loading: false,
  block: false,
})

const emit = defineEmits<{ click: [e: MouseEvent] }>()

const cls = computed(() => [
  'ui-btn',
  'ui-btn--' + props.variant,
  'ui-btn--' + props.size,
  props.block ? 'ui-btn--block' : '',
])
</script>

<template>
  <button :class="cls" :disabled="disabled || loading" @click="emit('click', $event)">
    <Loader2 v-if="loading" :size="14" class="ui-btn__spinner" />
    <slot />
  </button>
</template>

<style scoped>
.ui-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: var(--ls-font-sans); font-weight: var(--ls-font-weight-medium);
  border: 1px solid transparent; border-radius: var(--ls-radius-sm);
  cursor: pointer; white-space: nowrap; user-select: none;
  transition: background-color var(--ls-duration-fast) var(--ls-ease-standard),
              color var(--ls-duration-fast) var(--ls-ease-standard),
              border-color var(--ls-duration-fast) var(--ls-ease-standard),
              box-shadow var(--ls-duration-fast) var(--ls-ease-standard);
}
.ui-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.ui-btn__spinner { animation: ui-spin 0.8s linear infinite; }
@keyframes ui-spin { to { transform: rotate(360deg); } }

/* sizes */
.ui-btn--sm { height: 28px; padding: 0 10px; font-size: 11px; border-radius: var(--ls-radius-xs); }
.ui-btn--md { height: 32px; padding: 0 14px; font-size: var(--ls-text-xs); }
.ui-btn--lg { height: 38px; padding: 0 18px; font-size: var(--ls-text-sm); }

/* primary */
.ui-btn--primary { background: var(--ls-accent); color: var(--ls-text-on-accent); border-color: var(--ls-accent); }
.ui-btn--primary:hover:not(:disabled) { background: var(--ls-accent-hover); border-color: var(--ls-accent-hover); }
.ui-btn--primary:active:not(:disabled) { background: var(--ls-accent-active); border-color: var(--ls-accent-active); }

/* secondary */
.ui-btn--secondary { background: var(--ls-bg-surface); color: var(--ls-text-secondary); border-color: var(--ls-border-default); }
.ui-btn--secondary:hover:not(:disabled) { background: var(--ls-bg-panel-hover); color: var(--ls-text-primary); border-color: var(--ls-border-strong); }
.ui-btn--secondary:active:not(:disabled) { background: var(--ls-bg-panel); }

/* ghost */
.ui-btn--ghost { background: transparent; color: var(--ls-text-muted); }
.ui-btn--ghost:hover:not(:disabled) { background: var(--ls-bg-panel-hover); color: var(--ls-text-primary); }
.ui-btn--ghost:active:not(:disabled) { background: var(--ls-bg-panel); }

/* danger */
.ui-btn--danger { background: var(--ls-danger-soft); color: var(--ls-danger); border-color: transparent; }
.ui-btn--danger:hover:not(:disabled) { background: var(--ls-danger); color: white; }
.ui-btn--danger:active:not(:disabled) { background: #dc2626; }

.ui-btn--block { width: 100%; }
</style>
