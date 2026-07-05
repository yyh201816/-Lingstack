<script setup lang="ts">
import { ArrowRight, CheckCircle, Circle, Loader } from 'lucide-vue-next'
import { useSelfHostStore } from '../store/self-host.store'

const store = useSelfHostStore()

function stageStatusIcon(status: string) {
  switch (status) {
    case 'done': return CheckCircle
    case 'in_progress': return Loader
    default: return Circle
  }
}

function stageStatusColor(status: string) {
  switch (status) {
    case 'done': return '#54d88c'
    case 'in_progress': return '#5a93ff'
    default: return '#5d667a'
  }
}
</script>

<template>
  <div class="migration">
    <div class="migration__header">
      <h4>Migration Plan</h4>
    </div>

    <div class="migration__stages">
      <div
        v-for="(stage, idx) in store.migrationPlan"
        :key="stage.id"
        :class="['migration__stage', `migration__stage--${stage.status}`]"
      >
        <div class="migration__stage-header">
          <component
            :is="stageStatusIcon(stage.status)"
            :size="14"
            :color="stageStatusColor(stage.status)"
            :class="{ spinning: stage.status === 'in_progress' }"
          />
          <span class="migration__stage-id">Stage {{ stage.id }}</span>
          <span class="migration__stage-title">{{ stage.title.replace(/^Stage [ABC] — /, '') }}</span>
          <span :class="['migration__stage-badge', `migration__stage-badge--${stage.status}`]">
            {{ stage.status === 'in_progress' ? 'Active' : stage.status }}
          </span>
        </div>

        <p class="migration__stage-objective">{{ stage.objective }}</p>

        <div class="migration__stage-columns">
          <div class="migration__scope-col">
            <div class="migration__scope-label">LingStack handles:</div>
            <ul class="migration__scope-list">
              <li v-for="item in stage.lingstackScope" :key="item">{{ item }}</li>
            </ul>
          </div>
          <div class="migration__scope-col">
            <div class="migration__scope-label">Trae handles:</div>
            <ul class="migration__scope-list migration__scope-list--secondary">
              <li v-for="item in stage.traeScope" :key="item">{{ item }}</li>
            </ul>
          </div>
        </div>

        <ArrowRight v-if="idx < store.migrationPlan.length - 1" :size="14" class="migration__arrow" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.migration__header h4 {
  font-size: 12px; font-weight: 600; color: var(--ls-text-secondary, #c3c9d4);
  margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.04em;
}
.migration__stages { display: flex; flex-direction: column; gap: 8px; }
.migration__stage {
  padding: 12px; border-radius: 8px;
  background: var(--ls-bg-elevated, #101624);
  border: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
}
.migration__stage--in_progress { border-color: rgba(90, 147, 255, 0.2); }
.migration__stage--done { border-color: rgba(84, 216, 140, 0.15); }
.migration__stage-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
}
.migration__stage-id {
  font-size: 11px; font-weight: 600; font-family: monospace;
  color: var(--ls-accent, #5a93ff);
}
.migration__stage-title {
  font-size: 12px; font-weight: 500; color: var(--ls-text-primary, #e8ecf1); flex: 1;
}
.migration__stage-badge {
  font-size: 9px; padding: 1px 6px; border-radius: 4px;
  font-weight: 500; text-transform: uppercase;
}
.migration__stage-badge--todo { background: rgba(255, 255, 255, 0.04); color: #5d667a; }
.migration__stage-badge--in_progress { background: rgba(90, 147, 255, 0.1); color: #5a93ff; }
.migration__stage-badge--done { background: rgba(84, 216, 140, 0.1); color: #54d88c; }
.migration__stage-objective {
  font-size: 12px; color: var(--ls-text-muted, #8a92a4); margin: 0 0 10px; line-height: 1.5;
}
.migration__stage-columns {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
.migration__scope-label {
  font-size: 10px; font-weight: 500; color: var(--ls-text-hint, #5d667a);
  text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;
}
.migration__scope-list {
  margin: 0; padding: 0 0 0 14px; font-size: 11px;
  color: var(--ls-text-secondary, #c3c9d4); line-height: 1.7;
}
.migration__scope-list--secondary { color: var(--ls-text-muted, #8a92a4); }
.migration__arrow {
  display: block; margin: 8px auto 0; color: var(--ls-text-hint, #5d667a);
  transform: rotate(90deg);
}
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
