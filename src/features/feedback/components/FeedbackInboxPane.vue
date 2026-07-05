<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFeedbackStore } from '../store/feedback.store'
import { useIssueClusterStore } from '../../issues/store/issue-cluster.store'
import { useBootstrapTaskStore } from '../../bootstrap/store/bootstrap-task.store'
import { SOURCE_TYPE_LABELS, SEVERITY_LABELS, ROUTED_STATUS_LABELS } from '../types'
import type { FeedbackItem, RoutedStatus } from '../types'
import { Inbox, AlertCircle, Tag, GitMerge, ArrowRightToLine, EyeOff, CheckCircle2, ArrowDown } from 'lucide-vue-next'

const feedbackStore = useFeedbackStore()
const clusterStore = useIssueClusterStore()
const taskStore = useBootstrapTaskStore()

const activeTab = ref<RoutedStatus>('inbox')
const expandedId = ref<string | null>(null)
const triageNote = ref('')

const displayItems = computed(() => {
  switch (activeTab.value) {
    case 'inbox': return feedbackStore.inboxItems
    case 'triaged': return feedbackStore.triagedItems
    case 'converted-to-task': return feedbackStore.convertedItems
    default: return feedbackStore.items
  }
})

function severityClass(s: string): string {
  switch (s) {
    case 'critical': return 'sev--critical'
    case 'high': return 'sev--high'
    case 'medium': return 'sev--medium'
    default: return 'sev--low'
  }
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function handleTriage(fb: FeedbackItem) {
  feedbackStore.triageFeedback(fb.feedbackId, triageNote.value)
  triageNote.value = ''
  if (fb.tags.length > 0 || fb.title) {
    clusterStore.findOrCreateCluster({
      title: fb.title, tags: fb.tags, feedbackId: fb.feedbackId,
      instanceId: fb.sourceInstanceId, version: fb.sourceVersion,
      severity: fb.severity,
    })
  }
}

function handleIgnore(id: string) {
  feedbackStore.ignoreFeedback(id)
}

function handleConvertToTask(fb: FeedbackItem) {
  const candidate = taskStore.addCandidate({
    sourceType: 'user-feedback',
    title: fb.title,
    reason: fb.content,
    suggestedPriority: fb.severity === 'critical' ? 'p0' : fb.severity === 'high' ? 'p1' : 'p2',
    relatedVersion: fb.sourceVersion,
  })
  const task = taskStore.convertCandidate(candidate.candidateId)
  if (task) {
    feedbackStore.convertToTask(fb.feedbackId, task.taskId)
    const cluster = clusterStore.clusters.find(c => c.relatedFeedbackIds.includes(fb.feedbackId))
    if (cluster) {
      clusterStore.linkTask(cluster.clusterId, task.taskId)
      clusterStore.setStatus(cluster.clusterId, 'fixing')
    }
  }
}

function handleMergeDuplicate(fb: FeedbackItem) {
  const similar = feedbackStore.items.filter(f =>
    f.feedbackId !== fb.feedbackId &&
    f.routedStatus === 'inbox' &&
    f.tags.some(t => fb.tags.includes(t))
  )
  if (similar.length > 0) {
    feedbackStore.mergeInto(fb.feedbackId, similar[0].feedbackId)
    clusterStore.addFeedbackToCluster(
      clusterStore.clusters.find(c => c.relatedFeedbackIds.includes(similar[0].feedbackId))?.clusterId ?? '',
      fb.feedbackId,
      fb.sourceInstanceId,
      fb.sourceVersion,
    )
  }
}
</script>

<template>
  <div class="feedback-inbox">
    <div class="feedback-inbox__header">
      <div class="feedback-inbox__title">
        <Inbox :size="16" />
        <span>Feedback Intake</span>
      </div>
    </div>

    <!-- Tab bar -->
    <div class="feedback-inbox__tabs">
      <button v-for="tab in (['inbox','triaged','converted-to-task'] as RoutedStatus[])" :key="tab"
        class="feedback-inbox__tab" :class="{ 'feedback-inbox__tab--active': activeTab === tab }"
        @click="activeTab = tab">
        {{ ROUTED_STATUS_LABELS[tab] }}
        <span class="feedback-inbox__tab-count">{{ feedbackStore.items.filter(f => f.routedStatus === tab).length }}</span>
      </button>
    </div>

    <!-- List -->
    <div class="feedback-inbox__list">
      <div v-for="fb in displayItems" :key="fb.feedbackId"
        class="feedback-inbox__item" :class="{ 'feedback-inbox__item--expanded': expandedId === fb.feedbackId }">
        <div class="feedback-inbox__item-top" @click="toggleExpand(fb.feedbackId)">
          <span class="feedback-inbox__item-sev" :class="severityClass(fb.severity)">{{ fb.severity[0].toUpperCase() }}</span>
          <div class="feedback-inbox__item-meta">
            <span class="feedback-inbox__item-source">{{ SOURCE_TYPE_LABELS[fb.sourceType] }}</span>
            <span class="feedback-inbox__item-title">{{ fb.title }}</span>
          </div>
          <span class="feedback-inbox__item-date">{{ fb.createdAt.slice(0, 10) }}</span>
        </div>

        <div v-if="expandedId === fb.feedbackId" class="feedback-inbox__item-detail">
          <p class="feedback-inbox__content">{{ fb.content }}</p>
          <div class="feedback-inbox__tags">
            <span v-for="t in fb.tags" :key="t" class="feedback-inbox__tag">{{ t }}</span>
          </div>
          <div class="feedback-inbox__meta-row">
            <span>Version: {{ fb.sourceVersion || '?' }}</span>
            <span>Repro: {{ fb.reproducibility }}</span>
            <span v-if="fb.relatedClusterId">Cluster: {{ fb.relatedClusterId.slice(-8) }}</span>
          </div>

          <!-- Actions -->
          <div v-if="fb.routedStatus === 'inbox'" class="feedback-inbox__actions">
            <button class="feedback-inbox__action-btn feedback-inbox__action-btn--primary" @click="handleTriage(fb)">
              <CheckCircle2 :size="12" /> Triage
            </button>
            <button class="feedback-inbox__action-btn" @click="handleMergeDuplicate(fb)">
              <GitMerge :size="12" /> Merge
            </button>
            <button class="feedback-inbox__action-btn feedback-inbox__action-btn--danger" @click="handleIgnore(fb.feedbackId)">
              <EyeOff :size="12" /> Ignore
            </button>
          </div>
          <div v-if="fb.routedStatus === 'triaged'" class="feedback-inbox__actions">
            <button class="feedback-inbox__action-btn feedback-inbox__action-btn--primary" @click="handleConvertToTask(fb)">
              <ArrowRightToLine :size="12" /> Convert to Task
            </button>
          </div>
          <div v-if="fb.routedStatus === 'converted-to-task'" class="feedback-inbox__detail-row">
            <span class="feedback-inbox__converted-label">Task: {{ fb.convertedTaskId?.slice(-12) }}</span>
          </div>
        </div>
      </div>
      <div v-if="displayItems.length === 0" class="feedback-inbox__empty">No items in {{ ROUTED_STATUS_LABELS[activeTab] }}</div>
    </div>
  </div>
</template>

<style scoped>
.feedback-inbox {
  display: flex; flex-direction: column; height: 100%;
  background: var(--ls-bg-panel, #0b0f18);
  color: var(--ls-text-primary, #c3c9d4);
  overflow-y: auto;
}
.feedback-inbox__header {
  padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.06);
}
.feedback-inbox__title {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 600; color: var(--ls-accent, #5a93ff);
}
.feedback-inbox__tabs {
  display: flex; gap: 0; border-bottom: 1px solid rgba(255,255,255,.04); padding: 0 12px;
}
.feedback-inbox__tab {
  padding: 8px 14px; font-size: 11px; background: none; border: none; border-bottom: 2px solid transparent;
  color: #8e96a6; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all .12s;
}
.feedback-inbox__tab--active { color: #5a93ff; border-bottom-color: #5a93ff; }
.feedback-inbox__tab-count { font-size: 9px; padding: 1px 5px; border-radius: 999px; background: rgba(255,255,255,.06); }
.feedback-inbox__tab--active .feedback-inbox__tab-count { background: rgba(90,147,255,.12); }
.feedback-inbox__list { flex: 1; min-height: 0; overflow-y: auto; padding: 8px 12px; }
.feedback-inbox__item {
  border: 1px solid rgba(255,255,255,.04); border-radius: 8px; padding: 8px 10px; margin-bottom: 4px;
  transition: background .1s;
}
.feedback-inbox__item:hover { background: rgba(255,255,255,.02); }
.feedback-inbox__item-top { display: flex; align-items: flex-start; gap: 8px; cursor: pointer; }
.feedback-inbox__item-sev {
  font-size: 9px; font-weight: 700; padding: 2px 5px; border-radius: 4px; min-width: 16px; text-align: center; margin-top: 1px;
}
.sev--critical { background: rgba(255,107,107,.15); color: #ff6b6b; }
.sev--high { background: rgba(255,159,67,.15); color: #ff9f43; }
.sev--medium { background: rgba(90,147,255,.12); color: #5a93ff; }
.sev--low { background: rgba(255,255,255,.06); color: #8e96a6; }
.feedback-inbox__item-meta { flex: 1; min-width: 0; }
.feedback-inbox__item-source { font-size: 9px; color: #5d667a; text-transform: uppercase; display: block; }
.feedback-inbox__item-title { font-size: 12px; font-weight: 500; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.feedback-inbox__item-date { font-size: 10px; color: #5d667a; white-space: nowrap; }
.feedback-inbox__item-detail { margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,.04); }
.feedback-inbox__content { font-size: 11px; color: #8e96a6; margin: 0 0 8px; line-height: 1.5; }
.feedback-inbox__tags { display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap; }
.feedback-inbox__tag { font-size: 9px; padding: 1px 6px; border-radius: 4px; background: rgba(255,255,255,.05); color: #8e96a6; }
.feedback-inbox__meta-row { display: flex; gap: 12px; font-size: 10px; color: #5d667a; margin-bottom: 8px; }
.feedback-inbox__actions { display: flex; gap: 4px; }
.feedback-inbox__action-btn {
  display: flex; align-items: center; gap: 4px; font-size: 10px; padding: 4px 10px; border-radius: 6px;
  border: 1px solid rgba(255,255,255,.08); background: transparent; color: #8e96a6; cursor: pointer; transition: all .1s;
}
.feedback-inbox__action-btn:hover { background: rgba(255,255,255,.04); color: #c3c9d4; }
.feedback-inbox__action-btn--primary { border-color: rgba(90,147,255,.2); color: #5a93ff; }
.feedback-inbox__action-btn--primary:hover { background: rgba(90,147,255,.08); }
.feedback-inbox__action-btn--danger:hover { color: #ff6b6b; border-color: rgba(255,107,107,.2); }
.feedback-inbox__converted-label { font-size: 10px; color: #54d88c; }
.feedback-inbox__empty { text-align: center; color: #5d667a; padding: 20px; font-size: 12px; }
</style>
