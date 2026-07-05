import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { QualityScore, QualityBreakdown } from '../types'
import { computeTotalScore, findTopDeduction } from '../types'

const STORAGE_KEY = 'lingstack_quality_scores'

function genId(): string {
  return 'qs_' + Date.now()
}
function now(): string { return new Date().toISOString() }
function load<T>(k: string, d: T): T {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d } catch { return d }
}
function save(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
}

export const useQualityScoreStore = defineStore('quality-score', () => {
  const scores = ref<QualityScore[]>(load(STORAGE_KEY, []))

  watch(scores, v => save(STORAGE_KEY, v), { deep: true })

  const latestScore = computed(() => {
    if (scores.value.length === 0) return null
    return [...scores.value].sort((a, b) => b.scoredAt.localeCompare(a.scoredAt))[0]
  })

  const previousScore = computed(() => {
    if (scores.value.length < 2) return null
    const sorted = [...scores.value].sort((a, b) => b.scoredAt.localeCompare(a.scoredAt))
    return sorted[1]
  })

  const scoreTrend = computed((): 'up' | 'down' | 'stable' => {
    const curr = latestScore.value
    const prev = previousScore.value
    if (!curr || !prev) return 'stable'
    if (curr.total > prev.total) return 'up'
    if (curr.total < prev.total) return 'down'
    return 'stable'
  })

  const releaseThreshold = 70

  function computeScore(opts: {
    version: string
    breakdown: QualityBreakdown
    instanceCount: number
    feedbackCount: number
  }): QualityScore {
    const total = computeTotalScore(opts.breakdown)
    const prev = latestScore.value

    const score: QualityScore = {
      total,
      breakdown: opts.breakdown,
      scoreVersion: genId(),
      scoredAt: now(),
      basedOnVersion: opts.version,
      basedOnInstances: opts.instanceCount,
      basedOnFeedbackCount: opts.feedbackCount,
      trend: prev ? (total > prev.total ? 'up' : total < prev.total ? 'down' : 'stable') : 'stable',
      previousTotal: prev?.total,
      topDeduction: findTopDeduction(opts.breakdown),
      releaseThresholdMet: total >= releaseThreshold,
    }
    scores.value.unshift(score)
    return score
  }

  function getScoreHistory(limit = 5): QualityScore[] {
    return [...scores.value].sort((a, b) => b.scoredAt.localeCompare(a.scoredAt)).slice(0, limit)
  }

  function getScoreForVersion(version: string): QualityScore | undefined {
    return scores.value.find(s => s.basedOnVersion === version)
  }

  function seedMockScore() {
    if (scores.value.length > 0) return
    const breakdown065: QualityBreakdown = {
      buildStability: 72, startupReliability: 80, workspaceContinuity: 65,
      threadPersistence: 70, reviewUsability: 60, terminalGitUsability: 55,
      skillRunnerContinuity: 50, updateSuccessRate: 60, feedbackVolume: 70,
      regressionPassRate: 65,
    }
    const breakdown066: QualityBreakdown = {
      buildStability: 78, startupReliability: 85, workspaceContinuity: 72,
      threadPersistence: 78, reviewUsability: 68, terminalGitUsability: 62,
      skillRunnerContinuity: 60, updateSuccessRate: 68, feedbackVolume: 75,
      regressionPassRate: 72,
    }
    const breakdown067: QualityBreakdown = {
      buildStability: 85, startupReliability: 90, workspaceContinuity: 80,
      threadPersistence: 85, reviewUsability: 75, terminalGitUsability: 70,
      skillRunnerContinuity: 72, updateSuccessRate: 75, feedbackVolume: 80,
      regressionPassRate: 78,
    }
    computeScore({ version: '0.1.5', breakdown: breakdown065, instanceCount: 3, feedbackCount: 12 })
    computeScore({ version: '0.1.6', breakdown: breakdown066, instanceCount: 4, feedbackCount: 8 })
    computeScore({ version: '0.1.7', breakdown: breakdown067, instanceCount: 4, feedbackCount: 5 })
  }

  return {
    scores,
    latestScore, previousScore, scoreTrend, releaseThreshold,
    computeScore, getScoreHistory, getScoreForVersion,
    seedMockScore,
  }
})
