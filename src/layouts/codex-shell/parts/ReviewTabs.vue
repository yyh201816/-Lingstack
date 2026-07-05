<script setup lang="ts">
import type { ReviewTab } from '@/features/review/types'

defineProps<{ activeTab: ReviewTab }>()
defineEmits<{ (e: 'select', tab: ReviewTab): void }>()

const tabs: { id: ReviewTab; label: string }[] = [
  { id: 'review', label: '审查' },
  { id: 'terminal', label: '终端' },
  { id: 'git', label: 'Git' },
]
</script>

<template>
  <div class="review-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="review-tabs__tab"
      :class="{ 'review-tabs__tab--active': activeTab === tab.id }"
      @click="$emit('select', tab.id)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.review-tabs {
  display: flex;
  gap: 0;
  overflow-x: auto;
}
.review-tabs__tab {
  padding: 8px 12px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--ls-text-hint, #5d667a);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: color 140ms ease, border-color 140ms ease;
}
.review-tabs__tab:hover { color: var(--ls-text-secondary, #c3c9d4); }
.review-tabs__tab--active {
  color: var(--ls-text-primary, #e9edf6);
  border-bottom-color: var(--ls-accent, #5a93ff);
}
</style>
