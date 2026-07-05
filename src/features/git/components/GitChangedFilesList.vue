<script setup lang="ts">
import type { GitChangedFile } from '@/features/git/types'

defineProps<{
  files: GitChangedFile[]
}>()

const emit = defineEmits<{
  (e: 'stage', fileId: string): void
  (e: 'unstage', fileId: string): void
  (e: 'revert', fileId: string): void
}>()

const statusLabels: Record<string, string> = {
  added: 'A',
  modified: 'M',
  deleted: 'D',
  renamed: 'R',
  untracked: 'U',
}
</script>

<template>
  <div class="git-files">
    <div
      v-for="file in files"
      :key="file.id"
      class="git-file"
      :class="{ 'git-file--staged': file.staged }"
    >
      <span
        class="git-file__status"
        :class="`git-file__status--${file.status}`"
      >{{ statusLabels[file.status] || '?' }}</span>
      <div class="git-file__info">
        <span class="git-file__name">{{ file.fileName }}</span>
        <span class="git-file__path">{{ file.filePath }}</span>
      </div>
      <div class="git-file__actions">
        <button
          v-if="!file.staged"
          class="git-file__action git-file__action--stage"
          title="Stage"
          @click="emit('stage', file.id)"
        >&#x2713;</button>
        <button
          v-else
          class="git-file__action git-file__action--unstage"
          title="Unstage"
          @click="emit('unstage', file.id)"
        >&#x2717;</button>
        <button
          class="git-file__action git-file__action--revert"
          title="Revert"
          @click="emit('revert', file.id)"
        >&#x21A9;</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.git-files {
  padding: 4px 0;
}
.git-file {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: background 120ms ease;
}
.git-file:hover { background: rgba(255, 255, 255, 0.02); }
.git-file--staged { background: rgba(84, 216, 140, 0.04); border-left-color: rgba(84, 216, 140, 0.3); }
.git-file__status {
  font-size: 10px;
  font-weight: 700;
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}
.git-file__status--added { color: rgba(84, 216, 140, 0.85); }
.git-file__status--modified { color: #ffd463; }
.git-file__status--deleted { color: #ff6b6b; }
.git-file__status--renamed { color: #7fb1ff; }
.git-file__status--untracked { color: var(--ls-text-hint, #5d667a); }
.git-file__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.git-file__name {
  font-size: 11px;
  font-weight: 500;
  color: var(--ls-text-secondary, #c3c9d4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.git-file__path {
  font-size: 9px;
  color: var(--ls-text-hint, #5d667a);
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.git-file__actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}
.git-file__action {
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
.git-file__action:hover { background: rgba(255, 255, 255, 0.04); }
.git-file__action--stage:hover { color: rgba(84, 216, 140, 0.9); border-color: rgba(84, 216, 140, 0.3); }
.git-file__action--unstage:hover { color: #ffd463; border-color: rgba(255, 212, 99, 0.3); }
.git-file__action--revert:hover { color: #ff6b6b; border-color: rgba(255, 107, 107, 0.3); }
</style>
