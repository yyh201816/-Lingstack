/**
 * release-strategy.store.ts — Phase 14
 * Release channel, strategy, and staged rollout management
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ReleasePlan, ReleaseChannel, ReleaseStrategyType, RolloutState } from '../types'

const STORAGE_KEY = 'lingstack_release_plans'
const CURRENT_CHANNEL_KEY = 'lingstack_current_channel'

function loadPlans(): ReleasePlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ReleasePlan[]
  } catch {
    return []
  }
}

function savePlans(plans: ReleasePlan[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans))
}

function loadCurrentChannel(): ReleaseChannel {
  try {
    const raw = localStorage.getItem(CURRENT_CHANNEL_KEY)
    if (raw) return raw as ReleaseChannel
  } catch { /* ignore */ }
  return 'beta'
}

function saveCurrentChannel(channel: ReleaseChannel) {
  localStorage.setItem(CURRENT_CHANNEL_KEY, channel)
}

function pid(): string {
  return `rp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export const useReleaseStrategyStore = defineStore('releaseStrategy', () => {
  const plans = ref<ReleasePlan[]>(loadPlans())
  const currentChannel = ref<ReleaseChannel>(loadCurrentChannel())
  const selectedPlanId = ref<string | null>(null)

  // ── computed ──

  const activePlans = computed(() => plans.value.filter(p => p.status === 'active'))
  const plansByChannel = computed(() => {
    const map: Record<string, ReleasePlan[]> = {}
    for (const p of plans.value) {
      if (!map[p.channel]) map[p.channel] = []
      map[p.channel].push(p)
    }
    return map
  })

  /**
   * Get the currently effective release plan for a given channel.
   * Returns the first active staged-rollout, then first active in any strategy.
   */
  function effectivePlan(channel?: ReleaseChannel): ReleasePlan | null {
    const ch = channel ?? currentChannel.value
    const channelPlans = plans.value.filter(p => p.channel === ch && (p.status === 'active' || p.status === 'planned'))
    if (channelPlans.length === 0) return null
    // Prefer staged-rollout
    const staged = channelPlans.find(p => p.strategyType === 'staged-rollout' && p.status === 'active')
    if (staged) return staged
    // Then any active
    const active = channelPlans.find(p => p.status === 'active')
    if (active) return active
    // Then planned
    return channelPlans[0]
  }

  // ── actions ──

  function createPlan(
    version: string,
    channel: ReleaseChannel,
    strategyType: ReleaseStrategyType,
    opts?: {
      targetCohorts?: string[]
      targetUsers?: string[]
      targetInstances?: string[]
      rolloutPercent?: number
      notes?: string
      iterationId?: string
      regressionChecklistId?: string
    },
  ): ReleasePlan {
    const now = new Date().toISOString()
    const plan: ReleasePlan = {
      releasePlanId: pid(),
      version,
      channel,
      strategyType,
      targetCohorts: opts?.targetCohorts ?? [],
      targetUsers: opts?.targetUsers ?? [],
      targetInstances: opts?.targetInstances ?? [],
      rolloutPercent: opts?.rolloutPercent ?? 0,
      status: 'planned',
      notes: opts?.notes ?? '',
      iterationId: opts?.iterationId,
      regressionChecklistId: opts?.regressionChecklistId,
      createdAt: now,
      activatedAt: null,
      pausedAt: null,
      completedAt: null,
      updatedAt: now,
    }
    plans.value.unshift(plan)
    savePlans(plans.value)
    return plan
  }

  function updatePlan(id: string, patch: Partial<ReleasePlan>) {
    const idx = plans.value.findIndex(p => p.releasePlanId === id)
    if (idx === -1) return null
    plans.value[idx] = {
      ...plans.value[idx],
      ...patch,
      releasePlanId: plans.value[idx].releasePlanId,
      createdAt: plans.value[idx].createdAt,
      updatedAt: new Date().toISOString(),
    }
    savePlans(plans.value)
    return plans.value[idx]
  }

  function activatePlan(id: string) {
    const now = new Date().toISOString()
    return updatePlan(id, { status: 'active', activatedAt: now, pausedAt: null })
  }

  function pausePlan(id: string) {
    const now = new Date().toISOString()
    return updatePlan(id, { status: 'paused', pausedAt: now })
  }

  function completePlan(id: string) {
    const now = new Date().toISOString()
    return updatePlan(id, { status: 'completed', completedAt: now })
  }

  function abortPlan(id: string) {
    const now = new Date().toISOString()
    return updatePlan(id, { status: 'aborted', completedAt: now, notes: plans.value.find(p => p.releasePlanId === id)?.notes + ' [ABORTED]' })
  }

  function setRolloutPercent(id: string, percent: number) {
    return updatePlan(id, { rolloutPercent: Math.min(100, Math.max(0, percent)) })
  }

  function removePlan(id: string) {
    plans.value = plans.value.filter(p => p.releasePlanId !== id)
    if (selectedPlanId.value === id) selectedPlanId.value = null
    savePlans(plans.value)
  }

  function setCurrentChannel(channel: ReleaseChannel) {
    currentChannel.value = channel
    saveCurrentChannel(channel)
  }

  function selectPlan(id: string | null) {
    selectedPlanId.value = id
  }

  /**
   * Check whether a user/cohort/instance should receive this release plan.
   */
  function isTargeted(
    plan: ReleasePlan,
    opts: { userId?: string; cohortId?: string; instanceId?: string },
  ): boolean {
    if (plan.strategyType === 'all-users') return true
    if (plan.strategyType === 'selected-cohort' && opts.cohortId) {
      return plan.targetCohorts.includes(opts.cohortId)
    }
    if (plan.strategyType === 'selected-users' && opts.userId) {
      return plan.targetUsers.includes(opts.userId)
    }
    if (plan.strategyType === 'selected-instances' && opts.instanceId) {
      return plan.targetInstances.includes(opts.instanceId)
    }
    if (plan.strategyType === 'staged-rollout') {
      // Hash-based deterministic rollout: use userId or instanceId to compute a stable bucket
      const seed = opts.userId ?? opts.instanceId ?? 'default'
      const hash = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
      return (hash % 100) < plan.rolloutPercent
    }
    return false
  }

  function seedMockPlans() {
    if (plans.value.length > 0) return
    const now = new Date().toISOString()
    const mock: ReleasePlan[] = [
      {
        releasePlanId: 'rp_mock_001',
        version: '0.1.6',
        channel: 'beta',
        strategyType: 'selected-cohort',
        targetCohorts: ['internal-core', 'internal-dev'],
        targetUsers: [],
        targetInstances: [],
        rolloutPercent: 0,
        status: 'active',
        notes: 'Beta rollout to internal team for Phase 11 testing',
        createdAt: '2026-07-03T08:00:00.000Z',
        activatedAt: '2026-07-03T08:30:00.000Z',
        pausedAt: null,
        completedAt: null,
        updatedAt: now,
      },
      {
        releasePlanId: 'rp_mock_002',
        version: '0.1.6',
        channel: 'beta',
        strategyType: 'staged-rollout',
        targetCohorts: [],
        targetUsers: [],
        targetInstances: [],
        rolloutPercent: 30,
        status: 'planned',
        notes: 'Staged rollout to 30% of trusted-beta cohort, pending smoke verification',
        createdAt: '2026-07-04T06:00:00.000Z',
        activatedAt: null,
        pausedAt: null,
        completedAt: null,
        updatedAt: now,
      },
    ]
    plans.value = mock
    savePlans(plans.value)
  }

  return {
    plans,
    currentChannel,
    selectedPlanId,
    activePlans,
    plansByChannel,
    effectivePlan,
    createPlan,
    updatePlan,
    activatePlan,
    pausePlan,
    completePlan,
    abortPlan,
    setRolloutPercent,
    removePlan,
    setCurrentChannel,
    selectPlan,
    isTargeted,
    seedMockPlans,
  }
})
