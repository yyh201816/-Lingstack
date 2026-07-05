<script setup lang="ts">
import { onMounted } from 'vue'
import { Rocket, Loader, RefreshCw } from 'lucide-vue-next'
import { useSelfHostStore } from '../store/self-host.store'
import SelfHostChecklist from './SelfHostChecklist.vue'
import SelfHostMigrationPlan from './SelfHostMigrationPlan.vue'

const store = useSelfHostStore()

onMounted(() => {
  if (store.capabilities.length === 0) {
    store.runAnalysis()
  }
})
</script>

<template>
  <div class="selfhost-pane">
    <div class="selfhost-pane__header">
      <Rocket :size="18" />
      <h3>Self-Host Readiness</h3>
      <button
        class="selfhost-pane__refresh"
        :disabled="store.isAnalyzing"
        @click="store.runAnalysis()"
        title="Re-analyze"
      >
        <Loader v-if="store.isAnalyzing" :size="14" class="spinning" />
        <RefreshCw v-else :size="14" />
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="store.isAnalyzing && store.capabilities.length === 0" class="selfhost-pane__loading">
      <Loader :size="20" class="spinning" />
      <span>Analyzing readiness...</span>
    </div>

    <template v-else>
      <!-- Readiness meter -->
      <div class="selfhost-pane__meter">
        <div class="selfhost-meter__header">
          <span class="selfhost-meter__label">Readiness</span>
          <span class="selfhost-meter__value">{{ store.readinessPercent }}%</span>
        </div>
        <div class="selfhost-meter__bar">
          <div
            class="selfhost-meter__fill"
            :style="{ width: store.readinessPercent + '%' }"
          />
        </div>
        <div class="selfhost-meter__stats">
          <span class="selfhost-stat selfhost-stat--ready">{{ store.readyCount }} ready</span>
          <span class="selfhost-stat selfhost-stat--partial">{{ store.partialItems.length }} partial</span>
          <span class="selfhost-stat selfhost-stat--todo">{{ store.todoItems.length }} todo</span>
          <span v-if="store.blockedItems.length > 0" class="selfhost-stat selfhost-stat--blocked">{{ store.blockedItems.length }} blocked</span>
        </div>
      </div>

      <!-- Recommendation -->
      <div class="selfhost-pane__recommendation">
        <div class="selfhost-recommendation__stage">
          Recommended Stage: <strong>{{ store.currentStage }}</strong>
        </div>
        <p class="selfhost-recommendation__text">{{ store.recommendedAction }}</p>
      </div>

      <!-- Checklist -->
      <SelfHostChecklist />

      <!-- Migration Plan -->
      <SelfHostMigrationPlan />
    </template>
  </div>
</template>

<style scoped>
.selfhost-pane {
  padding: 16px; display: flex; flex-direction: column; gap: 16px;
  height: 100%; overflow-y: auto;
}
.selfhost-pane__header {
  display: flex; align-items: center; gap: 8px;
  color: var(--ls-text-primary, #e8ecf1);
}
.selfhost-pane__header h3 { font-size: 14px; font-weight: 600; flex: 1; }
.selfhost-pane__refresh {
  width: 28px; height: 28px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--ls-text-muted, #8a92a4); cursor: pointer;
  transition: all .12s;
}
.selfhost-pane__refresh:hover { background: rgba(255, 255, 255, 0.04); color: var(--ls-accent, #5a93ff); }
.selfhost-pane__refresh:disabled { opacity: .4; cursor: not-allowed; }
.selfhost-pane__loading {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 40px 0; color: var(--ls-text-muted, #8a92a4); font-size: 13px;
}

/* Meter */
.selfhost-pane__meter {
  padding: 14px; border-radius: 10px;
  background: var(--ls-bg-elevated, #101624);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.selfhost-meter__header {
  display: flex; justify-content: space-between; margin-bottom: 8px;
}
.selfhost-meter__label { font-size: 12px; color: var(--ls-text-muted, #8a92a4); }
.selfhost-meter__value { font-size: 14px; font-weight: 600; color: var(--ls-accent, #5a93ff); font-family: monospace; }
.selfhost-meter__bar {
  height: 6px; border-radius: 3px; background: rgba(255, 255, 255, 0.06);
  overflow: hidden; margin-bottom: 10px;
}
.selfhost-meter__fill {
  height: 100%; border-radius: 3px; transition: width .4s ease;
  background: linear-gradient(90deg, #5a93ff, #54d88c);
}
.selfhost-meter__stats { display: flex; gap: 10px; flex-wrap: wrap; }
.selfhost-stat {
  font-size: 10px; font-weight: 500; padding: 2px 6px; border-radius: 4px;
}
.selfhost-stat--ready { background: rgba(84, 216, 140, 0.1); color: #54d88c; }
.selfhost-stat--partial { background: rgba(255, 217, 61, 0.1); color: #ffd93d; }
.selfhost-stat--todo { background: rgba(255, 255, 255, 0.04); color: var(--ls-text-muted, #8a92a4); }
.selfhost-stat--blocked { background: rgba(255, 107, 107, 0.1); color: #ff6b6b; }

/* Recommendation */
.selfhost-pane__recommendation {
  padding: 12px 14px; border-radius: 8px;
  background: rgba(90, 147, 255, 0.06);
  border: 1px solid rgba(90, 147, 255, 0.12);
}
.selfhost-recommendation__stage {
  font-size: 12px; color: var(--ls-text-secondary, #c3c9d4); margin-bottom: 4px;
}
.selfhost-recommendation__stage strong { color: var(--ls-accent, #5a93ff); }
.selfhost-recommendation__text {
  font-size: 12px; color: var(--ls-text-muted, #8a92a4); line-height: 1.5; margin: 0;
}

.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
