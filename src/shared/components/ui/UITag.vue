<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent'
  size?: 'sm' | 'md'
  removable?: boolean
}>(), {
  variant: 'default',
  size: 'sm',
  removable: false,
})

const emit = defineEmits<{ remove: [] }>()

const cls = computed(() => ['ui-tag', 'ui-tag--' + props.variant, 'ui-tag--' + props.size])
</script>

<template>
  <span :class="cls">
    <slot />
    <button v-if="removable" class="ui-tag__remove" @click.stop="emit('remove')">&times;</button>
  </span>
</template>

<style scoped>
.ui-tag {
  display: inline-flex; align-items: center; gap: 4px;
  font-family: var(--ls-font-sans); font-weight: var(--ls-font-weight-medium);
  border-radius: var(--ls-radius-xs); white-space: nowrap;
}
.ui-tag--sm { height: 20px; padding: 0 6px; font-size: 10px; }
.ui-tag--md { height: 24px; padding: 0 8px; font-size: 11px; }

.ui-tag--default { background: var(--ls-bg-muted); color: var(--ls-text-muted); }
.ui-tag--accent  { background: var(--ls-accent-soft); color: var(--ls-accent); }
.ui-tag--success { background: var(--ls-success-soft); color: var(--ls-success); }
.ui-tag--warning { background: var(--ls-warning-soft); color: var(--ls-warning); }
.ui-tag--danger  { background: var(--ls-danger-soft); color: var(--ls-danger); }
.ui-tag--info    { background: var(--ls-info-soft); color: var(--ls-info); }

.ui-tag__remove { display: inline-flex; align-items: center; justify-content: center; width: 12px; height: 12px; border-radius: 50%; font-size: 10px; line-height: 1; opacity: 0.5; transition: opacity 0.12s; }
.ui-tag__remove:hover { opacity: 1; }
</style>
