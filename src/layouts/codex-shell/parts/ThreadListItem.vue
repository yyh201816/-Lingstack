<script setup lang="ts">
const props = defineProps<{
  title: string
  status: string
  projectName: string
  updatedAt: string
  isPinned?: boolean
  isActive?: boolean
  isRenaming?: boolean
  renameValue?: string
}>()

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'contextmenu', event: MouseEvent): void
  (e: 'rename-confirm'): void
  (e: 'rename-cancel'): void
  (e: 'rename-update', value: string): void
}>()

const statusColors: Record<string, string> = {
  idle: '#5d667a',
  running: '#5a93ff',
  done: 'rgba(84,216,140,0.8)',
  waiting_input: '#ffd463',
  failed: '#ff6b6b',
  paused: '#8e96a6',
  ready_review: '#7fb1ff',
  waiting_approval: '#ff9f43',
}
</script>

<template>
  <div
    class="thread-item"
    :class="{
      'thread-item--pinned': isPinned,
      'thread-item--active': isActive,
    }"
    @click="emit('click')"
    @contextmenu="emit('contextmenu', $event)"
  >
    <div class="thread-item__status-dot" :style="{ background: statusColors[status] || '#5d667a' }"></div>
    <div class="thread-item__content">
      <div class="thread-item__header">
        <div v-if="!isRenaming" class="thread-item__title">{{ title }}</div>
        <div v-else class="thread-item__rename-row">
          <input
            class="thread-item__rename-input"
            :value="renameValue"
            @input="emit('rename-update', ($event.target as HTMLInputElement).value)"
            @keydown.enter.stop="emit('rename-confirm')"
            @keydown.escape.stop="emit('rename-cancel')"
            @blur="emit('rename-confirm')"
            @click.stop
          />
        </div>
        <span v-if="isPinned && !isRenaming" class="thread-item__pin" title="已置顶">&#x1F4CC;</span>
      </div>
      <div v-if="!isRenaming" class="thread-item__meta">
        <span class="thread-item__project">{{ projectName === '__none__' ? '未关联项目' : projectName }}</span>
        <span class="thread-item__time">{{ updatedAt }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.thread-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 140ms cubic-bezier(0.16, 1, 0.3, 1);
}
.thread-item:hover { background: rgba(255, 255, 255, 0.04); }
.thread-item--pinned { background: rgba(90, 147, 255, 0.04); }
.thread-item--active { background: rgba(90, 147, 255, 0.08); }
.thread-item__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  margin-top: 5px;
  flex-shrink: 0;
}
.thread-item__content { flex: 1; min-width: 0; }
.thread-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.thread-item__title {
  font-size: 12px;
  font-weight: 500;
  color: var(--ls-text-primary, #e9edf6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.thread-item__pin { font-size: 10px; flex-shrink: 0; }
.thread-item__rename-row {
  flex: 1;
}
.thread-item__rename-input {
  width: 100%;
  font-size: 12px;
  font-weight: 500;
  color: var(--ls-text-primary, #e9edf6);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(90, 147, 255, 0.3);
  border-radius: 4px;
  padding: 1px 6px;
  outline: none;
}
.thread-item__meta {
  display: flex;
  gap: 8px;
  margin-top: 2px;
}
.thread-item__project, .thread-item__time {
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  font-family: monospace;
}
</style>
