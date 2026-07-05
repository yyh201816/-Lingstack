<script setup lang="ts">
import { computed } from 'vue'
import { useFeedbackStore } from '../store/feedback.store'
import { useIssueClusterStore } from '../../issues/store/issue-cluster.store'
import { SOURCE_TYPE_LABELS, SEVERITY_LABELS } from '../types'
import type { FeedbackSeverity } from '../types'
import { ClipboardCheck, Tag, AlertTriangle } from 'lucide-vue-next'

const feedbackStore = useFeedbackStore()
const clusterStore = useIssueClusterStore()

const triagedItems = computed(() => feedbackStore.triagedItems)

function updateSeverity(id: string, sev: FeedbackSeverity) {
  feedbackStore.updateSeverity(id, sev)
}
</script>

<template>
  <div class="triage-pane">
    <div class="triage-pane__header">
      <div class="triage-pane__title">
        <ClipboardCheck :size="16" />
        <span>Triage</span>
      </div>
      <span class="triage-pane__count">{{ triagedItems.length }} items</span>
    </div>

    <div v-if="triagedItems.length === 0" class="triage-pane__empty">
      No triaged items. Triage feedback from the Inbox first.
    </div>

    <div v-else class="triage-pane__list">
      <div v-for="fb in triagedItems" :key="fb.feedbackId" class="triage-pane__item">
        <div class="triage-pane__item-header">
          <span :class="'triage-pane__sev triage-pane__sev--' + fb.severity">{{ SEVERITY_LABELS[fb.severity] }}</span>
          <span class="triage-pane__title-text">{{ fb.title }}</span>
        </div>
        <p class="triage-pane__content">{{ fb.content }}</p>
        <div class="triage-pane__meta">
          <span>{{ SOURCE_TYPE_LABELS[fb.sourceType] }}</span>
          <span v-if="fb.triageNote">Note: {{ fb.triageNote }}</span>
        </div>
        <div class="triage-pane__actions">
          <select class="triage-pane__select" :value="fb.severity" @change="updateSeverity(fb.feedbackId, ($event.target as HTMLSelectElement).value as FeedbackSeverity)">
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <div v-if="fb.relatedClusterId" class="triage-pane__cluster-hint">
            Cluster: {{ clusterStore.getCluster(fb.relatedClusterId)?.title?.slice(0, 30) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.triage-pane {
  display: flex; flex-direction: column; height: 100%;
  background: var(--ls-bg-panel, #0b0f18);
  color: var(--ls-text-primary, #c3c9d4);
  overflow-y: auto; padding: 16px;
}
.triage-pane__header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
}
.triage-pane__title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #ff9f43; }
.triage-pane__count { font-size: 10px; color: #8e96a6; }
.triage-pane__empty { text-align: center; color: #5d667a; padding: 20px; font-size: 12px; }
.triage-pane__list { display: flex; flex-direction: column; gap: 8px; }
.triage-pane__item {
  border: 1px solid rgba(255,255,255,.05); border-radius: 8px; padding: 10px;
  background: rgba(255,255,255,.01);
}
.triage-pane__item-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.triage-pane__sev { font-size: 9px; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
.triage-pane__sev--critical { background: rgba(255,107,107,.15); color: #ff6b6b; }
.triage-pane__sev--high { background: rgba(255,159,67,.15); color: #ff9f43; }
.triage-pane__sev--medium { background: rgba(90,147,255,.12); color: #5a93ff; }
.triage-pane__sev--low { background: rgba(255,255,255,.06); color: #8e96a6; }
.triage-pane__title-text { font-size: 12px; font-weight: 500; }
.triage-pane__content { font-size: 11px; color: #8e96a6; margin: 0 0 6px; line-height: 1.4; }
.triage-pane__meta { display: flex; gap: 12px; font-size: 10px; color: #5d667a; margin-bottom: 6px; }
.triage-pane__actions { display: flex; align-items: center; gap: 8px; }
.triage-pane__select {
  font-size: 10px; padding: 3px 6px; border-radius: 4px;
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06); color: #c3c9d4;
}
.triage-pane__cluster-hint { font-size: 10px; color: #54d88c; }
</style>
