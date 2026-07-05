<script setup lang="ts">
import type { ReviewFileDiff } from '@/features/review/types'
import ReviewFileItem from './ReviewFileItem.vue'

defineProps<{
  files: ReviewFileDiff[]
  selectedFileId: string | null
  threadId: string
}>()

const emit = defineEmits<{
  (e: 'select', fileId: string): void
  (e: 'stage', fileId: string): void
  (e: 'revert', fileId: string): void
  (e: 'comment', fileId: string): void
}>()
</script>

<template>
  <div class="file-list">
    <div class="file-list__header">
      <span class="file-list__header-label">变更文件</span>
    </div>
    <ReviewFileItem
      v-for="file in files"
      :key="file.id"
      :file="file"
      :is-selected="file.id === selectedFileId"
      @select="emit('select', file.id)"
      @stage="emit('stage', file.id)"
      @revert="emit('revert', file.id)"
      @comment="emit('comment', file.id)"
    />
  </div>
</template>

<style scoped>
.file-list {
  padding: 4px 0;
}
.file-list__header {
  padding: 4px 8px 8px;
}
.file-list__header-label {
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}
</style>
