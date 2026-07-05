export interface PlatformInfo { isWindows: boolean; isMac: boolean; isLinux: boolean; isTauri: boolean; }

export function getPlatformInfo(): PlatformInfo {
  const nav = typeof navigator !== 'undefined' ? navigator : null
  const platform = nav?.platform ?? ''
  return {
    isWindows: /Win/.test(platform),
    isMac: /Mac/.test(platform),
    isLinux: /Linux/.test(platform),
    isTauri: typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window,
  }
}
