/**
 * Feedback types - Phase 13
 * Real feedback intake, triage, and routing system
 */

export type FeedbackSourceType =
  | 'in-app-user-feedback'
  | 'beta-smoke-result'
  | 'failed-self-heal-task'
  | 'update-failure'
  | 'crash-recovery-note'
  | 'manual-operator-note'

export type FeedbackSeverity = 'critical' | 'high' | 'medium' | 'low'

export type FeedbackReproducibility = 'always' | 'sometimes' | 'once' | 'unknown'

export type RoutedStatus =
  | 'inbox'
  | 'triaged'
  | 'converted-to-task'
  | 'ignored'
  | 'merged'

export interface FeedbackItem {
  feedbackId: string
  sourceType: FeedbackSourceType
  sourceInstanceId?: string
  sourceVersion?: string
  title: string
  content: string
  tags: string[]
  severity: FeedbackSeverity
  reproducibility: FeedbackReproducibility
  relatedThreadId?: string
  relatedTaskId?: string
  relatedClusterId?: string
  createdAt: string
  routedStatus: RoutedStatus
  triagedAt?: string
  triageNote?: string
  convertedTaskId?: string
  mergedIntoId?: string
}

export const SOURCE_TYPE_LABELS: Record<FeedbackSourceType, string> = {
  'in-app-user-feedback': 'In-app Feedback',
  'beta-smoke-result': 'Beta Smoke',
  'failed-self-heal-task': 'Self-Heal Fail',
  'update-failure': 'Update Failure',
  'crash-recovery-note': 'Crash Recovery',
  'manual-operator-note': 'Operator Note',
}

export const ROUTED_STATUS_LABELS: Record<RoutedStatus, string> = {
  inbox: 'Inbox',
  triaged: 'Triaged',
  'converted-to-task': 'Converted',
  ignored: 'Ignored',
  merged: 'Merged',
}

export const SEVERITY_LABELS: Record<FeedbackSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}
