<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useReleaseStrategyStore } from '../store/release-strategy.store'
import { RELEASE_CHANNEL_LABELS, RELEASE_STRATEGY_LABELS, ROLLOUT_STATE_LABELS } from '../types'
import type { ReleaseChannel, ReleaseStrategyType, ReleasePlan } from '../types'
import { useBetaIterationStore } from '@/features/beta/store/beta-iteration.store'
import {
  Rocket, Layers, Users, Target, Percent, Play, Pause, Check, X,
  ChevronDown, Plus, RefreshCw,
} from 'lucide-vue-next'

const store = useReleaseStrategyStore()
const iterationStore = useBetaIterationStore()

const expandedId = ref<string | null>(null)
const showCreateForm = ref(false)
const newPlan = ref({
  version: '0.1.7',
  channel: 'beta' as ReleaseChannel,
  strategyType: 'selected-cohort' as ReleaseStrategyType,
  targetCohorts: [] as string[],
  rolloutPercent: 0,
  notes: '',
  iterationId: '',
})

onMounted(() => {
  store.seedMockPlans()
})

const channels: ReleaseChannel[] = ['nightly', 'alpha', 'beta', 'rc', 'stable-internal']
const strategies: ReleaseStrategyType[] = ['all-users', 'selected-cohort', 'selected-users', 'selected-instances', 'staged-rollout']
const cohorts: string[] = ['internal-core', 'internal-dev', 'trusted-beta', 'wider-beta']

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function stateClass(s: string): string {
  switch (s) {
    case 'active': return 'state--active'
    case 'planned': return 'state--planned'
    case 'paused': return 'state--paused'
    case 'completed': return 'state--done'
    case 'aborted': return 'state--err'
    default: return ''
  }
}

function isStagedRollout(plan: ReleasePlan): boolean {
  return plan.strategyType === 'staged-rollout'
}

function toggleCohort(id: string) {
  const idx = newPlan.value.targetCohorts.indexOf(id)
  if (idx >= 0) {
    newPlan.value.targetCohorts.splice(idx, 1)
  } else {
    newPlan.value.targetCohorts.push(id)
  }
}

function handleCreate() {
  if (!newPlan.value.version.trim()) return
  store.createPlan(
    newPlan.value.version.trim(),
    newPlan.value.channel,
    newPlan.value.strategyType,
    {
      targetCohorts: newPlan.value.targetCohorts,
      rolloutPercent: newPlan.value.rolloutPercent,
      notes: newPlan.value.notes,
      iterationId: newPlan.value.iterationId || undefined,
    },
  )
  newPlan.value = { version: '0.1.7', channel: 'beta', strategyType: 'selected-cohort', targetCohorts: [], rolloutPercent: 0, notes: '', iterationId: '' }
  showCreateForm.value = false
}
</script>

<template>
  <div class="strategy-panel">
    <div class="panel__header">
      <div class="panel__title">
        <Rocket :size="15" />
        <span>Release Strategy</span>
      </div>
      <div class="panel__header-actions">
        <button class="panel__btn panel__btn--ghost" @click="store.seedMockPlans" title="Reload seed data">
          <RefreshCw :size="12" />
        </button>
        <button class="panel__btn panel__btn--primary" @click="showCreateForm = !showCreateForm">
          <Plus :size="13" />
          <span>New Plan</span>
        </button>
      </div>
    </div>

    <!-- Current channel indicator -->
    <div class="panel__current-channel">
      <Layers :size="12" />
      <span>Current: <strong>{{ RELEASE_CHANNEL_LABELS[store.currentChannel] }}</strong></span>
      <select
        class="panel__select"
        :value="store.currentChannel"
        @change="(e: Event) => store.setCurrentChannel((e.target as HTMLSelectElement).value as ReleaseChannel)"
      >
        <option v-for="ch of channels" :key="ch" :value="ch">{{ RELEASE_CHANNEL_LABELS[ch] }}</option>
      </select>
    </div>

    <!-- Active plans summary -->
    <div class="panel__active-summary">
      <div class="panel__summary-card" v-for="plan in store.activePlans" :key="plan.releasePlanId">
        <span class="panel__summary-version">{{ plan.version }}</span>
        <span class="panel__summary-channel">{{ RELEASE_CHANNEL_LABELS[plan.channel] }}</span>
        <span class="panel__summary-strategy">{{ RELEASE_STRATEGY_LABELS[plan.strategyType] }}</span>
        <span v-if="isStagedRollout(plan)" class="panel__summary-pct">{{ plan.rolloutPercent }}%</span>
      </div>
      <div v-if="store.activePlans.length === 0" class="panel__summary-empty">No active release plans</div>
    </div>

    <!-- Create form -->
    <div v-if="showCreateForm" class="panel__create-form">
      <div class="panel__form-row">
        <label>Version</label>
        <input v-model="newPlan.version" class="panel__input" placeholder="0.1.7" />
      </div>
      <div class="panel__form-row">
        <label>Channel</label>
        <select v-model="newPlan.channel" class="panel__select">
          <option v-for="ch of channels" :key="ch" :value="ch">{{ RELEASE_CHANNEL_LABELS[ch] }}</option>
        </select>
      </div>
      <div class="panel__form-row">
        <label>Strategy</label>
        <select v-model="newPlan.strategyType" class="panel__select">
          <option v-for="s of strategies" :key="s" :value="s">{{ RELEASE_STRATEGY_LABELS[s] }}</option>
        </select>
      </div>
      <div class="panel__form-row" v-if="newPlan.strategyType === 'selected-cohort'">
        <label>Cohorts</label>
        <div class="panel__cohort-tags">
          <button
            v-for="c of cohorts" :key="c"
            class="panel__cohort-tag"
            :class="{ 'panel__cohort-tag--active': newPlan.targetCohorts.includes(c) }"
            @click="toggleCohort(c)"
          >
            {{ c }}
          </button>
        </div>
      </div>
      <div class="panel__form-row" v-if="newPlan.strategyType === 'staged-rollout'">
        <label>Rollout %</label>
        <input v-model.number="newPlan.rolloutPercent" type="range" min="0" max="100" class="panel__range" />
        <span class="panel__pct-label">{{ newPlan.rolloutPercent }}%</span>
      </div>
      <div class="panel__form-row">
        <label>Notes</label>
        <input v-model="newPlan.notes" class="panel__input" placeholder="Release notes..." />
      </div>
      <div class="panel__form-actions">
        <button class="panel__btn panel__btn--primary" @click="handleCreate">Create Plan</button>
        <button class="panel__btn panel__btn--ghost" @click="showCreateForm = false">Cancel</button>
      </div>
    </div>

    <!-- Plan list -->
    <div class="panel__list">
      <div
        v-for="plan in store.plans" :key="plan.releasePlanId"
        class="panel__plan"
        @click="toggleExpand(plan.releasePlanId)"
      >
        <div class="panel__plan-top">
          <span class="panel__plan-dot" :class="stateClass(plan.status)"></span>
          <span class="panel__plan-version">v{{ plan.version }}</span>
          <span class="panel__plan-channel">{{ RELEASE_CHANNEL_LABELS[plan.channel] }}</span>
          <span class="panel__plan-strategy">{{ RELEASE_STRATEGY_LABELS[plan.strategyType] }}</span>
          <span v-if="isStagedRollout(plan)" class="panel__plan-pct">{{ plan.rolloutPercent }}%</span>
          <ChevronDown :size="12" class="panel__chevron" :class="{ 'panel__chevron--open': expandedId === plan.releasePlanId }" />
        </div>

        <div v-if="expandedId === plan.releasePlanId" class="panel__plan-detail" @click.stop>
          <div class="panel__detail-row"><span>Status</span><span :class="stateClass(plan.status)">{{ ROLLOUT_STATE_LABELS[plan.status] }}</span></div>
          <div class="panel__detail-row"><span>Created</span><span>{{ plan.createdAt.slice(0, 10) }}</span></div>
          <div class="panel__detail-row" v-if="plan.activatedAt"><span>Activated</span><span>{{ plan.activatedAt.slice(0, 16).replace('T', ' ') }}</span></div>
          <div class="panel__detail-row" v-if="plan.pausedAt"><span>Paused</span><span>{{ plan.pausedAt.slice(0, 16).replace('T', ' ') }}</span></div>
          <div class="panel__detail-row" v-if="plan.notes"><span>Notes</span><span class="panel__detail-notes">{{ plan.notes }}</span></div>
          <div class="panel__detail-row" v-if="plan.targetCohorts.length">
            <span>Cohorts</span>
            <span class="panel__detail-tags">
              <span v-for="c of plan.targetCohorts" :key="c" class="panel__tag">{{ c }}</span>
            </span>
          </div>

          <!-- Staged rollout slider -->
          <div v-if="isStagedRollout(plan)" class="panel__rollout-row">
            <span>Rollout</span>
            <input
              type="range" min="0" max="100"
              :value="plan.rolloutPercent"
              @input="(e: Event) => store.setRolloutPercent(plan.releasePlanId, +(e.target as HTMLInputElement).value)"
              class="panel__range"
            />
            <span class="panel__pct-label">{{ plan.rolloutPercent }}%</span>
          </div>

          <div class="panel__detail-actions">
            <button v-if="plan.status === 'planned'" class="panel__btn panel__btn--primary" @click="store.activatePlan(plan.releasePlanId)"><Play :size="11" /> Activate</button>
            <button v-if="plan.status === 'active'" class="panel__btn panel__btn--ghost" @click="store.pausePlan(plan.releasePlanId)"><Pause :size="11" /> Pause</button>
            <button v-if="plan.status === 'paused'" class="panel__btn panel__btn--primary" @click="store.activatePlan(plan.releasePlanId)"><Play :size="11" /> Resume</button>
            <button v-if="plan.status === 'active' || plan.status === 'paused'" class="panel__btn panel__btn--ghost" @click="store.completePlan(plan.releasePlanId)"><Check :size="11" /> Complete</button>
            <button v-if="plan.status !== 'completed' && plan.status !== 'aborted'" class="panel__btn panel__btn--ghost" @click="store.abortPlan(plan.releasePlanId)"><X :size="11" /> Abort</button>
          </div>
        </div>
      </div>
      <div v-if="store.plans.length === 0" class="panel__empty">No release plans yet</div>
    </div>
  </div>
</template>

<style scoped>
.strategy-panel {
  display: flex; flex-direction: column; height: 100%;
  background: var(--ls-bg-panel, #0b0f18);
  color: var(--ls-text-primary, #c3c9d4);
  overflow-y: auto;
}
.panel__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,.06);
}
.panel__title {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 600; color: var(--ls-accent, #5a93ff);
}
.panel__header-actions { display: flex; gap: 6px; }
.panel__current-channel {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; font-size: 11px; color: #8e96a6;
  border-bottom: 1px solid rgba(255,255,255,.04);
}
.panel__current-channel strong { color: var(--ls-accent, #5a93ff); }
.panel__active-summary { padding: 8px 16px; border-bottom: 1px solid rgba(255,255,255,.04); display: flex; flex-wrap: wrap; gap: 6px; }
.panel__summary-card {
  display: inline-flex; gap: 6px; align-items: center;
  background: rgba(90,147,255,.06); border: 1px solid rgba(90,147,255,.12);
  border-radius: 8px; padding: 4px 10px; font-size: 11px;
}
.panel__summary-version { font-weight: 600; color: #5a93ff; }
.panel__summary-channel { color: #8e96a6; }
.panel__summary-strategy { color: #c3c9d4; }
.panel__summary-pct { color: #ff9f43; font-weight: 600; }
.panel__summary-empty { font-size: 11px; color: #5d667a; padding: 4px 0; }
.panel__create-form {
  padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,.04);
  display: flex; flex-direction: column; gap: 8px;
}
.panel__form-row { display: flex; align-items: center; gap: 8px; font-size: 11px; }
.panel__form-row label { color: #5d667a; min-width: 70px; }
.panel__cohort-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.panel__cohort-tag {
  font-size: 10px; padding: 2px 8px; border-radius: 6px;
  border: 1px solid rgba(255,255,255,.08); background: transparent;
  color: #8e96a6; cursor: pointer; transition: all .12s;
}
.panel__cohort-tag--active { background: rgba(90,147,255,.12); border-color: rgba(90,147,255,.2); color: #5a93ff; }
.panel__form-actions { display: flex; gap: 6px; }
.panel__range { flex: 1; accent-color: #5a93ff; }
.panel__pct-label { font-size: 11px; font-weight: 600; color: #ff9f43; min-width: 32px; text-align: right; }
.panel__filters { display: flex; gap: 4px; padding: 6px 16px; border-bottom: 1px solid rgba(255,255,255,.04); }
.panel__filter-btn {
  font-size: 10px; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,.06);
  background: transparent; color: #8e96a6; cursor: pointer;
}
.panel__filter-btn--active, .panel__filter-btn:hover { background: rgba(90,147,255,.1); color: #5a93ff; border-color: rgba(90,147,255,.2); }
.panel__list { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 16px 16px; }
.panel__plan {
  border: 1px solid rgba(255,255,255,.05); border-radius: 8px; padding: 8px 10px; margin-bottom: 4px;
  cursor: pointer; transition: background .1s;
}
.panel__plan:hover { background: rgba(255,255,255,.02); }
.panel__plan-top { display: flex; align-items: center; gap: 8px; }
.panel__plan-dot { width: 6px; height: 6px; border-radius: 999px; flex-shrink: 0; }
.state--active { background: #54d88c; }
.state--planned { background: rgba(90,147,255,.5); }
.state--paused { background: #ff9f43; }
.state--done { background: #5d667a; }
.state--err { background: #ff6b6b; }
.panel__plan-version { font-size: 12px; font-weight: 600; }
.panel__plan-channel { font-size: 10px; color: #5d667a; background: rgba(255,255,255,.04); padding: 1px 6px; border-radius: 4px; }
.panel__plan-strategy { font-size: 10px; color: #8e96a6; }
.panel__plan-pct { font-size: 10px; color: #ff9f43; font-weight: 600; }
.panel__chevron { color: #5d667a; transition: transform .15s; flex-shrink: 0; margin-left: auto; }
.panel__chevron--open { transform: rotate(180deg); }
.panel__plan-detail {
  margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,.04);
  display: flex; flex-direction: column; gap: 4px;
}
.panel__detail-row { display: flex; justify-content: space-between; font-size: 11px; align-items: center; }
.panel__detail-row span:first-child { color: #5d667a; }
.panel__detail-notes { color: #8e96a6; font-style: italic; }
.panel__detail-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.panel__tag { font-size: 9px; padding: 1px 5px; border-radius: 4px; background: rgba(90,147,255,.1); color: #5a93ff; }
.panel__rollout-row { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #5d667a; margin-top: 4px; }
.panel__detail-actions { display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
.panel__btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; padding: 3px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,.08);
  background: transparent; color: #c3c9d4; cursor: pointer; transition: all .12s;
}
.panel__btn:hover { background: rgba(255,255,255,.04); }
.panel__btn--primary { background: rgba(90,147,255,.12); border-color: rgba(90,147,255,.2); color: #5a93ff; }
.panel__btn--primary:hover { background: rgba(90,147,255,.18); }
.panel__btn--ghost { border-color: transparent; color: #8e96a6; }
.panel__input {
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
  border-radius: 6px; padding: 4px 8px; font-size: 11px; color: #c3c9d4;
  min-width: 0; flex: 1;
}
.panel__select {
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
  border-radius: 6px; padding: 3px 6px; font-size: 10px; color: #c3c9d4;
}
.panel__empty { text-align: center; color: #5d667a; padding: 24px; font-size: 12px; }
</style>
