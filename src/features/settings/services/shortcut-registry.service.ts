/**
 * shortcut-registry.service.ts — 快捷键监听与分发
 */

import { useShortcutStore } from '../store/shortcut.store'
import { executeCommand, type CommandAction } from '@/services/command-registry.service'

const actionMap: Record<string, CommandAction> = {
  newThread: 'newThread',
  searchThreads: 'focusThreadSearch',
  toggleSidebar: 'toggleSidebar',
  openSettings: 'openSettings',
  openTerminal: 'openTerminal',
  openReview: 'openReview',
  openGit: 'openGit',
  stopCurrent: 'stopCurrent',
  clearTerminal: 'clearTerminal',
  copyDeepLink: 'copyThreadDeepLink',
  focusSearch: 'focusThreadSearch',
}

let cleanup: (() => void) | null = null

export function initGlobalShortcuts() {
  if (cleanup) return

  const handler = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
    if (tag === 'input' || tag === 'textarea') {
      if (e.key !== 'Escape') return
    }

    const shortcutStore = useShortcutStore()
    for (const binding of shortcutStore.bindings) {
      const matchCtrl = binding.ctrlKey === (e.ctrlKey || e.metaKey)
      const matchShift = binding.shiftKey === e.shiftKey
      const matchAlt = binding.altKey === e.altKey
      const matchMeta = binding.metaKey === e.metaKey
      const keyMatches = binding.code === 'Comma' ? e.key === ',' : (e.code === binding.code || e.key === binding.code)

      if (keyMatches && matchCtrl && matchShift && matchAlt && matchMeta) {
        e.preventDefault()
        const action = actionMap[binding.id]
        if (action) executeCommand(action)
        return
      }
    }
  }

  window.addEventListener('keydown', handler)
  cleanup = () => window.removeEventListener('keydown', handler)
}

export function disposeGlobalShortcuts() {
  if (cleanup) { cleanup(); cleanup = null }
}
