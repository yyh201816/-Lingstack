<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useBetaIterationStore } from '../store/beta-iteration.store'
import { useBootstrapStore } from '@/features/bootstrap/store/bootstrap.store'
import { computeReleaseDecision } from '../services/beta-gate.service'
import { Rocket, Shield, AlertTriangle, Check, X } from 'lucide-vue-next'

const biStore = useBetaIterationStore()
const bootstrap = useBootstrapStore()

const decision = computed(() => computeReleaseDecision())

onMounted(() => {
  biStore.iterations
})
</script>

<template>
  <div class="brc">
    <div class="brc__header">
      <Rocket :size="15" style="color:var(--ls-accent,#5a93ff)" />
      <h2 class="brc__title">Release Candidate</h2>
    </div>

    <!-- Decision -->
    <div :class="['brc__decision', `brc__decision--${decision.conclusion}`]">
      <Check v-if="decision.conclusion === 'ready'" :size="16" />
      <AlertTriangle v-else-if="decision.conclusion === 'partial'" :size="16" />
      <X v-else :size="16" />
      <div>
        <p class="brc__decision-title">
          {{ decision.conclusion === 'ready' ? 'Ready to Release' : decision.conclusion === 'partial' ? 'Partially Ready' : 'Blocked' }}
        </p>
        <p v-if="decision.reasons.length > 0" class="brc__decision-reasons">
          {{ decision.reasons.join('; ') }}
        </p>
      </div>
    </div>

    <!-- Blockers -->
    <div v-if="decision.blockedBy.length > 0" class="brc__blockers">
      <p class="brc__section-label">Blockers</p>
      <ul class="brc__blocker-list">
        <li v-for="b in decision.blockedBy" :key="b" class="brc__blocker-item">{{ b }}</li>
      </ul>
    </div>

    <!-- Checklist Summary -->
    <div class="brc__checklist-summary">
      <Shield :size="12" style="color:var(--ls-text-hint,#5d667a)" />
      <span>Gate: {{ biStore.gatePassCount }}/{{ biStore.gateItems.length }}</span>
      <span class="brc__sep">| Regr: {{ biStore.regrPassCount }}/{{ biStore.regressionItems.length }}</span>
      <span class="brc__sep">| Bootstrap: {{ bootstrap.queueSize }} active</span>
    </div>

    <!-- P0 Warning -->
    <div v-if="bootstrap.p0Items.length > 0" class="brc__p0-warn">
      {{ bootstrap.p0Items.length }} P0 bootstrap task(s) block release
    </div>

    <!-- Current Iteration -->
    <div v-if="biStore.current" class="brc__current-iter">
      <p class="brc__section-label">Current Iteration</p>
      <div class="brc__iter-card">
        <span class="brc__iter-version">{{ biStore.current.version }}</span>
        <span class="brc__iter-status">{{ biStore.current.status }}</span>
      </div>
    </div>

    <!-- No Iteration -->
    <div v-if="!biStore.current" class="brc__empty">
      <Rocket :size="28" stroke-width="1.2" class="brc__empty-icon" />
      <p class="brc__empty-title">No active beta iteration</p>
      <p class="brc__empty-desc">Create an iteration and complete the checklists to assess release readiness.</p>
    </div>
  </div>
</template>

<style scoped>
.brc{display:flex;flex-direction:column;height:100%;overflow-y:auto;padding:16px;user-select:none}
.brc__header{display:flex;align-items:center;gap:8px;margin-bottom:14px}
.brc__title{font-size:14px;font-weight:600;color:var(--ls-text-primary,#e9edf6);margin:0}
.brc__decision{display:flex;align-items:flex-start;gap:10px;padding:14px;border-radius:10px;margin-bottom:14px}
.brc__decision--ready{background:rgba(84,216,140,.08);border:1px solid rgba(84,216,140,.15)}
.brc__decision--partial{background:rgba(255,212,99,.06);border:1px solid rgba(255,212,99,.12)}
.brc__decision--blocked{background:rgba(255,107,107,.06);border:1px solid rgba(255,107,107,.12)}
.brc__decision--ready .brc__decision-title{color:#54d88c}
.brc__decision--partial .brc__decision-title{color:#ffd463}
.brc__decision--blocked .brc__decision-title{color:#ff6b6b}
.brc__decision-title{font-size:14px;font-weight:600;margin:0}
.brc__decision-reasons{font-size:11px;color:var(--ls-text-hint,#5d667a);margin:4px 0 0}
.brc__blockers{margin-bottom:14px}
.brc__section-label{font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--ls-text-hint,#5d667a);margin:0 0 8px;font-weight:500}
.brc__blocker-list{margin:0;padding-left:16px}
.brc__blocker-item{font-size:11px;color:#ff6b6b;line-height:1.6}
.brc__checklist-summary{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--ls-text-secondary,#c3c9d4);margin-bottom:14px}
.brc__sep{color:var(--ls-text-hint,#5d667a)}
.brc__p0-warn{padding:8px 12px;border-radius:6px;background:rgba(255,107,107,.08);color:#ff6b6b;font-size:11px;font-weight:500;margin-bottom:14px}
.brc__current-iter{margin-bottom:14px}
.brc__iter-card{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;border:1px solid rgba(90,147,255,.15);background:rgba(90,147,255,.04)}
.brc__iter-version{font-size:13px;font-weight:600;color:var(--ls-accent,#5a93ff);font-family:monospace}
.brc__iter-status{font-size:10px;padding:1px 7px;border-radius:999px;background:rgba(90,147,255,.12);color:#5a93ff}
.brc__empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center}
.brc__empty-icon{color:var(--ls-text-hint,#5d667a);margin-bottom:12px;opacity:.5}
.brc__empty-title{font-size:13px;font-weight:600;color:var(--ls-text-secondary,#c3c9d4);margin:0 0 6px}
.brc__empty-desc{font-size:11px;color:var(--ls-text-hint,#5d667a);margin:0;max-width:280px;line-height:1.5}
</style>
