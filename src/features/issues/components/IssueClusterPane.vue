<script setup lang="ts">
import { ref, computed } from 'vue'
import { useIssueClusterStore } from '../store/issue-cluster.store'
import { useFeedbackStore } from '../../feedback/store/feedback.store'
import { CLUSTER_STATUS_LABELS } from '../types'
import type { ClusterStatus } from '../types'
import { Layers, GitMerge, AlertTriangle, CheckCircle2, Wrench, Eye } from 'lucide-vue-next'

const clusterStore = useIssueClusterStore()
const feedbackStore = useFeedbackStore()

const expandedId = ref<string | null>(null)

const tabs: { key: ClusterStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'observing', label: 'Observing' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'fixing', label: 'Fixing' },
  { key: 'verified', label: 'Verified' },
  { key: 'closed', label: 'Closed' },
]
const activeTab = ref<ClusterStatus | 'all'>('all')

const displayClusters = computed(() => {
  if (activeTab.value === 'all') return clusterStore.clusters
  return clusterStore.clusters.filter(c => c.status === activeTab.value)
})

function toggleExpand(id: string) { expandedId.value = expandedId.value === id ? null : id }
function feedbackTitle(fid: string): string {
  return feedbackStore.getFeedback(fid)?.title ?? fid.slice(-8)
}
</script>

<template>
  <div class="cluster-pane">
    <div class="cluster-pane__header">
      <div class="cluster-pane__title">
        <Layers :size="16" />
        <span>Issue Clusters</span>
      </div>
      <span class="cluster-pane__count">{{ clusterStore.activeClusters.length }} active</span>
    </div>

    <!-- Tab bar -->
    <div class="cluster-pane__tabs">
      <button v-for="tab in tabs" :key="tab.key"
        class="cluster-pane__tab" :class="{ 'cluster-pane__tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key">
        {{ tab.label }}
      </button>
    </div>

    <div class="cluster-pane__list">
      <div v-for="c in displayClusters" :key="c.clusterId"
        class="cluster-pane__item" :class="{ 'cluster-pane__item--expanded': expandedId === c.clusterId }">
        <div class="cluster-pane__item-top" @click="toggleExpand(c.clusterId)">
          <span class="cluster-pane__item-status-dot" :class="'cluster-dot--' + c.status"></span>
          <div class="cluster-pane__item-meta">
            <span class="cluster-pane__item-title">{{ c.title }}</span>
            <span class="cluster-pane__item-sub">x{{ c.duplicateCount }} reports  {{ c.relatedInstanceIds.length }} instances</span>
          </div>
          <span class="cluster-pane__item-dup">{{ c.duplicateCount }}</span>
        </div>

        <div v-if="expandedId === c.clusterId" class="cluster-pane__item-detail">
          <div class="cluster-pane__detail-grid">
            <div class="cluster-pane__kv"><span>Status</span><span>{{ CLUSTER_STATUS_LABELS[c.status] }}</span></div>
            <div class="cluster-pane__kv"><span>Severity</span><span>{{ c.severity }}</span></div>
            <div class="cluster-pane__kv"><span>Versions</span><span>{{ c.relatedVersions.join(', ') || '' }}</span></div>
            <div class="cluster-pane__kv"><span>First Seen</span><span>{{ c.firstSeenVersion || '' }}</span></div>
            <div class="cluster-pane__kv"><span>Last Seen</span><span>{{ c.lastSeenVersion || '' }}</span></div>
            <div class="cluster-pane__kv"><span>Tasks</span><span>{{ c.relatedTaskIds.length > 0 ? c.relatedTaskIds.map(t => t.slice(-8)).join(', ') : '' }}</span></div>
          </div>

          <div v-if="c.relatedFeedbackIds.length > 0" class="cluster-pane__feedbacks">
            <div class="cluster-pane__section-title">Related Feedback</div>
            <div v-for="fid in c.relatedFeedbackIds" :key="fid" class="cluster-pane__fb-item">
              {{ feedbackTitle(fid) }}
            </div>
          </div>

          <div class="cluster-pane__item-actions">
            <select class="cluster-pane__select" :value="c.status" @change="clusterStore.setStatus(c.clusterId, ($event.target as HTMLSelectElement).value as ClusterStatus)">
              <option value="observing">Observing</option>
              <option value="confirmed">Confirmed</option>
              <option value="fixing">Fixing</option>
              <option value="verified">Verified</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>
      <div v-if="displayClusters.length === 0" class="cluster-pane__empty">
        No clusters yet. Feedback will auto-cluster as it arrives.
      </div>
    </div>
  </div>
</template>

<style scoped>
.cluster-pane {
  display: flex; flex-direction: column; height: 100%;
  background: var(--ls-bg-panel, #0b0f18);
  color: var(--ls-text-primary, #c3c9d4);
  overflow-y: auto;
}
.cluster-pane__header {
  display: flex; align-items: center; justify-content: space-between; padding: 14px 16px;
  border-bottom: 1px solid rgba(255,255,255,.06);
}
.cluster-pane__title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #54d88c; }
.cluster-pane__count { font-size: 10px; color: #8e96a6; }
.cluster-pane__tabs { display: flex; gap: 2px; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,.04); }
.cluster-pane__tab {
  font-size: 10px; padding: 3px 8px; border-radius: 6px; border: none; background: transparent; color: #8e96a6; cursor: pointer;
}
.cluster-pane__tab--active, .cluster-pane__tab:hover { background: rgba(84,216,140,.1); color: #54d88c; }
.cluster-pane__list { flex: 1; min-height: 0; overflow-y: auto; padding: 8px 12px; }
.cluster-pane__item {
  border: 1px solid rgba(255,255,255,.04); border-radius: 8px; padding: 8px 10px; margin-bottom: 4px;
  cursor: pointer; transition: background .1s;
}
.cluster-pane__item:hover { background: rgba(255,255,255,.02); }
.cluster-pane__item-top { display: flex; align-items: flex-start; gap: 8px; }
.cluster-pane__item-status-dot { width: 8px; height: 8px; border-radius: 999px; margin-top: 3px; flex-shrink: 0; }
.cluster-dot--observing { background: #5a93ff; }
.cluster-dot--confirmed { background: #ff9f43; }
.cluster-dot--fixing { background: #ff6b6b; }
.cluster-dot--verified { background: #54d88c; }
.cluster-dot--closed { background: #5d667a; }
.cluster-pane__item-meta { flex: 1; min-width: 0; }
.cluster-pane__item-title { font-size: 12px; font-weight: 500; display: block; }
.cluster-pane__item-sub { font-size: 10px; color: #5d667a; }
.cluster-pane__item-dup { font-size: 14px; font-weight: 700; color: #ff9f43; min-width: 20px; text-align: right; }
.cluster-pane__item-detail { margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,.04); }
.cluster-pane__detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px; }
.cluster-pane__kv { display: flex; justify-content: space-between; font-size: 10px; }
.cluster-pane__kv span:first-child { color: #5d667a; }
.cluster-pane__feedbacks { margin-bottom: 8px; }
.cluster-pane__section-title { font-size: 10px; color: #5d667a; text-transform: uppercase; margin-bottom: 4px; }
.cluster-pane__fb-item { font-size: 10px; padding: 3px 6px; background: rgba(255,255,255,.03); border-radius: 4px; margin-bottom: 2px; }
.cluster-pane__item-actions { display: flex; gap: 4px; }
.cluster-pane__select {
  font-size: 10px; padding: 3px 6px; border-radius: 4px;
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06); color: #c3c9d4;
}
.cluster-pane__empty { text-align: center; color: #5d667a; padding: 20px; font-size: 12px; }
</style>
