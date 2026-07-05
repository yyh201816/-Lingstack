/**
 * command-registry.service.ts — 统一命令动作注册表
 */

import { useThreadStore } from '@/features/threads/store/thread.store'
import { useReviewStore } from '@/features/review/store/review.store'
import type { ReviewTab } from '@/features/review/types'

export type CommandAction =
  | 'newThread' | 'searchThreads' | 'toggleSidebar' | 'openSettings'
  | 'openTerminal' | 'openReview' | 'openGit' | 'stopCurrent'
  | 'clearTerminal' | 'copyThreadDeepLink' | 'composerSend' | 'focusThreadSearch'

interface CommandContext {
  threadId?: string
  toggleSidebar?: () => void
  openSettings?: () => void
  focusThreadSearch?: () => void
  stopComposer?: () => void
}

let currentContext: CommandContext = {}

export function setCommandContext(ctx: Partial<CommandContext>) {
  Object.assign(currentContext, ctx)
}

export function executeCommand(action: CommandAction) {
  const threadStore = useThreadStore()
  const reviewStore = useReviewStore()

  switch (action) {
    case 'newThread':
      threadStore.createThread('New Thread', 'default')
      break
    case 'searchThreads':
    case 'focusThreadSearch':
      currentContext.focusThreadSearch?.()
      break
    case 'toggleSidebar':
      currentContext.toggleSidebar?.()
      break
    case 'openSettings':
      currentContext.openSettings?.()
      break
    case 'openTerminal': {
      reviewStore.setActiveReviewTab('terminal' as ReviewTab)
      break
    }
    case 'openReview': {
      reviewStore.setActiveReviewTab('review' as ReviewTab)
      break
    }
    case 'openGit': {
      reviewStore.setActiveReviewTab('git' as ReviewTab)
      break
    }
    case 'stopCurrent':
      currentContext.stopComposer?.()
      break
    case 'clearTerminal': {
      const tid = threadStore.activeThreadId
      if (tid) {
        import('@/features/terminal/store/terminal.store').then(
          ({ useTerminalStore }) => {
            useTerminalStore().clearThreadTerminal(tid)
          },
        )
      }
      break
    }
    case 'copyThreadDeepLink': {
      const tid = currentContext.threadId || threadStore.activeThreadId
      if (tid) {
        navigator.clipboard.writeText(`lingstack://threads/${tid}`).catch(() => {})
      }
      break
    }
    default:
      break
  }
}
