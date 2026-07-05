/**
 * browser.store.ts  Browser State Management
 * Phase 6: First-class Browser entry in Codex-style workbench
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BrowserSessionState } from '../browser.types'
import { createDefaultBrowserState } from '../browser.types'
import { useThreadStore } from '@/features/threads/store/thread.store'

export const useBrowserStore = defineStore('browser', () => {
  const session = ref<BrowserSessionState>(createDefaultBrowserState())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isOpen = computed(() => session.value.isOpen)
  const currentUrl = computed(() => session.value.currentUrl)
  const hasUrl = computed(() => session.value.currentUrl.length > 0)
  const recentUrls = computed(() => session.value.recentUrls)
  const boundThreadId = computed(() => session.value.threadId)

  function openUrl(url: string) {
    const threadStore = useThreadStore()
    session.value.currentUrl = url
    session.value.isOpen = true
    session.value.lastOpenedAt = new Date().toISOString()
    session.value.threadId = threadStore.activeThreadId ?? undefined
    if (url && !session.value.recentUrls.includes(url)) {
      session.value.recentUrls.unshift(url)
      if (session.value.recentUrls.length > 20) {
        session.value.recentUrls = session.value.recentUrls.slice(0, 20)
      }
    }
    error.value = null
  }

  function closeBrowser() {
    session.value.isOpen = false
  }

  function toggleBrowser() {
    if (session.value.isOpen) {
      closeBrowser()
    } else if (session.value.currentUrl) {
      session.value.isOpen = true
    }
  }

  function bindToThread(threadId: string) {
    session.value.threadId = threadId
  }

  function clearRecentUrls() {
    session.value.recentUrls = []
  }

  return {
    session, loading, error,
    isOpen, currentUrl, hasUrl, recentUrls, boundThreadId,
    openUrl, closeBrowser, toggleBrowser, bindToThread, clearRecentUrls,
  }
})
