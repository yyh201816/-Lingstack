/**
 * Quality Score types - Phase 13
 * Self-bootstrap quantified quality scoring system
 */

export interface QualityBreakdown {
  buildStability: number
  startupReliability: number
  workspaceContinuity: number
  threadPersistence: number
  reviewUsability: number
  terminalGitUsability: number
  skillRunnerContinuity: number
  updateSuccessRate: number
  feedbackVolume: number
  regressionPassRate: number
}

export interface QualityScore {
  total: number
  breakdown: QualityBreakdown
  scoreVersion: string
  scoredAt: string
  basedOnVersion: string
  basedOnInstances: number
  basedOnFeedbackCount: number
  trend: 'up' | 'down' | 'stable'
  previousTotal?: number
  topDeduction: string
  releaseThresholdMet: boolean
}

export const QUALITY_DIMENSIONS: { key: keyof QualityBreakdown; label: string; weight: number }[] = [
  { key: 'buildStability', label: 'Build Stability', weight: 10 },
  { key: 'startupReliability', label: 'Startup Reliability', weight: 10 },
  { key: 'workspaceContinuity', label: 'Workspace Continuity', weight: 10 },
  { key: 'threadPersistence', label: 'Thread Persistence', weight: 10 },
  { key: 'reviewUsability', label: 'Review Usability', weight: 10 },
  { key: 'terminalGitUsability', label: 'Terminal/Git Usability', weight: 10 },
  { key: 'skillRunnerContinuity', label: 'Skill Runner Continuity', weight: 10 },
  { key: 'updateSuccessRate', label: 'Update Success Rate', weight: 10 },
  { key: 'feedbackVolume', label: 'Feedback Volume', weight: 10 },
  { key: 'regressionPassRate', label: 'Regression Pass Rate', weight: 10 },
]

export function computeTotalScore(breakdown: QualityBreakdown): number {
  let total = 0
  for (const dim of QUALITY_DIMENSIONS) {
    total += (breakdown[dim.key] / 100) * dim.weight
  }
  return Math.round(total)
}

export function findTopDeduction(breakdown: QualityBreakdown): string {
  let lowest = 100
  let lowestKey = ''
  for (const dim of QUALITY_DIMENSIONS) {
    if (breakdown[dim.key] < lowest) {
      lowest = breakdown[dim.key]
      lowestKey = dim.label
    }
  }
  return lowest < 80 ? lowestKey : ''
}
