/**
 * browser.types.ts  Browser Capability Types
 */

export interface BrowserSessionState {
  threadId?: string
  currentUrl: string
  isOpen: boolean
  lastOpenedAt?: string
  recentUrls: string[]
}

export function createDefaultBrowserState(): BrowserSessionState {
  return {
    currentUrl: '',
    isOpen: false,
    recentUrls: [],
  }
}
