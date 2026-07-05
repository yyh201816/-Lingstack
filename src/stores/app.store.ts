import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ThemeMode = 'light' | 'dark'
export type StartupPage = 'workspace' | 'last-session'
export type FontSize = 'compact' | 'normal' | 'comfortable'

export const useAppStore = defineStore('app', () => {
  const startupPage = ref<StartupPage>('workspace')
  const rememberWorkspace = ref<boolean>(true)
  const fontSize = ref<FontSize>('normal')
  const compactMode = ref<boolean>(false)
  const showShortcutHints = ref<boolean>(true)
  const appVersion = ref<string>('0.2.9')
  const isTauri = ref<boolean>(typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window)
  const isDev = computed(() => import.meta.env.DEV)

  return { startupPage, rememberWorkspace, fontSize, compactMode, showShortcutHints, appVersion, isTauri, isDev }
})
