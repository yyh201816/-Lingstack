import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ReviewTab,
  ReviewFileDiff,
  ReviewHunk,
  ReviewComment,
  ReviewDiffSet,
} from '../types'

const STORAGE_KEY = 'lingstack_review_state'

interface PersistedReviewState {
  activeTab: ReviewTab
}

function loadState(): PersistedReviewState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { activeTab: 'review' }
  } catch {
    return { activeTab: 'review' }
  }
}

function saveState(state: PersistedReviewState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function generateId(): string {
  return 'rev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}

export const useReviewStore = defineStore('review', () => {
  // --- state ---
  const activeReviewTab = ref<ReviewTab>(loadState().activeTab)

  // Per-thread management
  const diffSetByThread = ref<Record<string, ReviewDiffSet>>({})
  const selectedFileIdByThread = ref<Record<string, string | null>>({})
  const selectedHunkIdByThread = ref<Record<string, string | null>>({})
  const commentsByThread = ref<Record<string, ReviewComment[]>>({})

  // Comment input state
  const commentTarget = ref<{
    threadId: string
    fileId: string
    hunkId?: string
    lineId?: string
  } | null>(null)

  // --- getters: current thread ---
  function getDiffSet(threadId: string): ReviewDiffSet | null {
    return diffSetByThread.value[threadId] ?? null
  }

  function getDiffFiles(threadId: string): ReviewFileDiff[] {
    return diffSetByThread.value[threadId]?.files ?? []
  }

  function getSelectedFile(threadId: string): ReviewFileDiff | null {
    const files = getDiffFiles(threadId)
    const fileId = selectedFileIdByThread.value[threadId]
    return files.find((f) => f.id === fileId) ?? null
  }

  function getSelectedHunk(threadId: string): ReviewHunk | null {
    const file = getSelectedFile(threadId)
    if (!file) return null
    const hunkId = selectedHunkIdByThread.value[threadId]
    return file.hunks.find((h) => h.id === hunkId) ?? null
  }

  function getComments(threadId: string): ReviewComment[] {
    return commentsByThread.value[threadId] ?? []
  }

  function getCommentsForFile(threadId: string, fileId: string): ReviewComment[] {
    return getComments(threadId).filter((c) => c.fileId === fileId)
  }

  function getCommentsForHunk(threadId: string, hunkId: string): ReviewComment[] {
    return getComments(threadId).filter((c) => c.hunkId === hunkId)
  }

  function hasDiff(threadId: string): boolean {
    return getDiffFiles(threadId).length > 0
  }

  function totalAdditions(threadId: string): number {
    return getDiffFiles(threadId).reduce((sum, f) => sum + f.additions, 0)
  }

  function totalDeletions(threadId: string): number {
    return getDiffFiles(threadId).reduce((sum, f) => sum + f.deletions, 0)
  }

  // --- actions: tab ---
  function setActiveReviewTab(tab: ReviewTab) {
    activeReviewTab.value = tab
    persist()
  }

  // --- actions: diff set ---
  function setDiffSet(threadId: string, diffSet: ReviewDiffSet) {
    diffSetByThread.value[threadId] = diffSet
    // Auto-select first file
    if (diffSet.files.length > 0) {
      selectedFileIdByThread.value[threadId] = diffSet.files[0].id
      selectedHunkIdByThread.value[threadId] = null
    }
  }

  function clearDiffSet(threadId: string) {
    delete diffSetByThread.value[threadId]
    delete selectedFileIdByThread.value[threadId]
    delete selectedHunkIdByThread.value[threadId]
  }

  // --- actions: selection ---
  function selectFile(threadId: string, fileId: string | null) {
    selectedFileIdByThread.value[threadId] = fileId
    selectedHunkIdByThread.value[threadId] = null
  }

  function selectHunk(threadId: string, hunkId: string | null) {
    selectedHunkIdByThread.value[threadId] = hunkId
  }

  // --- actions: comment ---
  function openCommentEditor(
    threadId: string,
    fileId: string,
    hunkId?: string,
    lineId?: string,
  ) {
    commentTarget.value = { threadId, fileId, hunkId, lineId }
  }

  function closeCommentEditor() {
    commentTarget.value = null
  }

  function addComment(
    threadId: string,
    fileId: string,
    content: string,
    hunkId?: string,
    lineId?: string,
  ): ReviewComment {
    if (!commentsByThread.value[threadId]) {
      commentsByThread.value[threadId] = []
    }
    const comment: ReviewComment = {
      id: generateId(),
      threadId,
      fileId,
      hunkId,
      lineId,
      content,
      createdAt: new Date().toISOString(),
    }
    commentsByThread.value[threadId].push(comment)
    closeCommentEditor()
    return comment
  }

  // --- actions: stage / revert ---
  function stageFile(threadId: string, fileId: string) {
    const file = getDiffFiles(threadId).find((f) => f.id === fileId)
    if (file) {
      file.staged = true
      file.reverted = false
      for (const h of file.hunks) {
        h.staged = true
        h.reverted = false
      }
    }
  }

  function revertFile(threadId: string, fileId: string) {
    const file = getDiffFiles(threadId).find((f) => f.id === fileId)
    if (file) {
      file.reverted = true
      file.staged = false
      for (const h of file.hunks) {
        h.reverted = true
        h.staged = false
      }
    }
  }

  function stageHunk(threadId: string, hunkId: string) {
    const file = getDiffFiles(threadId).find((f) =>
      f.hunks.some((h) => h.id === hunkId),
    )
    if (!file) return
    const hunk = file.hunks.find((h) => h.id === hunkId)
    if (hunk) {
      hunk.staged = true
      hunk.reverted = false
      // If all hunks staged, stage the file too
      if (file.hunks.every((h) => h.staged)) {
        file.staged = true
      }
    }
  }

  function revertHunk(threadId: string, hunkId: string) {
    const file = getDiffFiles(threadId).find((f) =>
      f.hunks.some((h) => h.id === hunkId),
    )
    if (!file) return
    const hunk = file.hunks.find((h) => h.id === hunkId)
    if (hunk) {
      hunk.reverted = true
      hunk.staged = false
      // If all hunks reverted, revert the file too
      if (file.hunks.every((h) => h.reverted)) {
        file.reverted = true
        file.staged = false
      }
    }
  }

  function persist() {
    saveState({ activeTab: activeReviewTab.value })
  }

  function hydrate() {
    const s = loadState()
    activeReviewTab.value = s.activeTab
  }

  return {
    // state
    activeReviewTab,
    diffSetByThread,
    selectedFileIdByThread,
    selectedHunkIdByThread,
    commentsByThread,
    commentTarget,
    // getters
    getDiffSet,
    getDiffFiles,
    getSelectedFile,
    getSelectedHunk,
    getComments,
    getCommentsForFile,
    getCommentsForHunk,
    hasDiff,
    totalAdditions,
    totalDeletions,
    // actions
    setActiveReviewTab,
    setDiffSet,
    clearDiffSet,
    selectFile,
    selectHunk,
    openCommentEditor,
    closeCommentEditor,
    addComment,
    stageFile,
    revertFile,
    stageHunk,
    revertHunk,
    persist,
    hydrate,
  }
})
