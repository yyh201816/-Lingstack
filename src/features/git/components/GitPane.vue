<script setup lang="ts">
import { computed, ref } from 'vue'
import GitBranchBar from './GitBranchBar.vue'
import GitChangedFilesList from './GitChangedFilesList.vue'
import CommitDraftEditor from './CommitDraftEditor.vue'
import GitEmptyState from './GitEmptyState.vue'
import { useGitStore } from '@/features/git/store/git.store'
import { useProjectStore } from '@/features/projects/store/project.store'
import { useThreadSessionStore } from '@/features/threads/store/thread-session.store'
import { useThreadStore } from '@/features/threads/store/thread.store'

const gitStore = useGitStore()
const projectStore = useProjectStore()
const threadStore = useThreadStore()
const sessionStore = useThreadSessionStore()

const projectId = computed(() => projectStore.currentProjectId ?? 'default')
const threadId = computed(() => threadStore.activeThreadId ?? '')

const branch = computed(() => gitStore.getBranch(projectId.value))
const files = computed(() => gitStore.getChangedFiles(projectId.value))
const stagedCount = computed(() => gitStore.stagedCount(projectId.value))
const totalCount = computed(() => gitStore.changeCount(projectId.value))
const hasFiles = computed(() => gitStore.hasChanges(projectId.value))
const draft = computed({
  get: () => gitStore.getCommitDraft(projectId.value),
  set: (v) => gitStore.setCommitDraft(projectId.value, v),
})

function handleStage(fileId: string) {
  gitStore.stageFile(projectId.value, fileId)
  const file = files.value.find((f) => f.id === fileId)
  sessionStore.appendMessage(threadId.value, 'system',
    `[Git] Staged: ${file?.filePath || fileId}`, 'system')
}

function handleUnstage(fileId: string) {
  gitStore.unstageFile(projectId.value, fileId)
  const file = files.value.find((f) => f.id === fileId)
  sessionStore.appendMessage(threadId.value, 'system',
    `[Git] Unstaged: ${file?.filePath || fileId}`, 'system')
}

function handleRevert(fileId: string) {
  gitStore.revertFile(projectId.value, fileId)
  sessionStore.appendMessage(threadId.value, 'system',
    `[Git] Reverted a file`, 'system')
}

function handleStageAll() {
  gitStore.stageAll(projectId.value)
  sessionStore.appendMessage(threadId.value, 'system',
    `[Git] Staged all ${totalCount.value} file(s)`, 'system')
}

function handleRevertAll() {
  gitStore.revertAll(projectId.value)
  sessionStore.appendMessage(threadId.value, 'system',
    `[Git] Reverted all changes`, 'system')
}

function handleDraftChange(value: string) {
  gitStore.setCommitDraft(projectId.value, value)
}
</script>

<template>
  <div class="git-pane">
    <template v-if="hasFiles">
      <GitBranchBar
        :branch="branch"
        :staged-count="stagedCount"
        :total-count="totalCount"
        @stage-all="handleStageAll"
        @revert-all="handleRevertAll"
      />
      <div class="git-pane__files">
        <GitChangedFilesList
          :files="files"
          @stage="handleStage"
          @unstage="handleUnstage"
          @revert="handleRevert"
        />
      </div>
      <CommitDraftEditor
        :model-value="draft"
        :staged-count="stagedCount"
        @update:model-value="handleDraftChange"
      />
    </template>
    <GitEmptyState v-else />
  </div>
</template>

<style scoped>
.git-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.git-pane__files {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
</style>
