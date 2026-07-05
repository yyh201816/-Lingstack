<script setup lang="ts">
interface Props { padding?: "sm" | "md" | "none"; hover?: boolean }
withDefaults(defineProps<Props>(), { padding: "md", hover: false })
</script>

<template>
  <div :class="['ls-card', `ls-card--${padding}`, { 'ls-card--hover': hover }]">
    <slot />
  </div>
</template>

<style scoped>
.ls-card {
  background: var(--ls-bg-surface);
  border: 1px solid var(--ls-border-default);
  border-radius: var(--ls-radius-2xl);
  box-shadow: var(--ls-shadow-xs);
}
.ls-card--sm { padding: 14px; }
.ls-card--md { padding: 20px; }
.ls-card--none { padding: 0; }
.ls-card--hover { transition: border-color 180ms ease, box-shadow 180ms ease; }
.ls-card--hover:hover { border-color: var(--ls-brand-200); box-shadow: var(--ls-shadow-sm); }
</style>
