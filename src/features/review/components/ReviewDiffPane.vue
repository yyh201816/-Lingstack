<script setup lang="ts">
import { computed } from 'vue'
import ReviewFileList from './ReviewFileList.vue'
import ReviewHunkViewer from './ReviewHunkViewer.vue'
import InlineCommentEditor from './InlineCommentEditor.vue'
import ReviewEmptyState from './ReviewEmptyState.vue'
import { useReviewStore } from '@/features/review/store/review.store'
import { useThreadStore } from '@/features/threads/store/thread.store'
import { useThreadSessionStore } from '@/features/threads/store/thread-session.store'
import { useGitStore } from '@/features/git/store/git.store'
import { useProjectStore } from '@/features/projects/store/project.store'

const reviewStore = useReviewStore()
const threadStore = useThreadStore()
const sessionStore = useThreadSessionStore()
const gitStore = useGitStore()
const projectStore = useProjectStore()

const threadId = computed(() => threadStore.activeThreadId ?? '')
const projectId = computed(() => projectStore.currentProjectId ?? 'default')

const diffFiles = computed(() => reviewStore.getDiffFiles(threadId.value))
const selectedFile = computed(() => reviewStore.getSelectedFile(threadId.value))
const hasDiffs = computed(() => reviewStore.hasDiff(threadId.value))
const additions = computed(() => reviewStore.totalAdditions(threadId.value))
const deletions = computed(() => reviewStore.totalDeletions(threadId.value))

function handleStageFile(fileId: string) {
  reviewStore.stageFile(threadId.value, fileId)
  const file = diffFiles.value.find((f) => f.id === fileId)
  // Bridge to git.store: add file as staged
  if (file && !gitStore.getChangedFiles(projectId.value).some(gf => gf.filePath === file.filePath)) {
    gitStore.addChangedFile(projectId.value, file.filePath, file.fileName, file.status === 'modified' ? 'modified' : file.status)
    // Find the newly added git file and stage it
    const gitFiles = gitStore.getChangedFiles(projectId.value)
    const gitFile = gitFiles.find(gf => gf.filePath === file.filePath)
    if (gitFile) gitStore.stageFile(projectId.value, gitFile.id)
  } else if (file) {
    const gitFiles = gitStore.getChangedFiles(projectId.value)
    const gitFile = gitFiles.find(gf => gf.filePath === file.filePath)
    if (gitFile) gitStore.stageFile(projectId.value, gitFile.id)
  }
  sessionStore.appendMessage(threadId.value, 'system',
    `Staged: ${file?.filePath || fileId}`, 'system')
}

function handleRevertFile(fileId: string) {
  reviewStore.revertFile(threadId.value, fileId)
  const file = diffFiles.value.find((f) => f.id === fileId)
  // Bridge to git.store: remove/revert the file
  if (file) {
    const gitFiles = gitStore.getChangedFiles(projectId.value)
    const gitFile = gitFiles.find(gf => gf.filePath === file.filePath)
    if (gitFile) gitStore.revertFile(projectId.value, gitFile.id)
  }
  sessionStore.appendMessage(threadId.value, 'system',
    `Reverted: ${file?.filePath || fileId}`, 'system')
}

function handleStageHunk(hunkId: string) {
  reviewStore.stageHunk(threadId.value, hunkId)
  sessionStore.appendMessage(threadId.value, 'system',
    `Staged hunk in: ${selectedFile.value?.filePath || 'unknown'}`, 'system')
}

function handleRevertHunk(hunkId: string) {
  reviewStore.revertHunk(threadId.value, hunkId)
  sessionStore.appendMessage(threadId.value, 'system',
    `Reverted hunk in: ${selectedFile.value?.filePath || 'unknown'}`, 'system')
}

function handleAddComment(fileId: string, hunkId?: string) {
  reviewStore.openCommentEditor(threadId.value, fileId, hunkId)
}

function handleCommentSubmit(content: string) {
  const target = reviewStore.commentTarget
  if (!target) return
  const comment = reviewStore.addComment(target.threadId, target.fileId, content, target.hunkId)
  const file = diffFiles.value.find((f) => f.id === target.fileId)
  const fileLabel = file?.fileName || file?.filePath || target.fileId
  sessionStore.appendMessage(
    threadId.value,
    'review_comment',
    `[Review on ${fileLabel}] ${content}`,
    'system',
    { commentId: comment.id, fileId: target.fileId, hunkId: target.hunkId },
  )
}
</script>

<template>
  <div class="diff-pane">
    <template v-if="hasDiffs">
      <!-- Summary bar -->
      <div class="diff-pane__summary">
        <span class="diff-pane__stat diff-pane__stat--add">+{{ additions }}</span>
        <span class="diff-pane__stat diff-pane__stat--del">-{{ deletions }}</span>
        <span class="diff-pane__stat diff-pane__stat--files">{{ diffFiles.length }} file(s)</span>
      </div>
      <!-- File list + hunk viewer -->
      <div class="diff-pane__body">
        <div class="diff-pane__file-list">
          <ReviewFileList
            :files="diffFiles"
            :selected-file-id="selectedFile?.id ?? null"
            :thread-id="threadId"
            @select="reviewStore.selectFile(threadId, $event)"
            @stage="handleStageFile"
            @revert="handleRevertFile"
            @comment="handleAddComment"
          />
        </div>
        <div class="diff-pane__hunk-viewer">
          <ReviewHunkViewer
            v-if="selectedFile"
            :file="selectedFile"
            :thread-id="threadId"
            :selected-hunk-id="null"
            @select-hunk="reviewStore.selectHunk(threadId, $event)"
            @stage-hunk="handleStageHunk"
            @revert-hunk="handleRevertHunk"
            @comment="handleAddComment(selectedFile.id, $event)"
          />
          <div v-else class="diff-pane__no-file">选择文件查看差异详情</div>
        </div>
      </div>
      <!-- Comment editor -->
      <InlineCommentEditor
        v-if="reviewStore.commentTarget"
        @submit="handleCommentSubmit"
        @cancel="reviewStore.closeCommentEditor()"
      />
    </template>
    <ReviewEmptyState v-else />
  </div>
</template>

<style scoped>
.diff-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.diff-pane__summary {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}
.diff-pane__stat {
  font-size: 11px;
  font-weight: 600;
  color: var(--ls-text-hint, #5d667a);
}
.diff-pane__stat--add { color: rgba(84, 216, 140, 0.85); }
.diff-pane__stat--del { color: #ff7b7b; }
.diff-pane__body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.diff-pane__file-list {
  width: 170px;
  min-width: 140px;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  overflow-y: auto;
}
.diff-pane__hunk-viewer {
  flex: 1;
  overflow-y: auto;
  min-width: 0;
}
.diff-pane__no-file {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 12px;
  color: var(--ls-text-hint, #5d667a);
}
</style>
