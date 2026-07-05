<script setup lang="ts">
import { useBetaIterationStore } from '../store/beta-iteration.store'
import { CheckSquare, Check, X } from 'lucide-vue-next'

const store = useBetaIterationStore()

function toggle(id: string) {
  const r = store.regressionItems.find(x => x.id === id)
  if (!r) return
  r.status = r.status === 'pass' ? 'fail' : 'pass'
}

const areaLabel = (a: string) => {
  const m: Record<string,string> = { thread:'Thread', review:'Review', terminal:'Terminal', git:'Git', skills:'Skills', feedback:'Feedback', settings:'Settings', shortcuts:'Shortcuts', build:'Build', other:'Other' }
  return m[a] || a
}
</script>

<template>
  <div class="regr">
    <div class="regr__header">
      <CheckSquare :size="15" style="color:var(--ls-accent,#5a93ff)" />
      <h2 class="regr__title">Regression Checklist</h2>
    </div>
    <div class="regr__summary">{{ store.regrPassCount }}/{{ store.regressionItems.length }} checked</div>
    <div class="regr__list">
      <button
        v-for="r in store.regressionItems"
        :key="r.id"
        :class="['regr__item', `regr__item--${r.status}`]"
        @click="toggle(r.id)"
      >
        <Check v-if="r.status === 'pass'" :size="12" class="regr__icon--pass" />
        <X v-else :size="12" class="regr__icon--fail" />
        <span class="regr__item-label">{{ r.label }}</span>
        <span class="regr__item-area">{{ areaLabel(r.area) }}</span>
        <span v-if="r.note" class="regr__item-note">{{ r.note }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.regr{display:flex;flex-direction:column;height:100%;overflow-y:auto;padding:16px;user-select:none}
.regr__header{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.regr__title{font-size:14px;font-weight:600;color:var(--ls-text-primary,#e9edf6);margin:0}
.regr__summary{font-size:11px;color:var(--ls-text-hint,#5d667a);margin-bottom:12px}
.regr__list{display:flex;flex-direction:column;gap:3px}
.regr__item{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:6px;border:none;background:transparent;cursor:pointer;text-align:left;width:100%;transition:background .12s}
.regr__item:hover{background:rgba(255,255,255,.03)}
.regr__item--pass .regr__item-label{color:#54d88c}
.regr__item--fail .regr__item-label{color:#ff6b6b}
.regr__icon--pass{color:#54d88c;flex-shrink:0}
.regr__icon--fail{color:#ff6b6b;flex-shrink:0}
.regr__item-label{font-size:12px;color:var(--ls-text-secondary,#c3c9d4);flex:1}
.regr__item-area{font-size:9px;padding:1px 5px;border-radius:3px;background:rgba(142,150,166,.08);color:var(--ls-text-hint,#5d667a)}
.regr__item-note{font-size:10px;color:var(--ls-text-hint,#5d667a)}
</style>
