import type { ThemeMode } from '@/stores/app.store'
export const THEME_MODES: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
]
