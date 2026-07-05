<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
  borderless?: boolean
}>()
</script>

<template>
  <div :class="['ui-card', { 'ui-card--borderless': borderless }]">
    <div v-if="title || $slots.header" class="ui-card__header">
      <div>
        <h3 v-if="title" class="ui-card__title">{{ title }}</h3>
        <p v-if="subtitle" class="ui-card__subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.header" class="ui-card__header-actions">
        <slot name="header" />
      </div>
    </div>
    <div class="ui-card__body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.ui-card {
  background: var(--ls-bg-surface);
  border: 1px solid var(--ls-border-soft);
  border-radius: var(--ls-radius-lg);
  overflow: hidden;
}
.ui-card--borderless { border: none; background: transparent; }

.ui-card__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--ls-space-4); padding-bottom: 0;
}
.ui-card__title { font-size: var(--ls-text-sm); font-weight: var(--ls-font-weight-semibold); color: var(--ls-text-primary); }
.ui-card__subtitle { font-size: var(--ls-text-xs); color: var(--ls-text-muted); margin-top: 2px; }
.ui-card__header-actions { display: flex; align-items: center; gap: var(--ls-space-2); }
.ui-card__body { padding: var(--ls-space-4); }
</style>
