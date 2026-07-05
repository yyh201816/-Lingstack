<script setup lang="ts">
import { useBetaIterationStore } from '../store/beta-iteration.store'
import { Shield, Check, X, Minus, AlertTriangle } from 'lucide-vue-next'

const store = useBetaIterationStore()

function cycle(id: string) {
  const g = store.gateItems.find(x => x.id === id)
  if (!g) return
  const order: Array<'todo'|'pass'|'fail'|'partial'> = ['todo','pass','fail','partial']
  const idx = order.indexOf(g.status as any)
  g.status = order[(idx + 1) % order.length] as any
}

const icon = (s: string) => s === 'pass' ? Check : s === 'fail' ? X : s === 'partial' ? Minus : AlertTriangle
const iCls = (s: string) => `bgc__item-icon bgc__item-icon--${s}`
</script>

<template>
  <div class="bgc">
    <div class="bgc__header">
      <Shield :size="15" style="color:var(--ls-accent,#5a93ff)" />
      <h2 class="bgc__title">Release Gate Checklist</h2>
    </div>
    <div class="bgc__summary">
      {{ store.gatePassCount }}/{{ store.gateItems.length }} passed
    </div>
    <div class="bgc__list">
      <button
        v-for="g in store.gateItems"
        :key="g.id"
        :class="['bgc__item', `bgc__item--${g.status}`]"
        @click="cycle(g.id)"
      >
        <component :is="icon(g.status)" :size="12" :class="iCls(g.status)" />
        <span class="bgc__item-label">{{ g.label }}</span>
        <span v-if="g.detail" class="bgc__item-detail">{{ g.detail }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.bgc{display:flex;flex-direction:column;height:100%;overflow-y:auto;padding:16px;user-select:none}
.bgc__header{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.bgc__title{font-size:14px;font-weight:600;color:var(--ls-text-primary,#e9edf6);margin:0}
.bgc__summary{font-size:11px;color:var(--ls-text-hint,#5d667a);margin-bottom:12px}
.bgc__list{display:flex;flex-direction:column;gap:3px}
.bgc__item{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:6px;border:none;background:transparent;cursor:pointer;text-align:left;width:100%;transition:background .12s}
.bgc__item:hover{background:rgba(255,255,255,.03)}
.bgc__item--pass .bgc__item-label{color:#54d88c}
.bgc__item--fail .bgc__item-label{color:#ff6b6b}
.bgc__item-label{font-size:12px;color:var(--ls-text-secondary,#c3c9d4)}
.bgc__item-detail{font-size:10px;color:var(--ls-text-hint,#5d667a);margin-left:auto}
.bgc__item-icon--pass{color:#54d88c}
.bgc__item-icon--fail{color:#ff6b6b}
.bgc__item-icon--partial{color:#ffd463}
.bgc__item-icon--todo{color:var(--ls-text-hint,#5d667a)}
</style>
