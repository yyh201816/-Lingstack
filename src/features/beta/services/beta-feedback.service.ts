/**
 * Beta Feedback Service
 * Handles feedback export and (future) sync to remote endpoint.
 * Phase 9: local export to JSON file. Remote sync is a bridge/mock.
 */

import type { BetaFeedbackItem } from '../types/beta-feedback.types'

const EXPORT_FILENAME_PREFIX = 'lingstack-feedback'

/**
 * Export feedbacks to a JSON file download (browser) or return JSON string (Tauri).
 */
export function exportFeedbacksToJson(feedbacks: BetaFeedbackItem[]): string {
  const payload = {
    exportedAt: new Date().toISOString(),
    count: feedbacks.length,
    items: feedbacks,
  }
  return JSON.stringify(payload, null, 2)
}

/**
 * Trigger a browser download of the feedback JSON.
 */
export function downloadFeedbacks(feedbacks: BetaFeedbackItem[]): void {
  const json = exportFeedbacksToJson(feedbacks)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${EXPORT_FILENAME_PREFIX}-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Attempt to sync a single feedback to a remote endpoint.
 * Phase 9: bridge/mock — logs to console, marks as synced.
 * Future: POST to a real server endpoint.
 */
export async function syncFeedbackToRemote(feedback: BetaFeedbackItem): Promise<{ success: boolean; error?: string }> {
  try {
    // Bridge: simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 300))

    // TODO Phase 10: replace with real POST
    // await fetch('https://ai.tadanpay.cn/api/feedback', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(feedback),
    // })

    console.log('[BetaFeedback] Synced (bridge):', feedback.id)
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[BetaFeedback] Sync failed:', message)
    return { success: false, error: message }
  }
}

/**
 * Build a human-readable summary of a feedback item.
 */
export function formatFeedbackSummary(fb: BetaFeedbackItem): string {
  const parts = [
    `[${fb.type.toUpperCase()}] ${fb.title}`,
    fb.description ? `\n${fb.description}` : '',
    fb.currentThreadId ? `\nThread: ${fb.currentThreadId}` : '',
    fb.currentProjectId ? `\nProject: ${fb.currentProjectId}` : '',
    `\nVersion: ${fb.appVersion} | Status: ${fb.status}`,
  ]
  return parts.filter(Boolean).join('')
}
