/**
 * Beta Release Service
 * Provides app version, build channel, and changelog information.
 * Phase 9: reads from package.json / Tauri API with fallback.
 */

import type { BetaVersionInfo } from '../types/beta-feedback.types'

const DEFAULT_VERSION = '0.1.6'
const DEFAULT_CHANNEL: BetaVersionInfo['buildChannel'] = 'beta'

/** Changelog entries for recent versions */
const CHANGELOG: { version: string; date: string; summary: string }[] = [
  {
    version: '0.1.6',
    date: '2026-07-04',
    summary: 'Phase 8: Polish + Deep Link + Keyboard Shortcuts + Release Hardening. 47 type fixes, 6 shortcuts, deeplink-router, command-registry.',
  },
  {
    version: '0.1.5',
    date: '2026-07-04',
    summary: 'Phase 7: Agent Orchestration + Goal Mode + Automations. 20 new files, thread-session bridge, localStorage persistence.',
  },
  {
    version: '0.1.4',
    date: '2026-07-03',
    summary: 'R29.2: DeepSeek modelId canonical fix, chat service reactive ref, dual-input resolution.',
  },
  {
    version: '0.1.3',
    date: '2026-07-03',
    summary: 'R29: Real API verification + Chat error productization + version bump + server release.',
  },
  {
    version: '0.1.2',
    date: '2026-07-03',
    summary: 'R27: Bridge build + server double sync + updater endpoint unification.',
  },
]

/**
 * Get current app version info.
 * Attempts Tauri API first, falls back to hardcoded defaults.
 */
export async function getVersionInfo(): Promise<BetaVersionInfo> {
  let version = DEFAULT_VERSION

  try {
    const app = await import('@tauri-apps/api/app').catch(() => null)
    if (app) {
      version = await app.getVersion()
    }
  } catch {
    // Browser environment — use default
  }

  return {
    appVersion: version,
    buildChannel: DEFAULT_CHANNEL,
    tauriVersion: undefined,
    lastUpdateCheck: undefined,
    updateAvailable: false,
  }
}

/**
 * Get changelog entries, optionally filtered to latest N.
 */
export function getChangelog(limit = 5): typeof CHANGELOG {
  return CHANGELOG.slice(0, limit)
}

/**
 * Get changelog for a specific version.
 */
export function getChangelogForVersion(version: string): string | null {
  const entry = CHANGELOG.find(c => c.version === version)
  return entry ? entry.summary : null
}
