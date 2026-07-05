<script setup lang="ts">
import { onMounted } from 'vue'
import { useQualityScoreStore } from '../store/quality-score.store'
import { QUALITY_DIMENSIONS } from '../types'
import { TrendingUp, TrendingDown, Minus, Award, AlertTriangle, ShieldCheck } from 'lucide-vue-next'

const store = useQualityScoreStore()

onMounted(() => {
  store.seedMockScore()
})

function barColor(v: number): string {
  if (v >= 80) return '#54d88c'
  if (v >= 60) return '#ff9f43'
  return '#ff6b6b'
}

function trendIcon(): string {
  if (store.scoreTrend === 'up') return 'up'
  if (store.scoreTrend === 'down') return 'down'
  return 'stable'
}
</script>

<template>
  <div class="quality-panel">
    <div class="quality-panel__header">
      <div class="quality-panel__title">
        <Award :size="16" />
        <span>Quality Score</span>
      </div>
    </div>

    <template v-if="store.latestScore">
      <!-- Total score -->
      <div class="quality-panel__total-card">
        <div class="quality-panel__total-score" :class="'quality-panel__total-score--' + trendIcon()">
          {{ store.latestScore.total }}
        </div>
        <div class="quality-panel__total-label">
          / 100
          <span v-if="store.previousScore" class="quality-panel__prev">(was {{ store.previousScore.total }})</span>
        </div>
        <div class="quality-panel__trend">
          <TrendingUp v-if="store.scoreTrend === 'up'" :size="14" class="quality-panel__trend--up" />
          <TrendingDown v-else-if="store.scoreTrend === 'down'" :size="14" class="quality-panel__trend--down" />
          <Minus v-else :size="14" />
          {{ store.scoreTrend === 'up' ? 'Improving' : store.scoreTrend === 'down' ? 'Declining' : 'Stable' }}
        </div>
        <div class="quality-panel__version-info">v{{ store.latestScore.basedOnVersion }}  {{ store.latestScore.basedOnInstances }} instances  {{ store.latestScore.basedOnFeedbackCount }} feedbacks</div>
      </div>

      <!-- Release threshold -->
      <div class="quality-panel__threshold" :class="{ 'quality-panel__threshold--met': store.latestScore.releaseThresholdMet, 'quality-panel__threshold--not-met': !store.latestScore.releaseThresholdMet }">
        <ShieldCheck v-if="store.latestScore.releaseThresholdMet" :size="14" />
        <AlertTriangle v-else :size="14" />
        <span>{{ store.latestScore.releaseThresholdMet ? 'Release threshold met' : 'Below release threshold (' + store.releaseThreshold + ')' }}</span>
      </div>

      <!-- Top deduction -->
      <div v-if="store.latestScore.topDeduction" class="quality-panel__deduction">
        <AlertTriangle :size="12" />
        <span>Top issue: {{ store.latestScore.topDeduction }}</span>
      </div>

      <!-- Breakdown -->
      <div class="quality-panel__breakdown">
        <div class="quality-panel__section-title">Breakdown</div>
        <div v-for="dim in QUALITY_DIMENSIONS" :key="dim.key" class="quality-panel__dim">
          <div class="quality-panel__dim-header">
            <span class="quality-panel__dim-label">{{ dim.label }}</span>
            <span class="quality-panel__dim-value" :style="{ color: barColor(store.latestScore.breakdown[dim.key]) }">
              {{ store.latestScore.breakdown[dim.key] }}
            </span>
          </div>
          <div class="quality-panel__dim-bar">
            <div class="quality-panel__dim-fill" :style="{ width: store.latestScore.breakdown[dim.key] + '%', background: barColor(store.latestScore.breakdown[dim.key]) }"></div>
          </div>
        </div>
      </div>

      <!-- History -->
      <div class="quality-panel__history">
        <div class="quality-panel__section-title">History</div>
        <div class="quality-panel__history-list">
          <div v-for="s in store.getScoreHistory(5)" :key="s.scoreVersion" class="quality-panel__history-item">
            <span class="quality-panel__history-ver">v{{ s.basedOnVersion }}</span>
            <span class="quality-panel__history-score" :style="{ color: barColor(s.total) }">{{ s.total }}</span>
            <span class="quality-panel__history-date">{{ s.scoredAt.slice(0, 10) }}</span>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="quality-panel__empty">No quality scores yet</div>
  </div>
</template>

<style scoped>
.quality-panel {
  display: flex; flex-direction: column; height: 100%;
  background: var(--ls-bg-panel, #0b0f18);
  color: var(--ls-text-primary, #c3c9d4);
  overflow-y: auto;
}
.quality-panel__header {
  padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.06);
}
.quality-panel__title {
  display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #a78bfa;
}
.quality-panel__total-card {
  text-align: center; padding: 20px 16px; border-bottom: 1px solid rgba(255,255,255,.04);
}
.quality-panel__total-score { font-size: 48px; font-weight: 800; line-height: 1; }
.quality-panel__total-score--up { color: #54d88c; }
.quality-panel__total-score--down { color: #ff6b6b; }
.quality-panel__total-score--stable { color: #5a93ff; }
.quality-panel__total-label { font-size: 12px; color: #8e96a6; margin-top: 4px; }
.quality-panel__prev { color: #5d667a; }
.quality-panel__trend { display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 11px; color: #8e96a6; margin-top: 4px; }
.quality-panel__trend--up { color: #54d88c; }
.quality-panel__trend--down { color: #ff6b6b; }
.quality-panel__version-info { font-size: 10px; color: #5d667a; margin-top: 4px; }
.quality-panel__threshold {
  display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; margin: 8px 16px;
  border-radius: 6px; font-size: 11px; font-weight: 500;
}
.quality-panel__threshold--met { background: rgba(84,216,140,.08); color: #54d88c; }
.quality-panel__threshold--not-met { background: rgba(255,107,107,.08); color: #ff6b6b; }
.quality-panel__deduction {
  display: flex; align-items: center; gap: 6px; padding: 6px 16px; font-size: 11px; color: #ff9f43;
}
.quality-panel__breakdown { padding: 12px 16px; }
.quality-panel__section-title { font-size: 10px; color: #5d667a; text-transform: uppercase; margin-bottom: 8px; letter-spacing: .04em; }
.quality-panel__dim { margin-bottom: 8px; }
.quality-panel__dim-header { display: flex; justify-content: space-between; margin-bottom: 2px; }
.quality-panel__dim-label { font-size: 11px; }
.quality-panel__dim-value { font-size: 11px; font-weight: 600; }
.quality-panel__dim-bar { height: 4px; background: rgba(255,255,255,.05); border-radius: 2px; overflow: hidden; }
.quality-panel__dim-fill { height: 100%; border-radius: 2px; transition: width .4s ease; }
.quality-panel__history { padding: 12px 16px; border-top: 1px solid rgba(255,255,255,.04); }
.quality-panel__history-list { display: flex; flex-direction: column; gap: 4px; }
.quality-panel__history-item { display: flex; justify-content: space-between; font-size: 11px; padding: 4px 0; }
.quality-panel__history-ver { color: #5d667a; }
.quality-panel__history-score { font-weight: 600; }
.quality-panel__history-date { color: #5d667a; font-size: 10px; }
.quality-panel__empty { text-align: center; color: #5d667a; padding: 20px; font-size: 12px; }
</style>
