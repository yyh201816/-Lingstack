<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>

<template>
  <div class="review-empty">
    <span class="review-empty__icon">&#x1F4CB;</span>
    <p class="review-empty__title">{{ title || 'No changes to review' }}</p>
    <p class="review-empty__desc">{{ description || 'Run code modification tasks on the current thread and diffs will appear here.' }}</p>
  </div>
</template>

<style scoped>
.review-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px 20px;
  text-align: center;
}
.review-empty__icon { font-size: 28px; margin-bottom: 12px; opacity: 0.4; }
.review-empty__title { font-size: 13px; font-weight: 600; color: var(--ls-text-secondary, #c3c9d4); margin: 0 0 6px; }
.review-empty__desc { font-size: 11px; color: var(--ls-text-hint, #5d667a); margin: 0; max-width: 240px; line-height: 1.5; }
</style>
