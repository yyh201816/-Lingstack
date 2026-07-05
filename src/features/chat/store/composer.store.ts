import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ComposerMode = 'ask' | 'agent' | 'plan' | 'review'

export interface ComposerAttachment {
  id: string
  name: string
  path: string
  type: 'file' | 'image'
  size?: number
}

const STORAGE_KEY = 'lingstack_composer_drafts'

interface ComposerDraft {
  draft: string
  mode: ComposerMode
}

function loadDrafts(): Record<string, ComposerDraft> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveDrafts(data: Record<string, ComposerDraft>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function generateId(): string {
  return 'att_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}

export const useComposerStore = defineStore('composer', () => {
  // --- state ---
  const draftByThread = ref<Record<string, string>>({})
  const modeByThread = ref<Record<string, ComposerMode>>({})
  const attachmentsByThread = ref<Record<string, ComposerAttachment[]>>({})

  // --- actions ---
  function getDraft(threadId: string): string {
    return draftByThread.value[threadId] ?? ''
  }

  function getMode(threadId: string): ComposerMode {
    return modeByThread.value[threadId] ?? 'ask'
  }

  function getAttachments(threadId: string): ComposerAttachment[] {
    return attachmentsByThread.value[threadId] ?? []
  }

  function setDraft(threadId: string, draft: string) {
    draftByThread.value[threadId] = draft
    persistDraft(threadId)
  }

  function clearDraft(threadId: string) {
    delete draftByThread.value[threadId]
    delete modeByThread.value[threadId]
    delete attachmentsByThread.value[threadId]
    persistDraft(threadId)
  }

  function setMode(threadId: string, mode: ComposerMode) {
    modeByThread.value[threadId] = mode
    persistDraft(threadId)
  }

  function addAttachment(threadId: string, name: string, path: string, type: ComposerAttachment['type'] = 'file') {
    if (!attachmentsByThread.value[threadId]) {
      attachmentsByThread.value[threadId] = []
    }
    attachmentsByThread.value[threadId].push({
      id: generateId(),
      name,
      path,
      type,
    })
    persistDraft(threadId)
  }

  function removeAttachment(threadId: string, attachmentId: string) {
    if (!attachmentsByThread.value[threadId]) return
    attachmentsByThread.value[threadId] = attachmentsByThread.value[threadId].filter(
      (a) => a.id !== attachmentId,
    )
    persistDraft(threadId)
  }

  function hydrate() {
    const data = loadDrafts()
    for (const [threadId, draft] of Object.entries(data)) {
      draftByThread.value[threadId] = draft.draft
      modeByThread.value[threadId] = draft.mode
    }
  }

  function persistDraft(threadId: string) {
    const allData = loadDrafts()
    const draft = draftByThread.value[threadId]
    const mode = modeByThread.value[threadId]
    if (draft !== undefined || mode !== undefined) {
      allData[threadId] = {
        draft: draft ?? '',
        mode: mode ?? 'ask',
      }
    } else {
      delete allData[threadId]
    }
    saveDrafts(allData)
  }

  function persistAll() {
    const allData: Record<string, ComposerDraft> = {}
    const allKeys = new Set([
      ...Object.keys(draftByThread.value),
      ...Object.keys(modeByThread.value),
    ])
    for (const threadId of allKeys) {
      allData[threadId] = {
        draft: draftByThread.value[threadId] ?? '',
        mode: modeByThread.value[threadId] ?? 'ask',
      }
    }
    saveDrafts(allData)
  }

  return {
    // state
    draftByThread,
    modeByThread,
    attachmentsByThread,
    // actions
    getDraft,
    getMode,
    getAttachments,
    setDraft,
    clearDraft,
    setMode,
    addAttachment,
    removeAttachment,
    hydrate,
    persistAll,
  }
})
