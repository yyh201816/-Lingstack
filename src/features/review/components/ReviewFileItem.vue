<script setup lang="ts">
import type { ReviewFileDiff } from '@/features/review/types'

defineProps<{
  file: ReviewFileDiff
  isSelected: boolean
}>()

const emit = defineEmits<{
  (e: 'select'): void
  (e: 'stage'): void
  (e: 'revert'): void
  (e: 'comment'): void
}>()

const statusLabels: Record<string, string> = {
  added: 'A',
  modified: 'M',
  deleted: 'D',
  renamed: 'R',
}
</script>

<template>
  <div
    class="file-item"
    :class="{
      'file-item--selected': isSelected,
      'file-item--staged': file.staged,
      'file-item--reverted': file.reverted,
    }"
    @click="emit('select')"
  >
    <div class="file-item__main">
      <span
        class="file-item__status"
        :class="`file-item__status--${file.status}`"
      >{{ statusLabels[file.status] || '?' }}</span>
      <div class="file-item__info">
        <div class="file-item__name">{{ file.fileName }}</div>
        <div class="file-item__path">{{ file.filePath }}</div>
      </div>
    </div>
    <div class="file-item__stats">
      <span class="file-item__add">+{{ file.additions }}</span>
      <span class="file-item__del">-{{ file.deletions }}</span>
    </div>
    <div class="file-item__actions" @click.stop>
      <button
        v-if="!file.staged && !file.reverted"
        class="file-item__action file-item__action--stage"
        title="Stage File"
        @click="emit('stage')"
      >&#x2713;</button>
      <button
        v-if="!file.reverted"
        class="file-item__action file-item__action--revert"
        title="Revert File"
        @click="emit('revert')"
      >&#x21A9;</button>
      <button
        class="file-item__action file-item__action--comment"
        title="Add Comment"
        @click="emit('comment')"
      >&#x1F4AC;</button>
    </div>
  </div>
</template>

<style scoped>
.file-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 5px 8px;
  cursor: pointer;
  transition: background 120ms ease;
  border-left: 2px solid transparent;
}
.file-item:hover { background: rgba(255, 255, 255, 0.03); }
.file-item--selected { background: rgba(90, 147, 255, 0.08); border-left-color: var(--ls-accent, #5a93ff); }
.file-item--staged { opacity: 0.65; }
.file-item--staged .file-item__status { opacity: 0.5; }
.file-item--reverted { opacity: 0.45; text-decoration: line-through; }
.file-item__main {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.file-item__status {
  font-size: 10px;
  font-weight: 700;
  width: 14px;
  text-align: center;
  flex-shrink: 0;
  margin-top: 1px;
}
.file-item__status--added { color: rgba(84, 216, 140, 0.85); }
.file-item__status--modified { color: #ffd463; }
.file-item__status--deleted { color: #ff7b7b; }
.file-item__status--renamed { color: #7fb1ff; }
.file-item__info { min-width: 0; }
.file-item__name {
  font-size: 11px;
  font-weight: 500;
  color: var(--ls-text-secondary, #c3c9d4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-item__path {
  font-size: 9px;
  color: var(--ls-text-hint, #5d667a);
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-item__stats {
  display: flex;
  gap: 6px;
  padding-left: 20px;
}
.file-item__add { font-size: 9px; color: rgba(84, 216, 140, 0.7); font-family: monospace; }
.file-item__del { font-size: 9px; color: #ff7b7b; font-family: monospace; }
.file-item__actions {
  display: none;
  gap: 2px;
  padding-left: 20px;
  margin-top: 2px;
}
.file-item--selected .file-item__actions { display: flex; }
.file-item__action {
  width: 20px;
  height: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  background: transparent;
  color: var(--ls-text-hint, #5d667a);
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 120ms ease;
}
.file-item__action:hover { background: rgba(255, 255, 255, 0.06); }
.file-item__action--stage:hover { color: rgba(84, 216, 140, 0.9); border-color: rgba(84, 216, 140, 0.3); }
.file-item__action--revert:hover { color: #ff7b7b; border-color: rgba(255, 123, 123, 0.3); }
.file-item__action--comment:hover { color: #ffd463; border-color: rgba(255, 212, 99, 0.3); }
</style>
