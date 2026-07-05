import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GitChangedFile, GitFileStatus } from '../types'

const STORAGE_KEY = 'lingstack_git_state'

interface PersistedGitState {
  branches: Record<string, string>
  commitDrafts: Record<string, string>
}

function loadState(): PersistedGitState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { branches: {}, commitDrafts: {} }
  } catch {
    return { branches: {}, commitDrafts: {} }
  }
}

function saveState(state: PersistedGitState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function generateId(): string {
  return 'gf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}

export const useGitStore = defineStore('git', () => {
  // --- persisted state ---
  const persisted = loadState()
  const branchesByProject = ref<Record<string, string>>(persisted.branches)
  const commitDraftsByProject = ref<Record<string, string>>(persisted.commitDrafts)

  // --- transient state ---
  const changedFilesByProject = ref<Record<string, GitChangedFile[]>>({})
  const lastSyncedAtByProject = ref<Record<string, string>>({})

  // --- getters: per project ---
  function getBranch(projectId: string): string {
    return branchesByProject.value[projectId] ?? 'main'
  }

  function getChangedFiles(projectId: string): GitChangedFile[] {
    return changedFilesByProject.value[projectId] ?? []
  }

  function getStagedFiles(projectId: string): GitChangedFile[] {
    return getChangedFiles(projectId).filter((f) => f.staged)
  }

  function getUnstagedFiles(projectId: string): GitChangedFile[] {
    return getChangedFiles(projectId).filter((f) => !f.staged)
  }

  function getCommitDraft(projectId: string): string {
    return commitDraftsByProject.value[projectId] ?? ''
  }

  function hasChanges(projectId: string): boolean {
    return getChangedFiles(projectId).length > 0
  }

  function changeCount(projectId: string): number {
    return getChangedFiles(projectId).length
  }

  function stagedCount(projectId: string): number {
    return getStagedFiles(projectId).length
  }

  // --- actions: branch ---
  function setBranch(projectId: string, branch: string) {
    branchesByProject.value[projectId] = branch
    persistBranches()
  }

  // --- actions: changed files ---
  function setChangedFiles(projectId: string, files: GitChangedFile[]) {
    changedFilesByProject.value[projectId] = files
    lastSyncedAtByProject.value[projectId] = new Date().toISOString()
  }

  function addChangedFile(projectId: string, filePath: string, fileName: string, status: GitFileStatus) {
    if (!changedFilesByProject.value[projectId]) {
      changedFilesByProject.value[projectId] = []
    }
    const files = changedFilesByProject.value[projectId]
    const existing = files.find((f) => f.filePath === filePath)
    if (!existing) {
      files.push({
        id: generateId(),
        projectId,
        filePath,
        fileName,
        status,
        additions: status === 'added' ? 1 : 0,
        deletions: status === 'deleted' ? 1 : 0,
        staged: false,
      })
    }
  }

  function removeFile(projectId: string, fileId: string) {
    const files = changedFilesByProject.value[projectId]
    if (files) {
      changedFilesByProject.value[projectId] = files.filter((f) => f.id !== fileId)
    }
  }

  // --- actions: stage / unstage ---
  function stageFile(projectId: string, fileId: string) {
    const file = getChangedFiles(projectId).find((f) => f.id === fileId)
    if (file && !file.staged) {
      file.staged = true
    }
  }

  function unstageFile(projectId: string, fileId: string) {
    const file = getChangedFiles(projectId).find((f) => f.id === fileId)
    if (file) {
      file.staged = false
    }
  }

  function stageAll(projectId: string) {
    for (const f of getChangedFiles(projectId)) {
      f.staged = true
    }
  }

  function unstageAll(projectId: string) {
    for (const f of getChangedFiles(projectId)) {
      f.staged = false
    }
  }

  // --- actions: revert ---
  function revertFile(projectId: string, fileId: string) {
    const files = changedFilesByProject.value[projectId]
    if (files) {
      changedFilesByProject.value[projectId] = files.filter((f) => f.id !== fileId)
    }
  }

  function revertAll(projectId: string) {
    delete changedFilesByProject.value[projectId]
  }

  // --- actions: commit draft ---
  function setCommitDraft(projectId: string, message: string) {
    commitDraftsByProject.value[projectId] = message
    persistDrafts()
  }

  function clearCommitDraft(projectId: string) {
    delete commitDraftsByProject.value[projectId]
    persistDrafts()
  }

  // --- actions: reset ---
  function resetProject(projectId: string) {
    delete changedFilesByProject.value[projectId]
    delete commitDraftsByProject.value[projectId]
    delete lastSyncedAtByProject.value[projectId]
    persistDrafts()
  }

  // --- persistence ---
  function persistBranches() {
    saveState({ branches: branchesByProject.value, commitDrafts: commitDraftsByProject.value })
  }

  function persistDrafts() {
    saveState({ branches: branchesByProject.value, commitDrafts: commitDraftsByProject.value })
  }

  function hydrate() {
    const s = loadState()
    branchesByProject.value = s.branches
    commitDraftsByProject.value = s.commitDrafts
  }

  return {
    // state
    branchesByProject,
    changedFilesByProject,
    commitDraftsByProject,
    lastSyncedAtByProject,
    // getters (per-project functions)
    getBranch,
    getChangedFiles,
    getStagedFiles,
    getUnstagedFiles,
    getCommitDraft,
    hasChanges,
    changeCount,
    stagedCount,
    // actions
    setBranch,
    setChangedFiles,
    addChangedFile,
    removeFile,
    stageFile,
    unstageFile,
    stageAll,
    unstageAll,
    revertFile,
    revertAll,
    setCommitDraft,
    clearCommitDraft,
    resetProject,
    hydrate,
  }
})
