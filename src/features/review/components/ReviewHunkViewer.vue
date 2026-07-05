<script setup lang="ts">
import type { ReviewFileDiff } from '@/features/review/types'
import { useReviewStore } from '@/features/review/store/review.store'

const props = defineProps<{
  file: ReviewFileDiff
  threadId: string
  selectedHunkId: string | null
}>()

const emit = defineEmits<{
  (e: 'select-hunk', hunkId: string): void
  (e: 'stage-hunk', hunkId: string): void
  (e: 'revert-hunk', hunkId: string): void
  (e: 'comment', hunkId: string): void
}>()

const reviewStore = useReviewStore()

function getCommentsForHunk(hunkId: string) {
  return reviewStore.getCommentsForHunk(props.threadId, hunkId)
}
</script>

<template>
  <div class="hunk-viewer">
    <div v-if="file.hunks.length === 0" class="hunk-viewer__empty">
      No diff content available for this file.
    </div>
    <div
      v-for="hunk in file.hunks"
      v-show="!hunk.reverted"
      :key="hunk.id"
      class="hunk"
      :class="{
        'hunk--selected': hunk.id === selectedHunkId,
        'hunk--staged': hunk.staged,
      }"
      @click="emit('select-hunk', hunk.id)"
    >
      <!-- Hunk header -->
      <div class="hunk__header">
        <code class="hunk__header-text">{{ hunk.header }}</code>
        <div class="hunk__header-actions" @click.stop>
          <button
            v-if="!hunk.staged"
            class="hunk__action hunk__action--stage"
            title="Stage Hunk"
            @click="emit('stage-hunk', hunk.id)"
          >&#x2713;</button>
          <button
            class="hunk__action hunk__action--revert"
            title="Revert Hunk"
            @click="emit('revert-hunk', hunk.id)"
          >&#x21A9;</button>
          <button
            class="hunk__action hunk__action--comment"
            title="Add Comment"
            @click="emit('comment', hunk.id)"
          >&#x1F4AC;</button>
        </div>
      </div>
      <!-- Hunk lines -->
      <div class="hunk__lines">
        <div
          v-for="line in hunk.lines"
          :key="line.id"
          class="hunk__line"
          :class="`hunk__line--${line.lineType}`"
        >
          <span class="hunk__line-oldnum">{{ line.oldNumber ?? '' }}</span>
          <span class="hunk__line-newnum">{{ line.newNumber ?? '' }}</span>
          <span class="hunk__line-prefix">{{ line.lineType === 'add' ? '+' : line.lineType === 'delete' ? '-' : ' ' }}</span>
          <span class="hunk__line-content">{{ line.content }}</span>
        </div>
      </div>
      <!-- Hunk comments -->
      <div v-if="getCommentsForHunk(hunk.id).length > 0" class="hunk__comments">
        <div
          v-for="c in getCommentsForHunk(hunk.id)"
          :key="c.id"
          class="hunk__comment"
          :class="`hunk__comment--${hunk.id}`"
        >
          <div class="hunk__comment-content">{{ c.content }}</div>
          <div class="hunk__comment-time">{{ new Date(c.createdAt).toLocaleTimeString() }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hunk-viewer {
  padding: 8px;
  font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;
}
.hunk-viewer__empty {
  font-size: 12px;
  color: var(--ls-text-hint, #5d667a);
  padding: 20px;
  text-align: center;
}
.hunk {
  margin-bottom: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 120ms ease;
}
.hunk:hover { border-color: rgba(255, 255, 255, 0.1); }
.hunk--selected { border-color: rgba(90, 147, 255, 0.2); }
.hunk--staged { opacity: 0.7; }
.hunk__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.hunk__header-text {
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hunk__header-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}
.hunk__action {
  width: 18px;
  height: 18px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  background: transparent;
  color: var(--ls-text-hint, #5d667a);
  font-size: 9px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 120ms ease;
}
.hunk__action:hover { background: rgba(255, 255, 255, 0.04); }
.hunk__action--stage:hover { color: rgba(84, 216, 140, 0.9); }
.hunk__action--revert:hover { color: #ff7b7b; }
.hunk__action--comment:hover { color: #ffd463; }
.hunk__lines {
  font-size: 11px;
  line-height: 1.5;
}
.hunk__line {
  display: flex;
  padding: 0 10px;
  min-height: 18px;
  align-items: baseline;
}
.hunk__line--add { background: rgba(84, 216, 140, 0.08); }
.hunk__line--add .hunk__line-content { color: rgba(84, 216, 140, 0.9); }
.hunk__line--delete { background: rgba(255, 107, 107, 0.08); }
.hunk__line--delete .hunk__line-content { color: #ff7b7b; }
.hunk__line--context .hunk__line-content { color: var(--ls-text-secondary, #c3c9d4); }
.hunk__line-oldnum, .hunk__line-newnum {
  width: 32px;
  min-width: 32px;
  text-align: right;
  padding-right: 8px;
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  flex-shrink: 0;
}
.hunk__line-prefix {
  width: 12px;
  flex-shrink: 0;
  font-weight: 600;
  color: var(--ls-text-hint, #5d667a);
}
.hunk__line--add .hunk__line-prefix { color: rgba(84, 216, 140, 0.7); }
.hunk__line--delete .hunk__line-prefix { color: #ff7b7b; }
.hunk__line-content {
  white-space: pre;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hunk__comments {
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  padding: 5px 10px;
  background: rgba(255, 212, 99, 0.04);
}
.hunk__comment {
  padding: 4px 0;
}
.hunk__comment-content {
  font-size: 11px;
  color: var(--ls-text-secondary, #c3c9d4);
  font-family: inherit;
}
.hunk__comment-time {
  font-size: 9px;
  color: var(--ls-text-hint, #5d667a);
  margin-top: 2px;
}
</style>
