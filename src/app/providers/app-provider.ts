export function useAppProvider() {
  return {
    isTauri: typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window,
    isDev: import.meta.env.DEV,
  }
}
