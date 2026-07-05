<script setup lang="ts">
interface Props { icon?: any; title: string; description?: string }
withDefaults(defineProps<Props>(), { description: "" })
</script>

<template>
  <div class="ls-empty">
    <component v-if="icon" :is="icon" :size="36" class="ls-empty__icon" />
    <h3 class="ls-empty__title">{{ title }}</h3>
    <p v-if="description" class="ls-empty__desc">{{ description }}</p>
    <slot name="actions" />
  </div>
</template>

<style scoped>
.ls-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 48px 24px; gap: 12px;
}
.ls-empty__icon { color: var(--ls-text-subtle); opacity: 0.4; }
.ls-empty__title { font-size: 16px; font-weight: var(--ls-font-weight-semibold); color: var(--ls-text-secondary); margin: 0; }
.ls-empty__desc { font-size: 13px; color: var(--ls-text-muted); line-height: 1.6; margin: 0; max-width: 320px; }
</style>
