<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="empty-state">
    <div class="empty-state__icon">◌</div>
    <h3 class="empty-state__title">{{ title }}</h3>
    <p v-if="description" class="empty-state__desc">{{ description }}</p>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  text-align: center;
}

.empty-state__icon {
  margin-bottom: 12px;
  font-size: 24px;
  color: var(--ls-text-hint, #5d667a);
  opacity: 0.3;
}

.empty-state__title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ls-text-secondary, #c3c9d4);
}

.empty-state__desc {
  margin: 0;
  max-width: 280px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ls-text-hint, #5d667a);
}
</style>
