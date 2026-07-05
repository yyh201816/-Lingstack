import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ThemeMode } from './app.store'

const THEME_KEY = 'lingstack_theme'

function readTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* ignore */ }
  return 'light'
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(readTheme())

  function setMode(m: ThemeMode) {
    mode.value = m
    document.documentElement.setAttribute('data-theme', m)
    try {
      localStorage.setItem(THEME_KEY, m)
    } catch { /* 静默失败 */ }
  }

  function toggle() { setMode(mode.value === 'light' ? 'dark' : 'light') }

  return { mode, setMode, toggle }
})
