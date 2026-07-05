<script setup lang="ts">
/**
 * TrainingSettingsPanel — Learning / Distillation 设置面板
 *
 * R30: 本地脱敏采样 -> 质量筛选 -> 数据集打包 -> 上传服务器同步
 * R33: 数据集质量审核 UI
 */
import { ref, computed } from 'vue'
import { Database, Upload, Trash2, Package, RefreshCw, Shield, AlertTriangle, CheckCircle, Clock, Search, X, Check, ThumbsUp, ThumbsDown, ChevronDown, ChevronRight, Eye, Filter } from 'lucide-vue-next'
import { useTrainingSettingsStore } from '../training-settings.store'
import { useTrainingDataStore } from '../training-data.store'
import { buildDatasetPackage } from '../dataset-package.service'
import { uploadDatasetPackage } from '../dataset-upload.service'
import type { TrainingSample } from '../training-data.types'

const tsStore = useTrainingSettingsStore()
const tdStore = useTrainingDataStore()

const isPackaging = ref(false)
const isUploading = ref(false)
const packResult = ref<string | null>(null)
const uploadResult = ref<string | null>(null)
const uploadError = ref<string | null>(null)

const stats = computed(() => tdStore.stats)

// R33: 质量审核状态
const reviewFilter = ref<'all' | 'high' | 'low' | 'accepted' | 'rejected'>('all')
const reviewSearch = ref('')
const expandedSampleId = ref<string | null>(null)
const showReview = ref(false)

const reviewSamples = computed(() => {
  let list = [...tdStore.samples].sort((a, b) => b.qualityScore - a.qualityScore)
  if (reviewFilter.value === 'high') list = list.filter(s => s.qualityScore >= 5)
  else if (reviewFilter.value === 'low') list = list.filter(s => s.qualityScore < 5)
  else if (reviewFilter.value === 'accepted') list = list.filter(s => s.accepted)
  else if (reviewFilter.value === 'rejected') list = list.filter(s => s.rejected)
  if (reviewSearch.value) {
    const q = reviewSearch.value.toLowerCase()
    list = list.filter(s => s.userInput.toLowerCase().includes(q) || s.modelOutput.toLowerCase().includes(q) || s.taskType.includes(q))
  }
  return list
})

const reviewFilterLabels: Record<string, string> = {
  all: '全部', high: '高质量 (>=5)', low: '低质量 (<5)', accepted: '已采纳', rejected: '已否决',
}

function toggleSample(id: string) {
  expandedSampleId.value = expandedSampleId.value === id ? null : id
}

function handleAccept(id: string) {
  tdStore.acceptSample(id)
}

function handleReject(id: string) {
  tdStore.rejectSample(id)
}

function getScoreColor(score: number): string {
  if (score >= 7) return '#4caf50'
  if (score >= 5) return '#8bc34a'
  if (score >= 3) return '#ff9800'
  if (score >= 0) return '#ff5722'
  return '#f44336'
}

function truncate(text: string, maxLen = 60): string {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

const TASK_LABELS: Record<string, string> = {
  chat: '对话', code_modify: '改代码', code_review: '代码审查',
  shell_debug: '调试', image_prompt: '图片提示', image_generate: '图片生成',
  skill_execution: 'Skill', agent_task: 'Agent', context_build: '上下文',
  model_routing: '路由',
}

function handleToggleLearning() {
  tsStore.setLearningEnabled(!tsStore.isLearningEnabled)
  if (tsStore.isLearningEnabled) tdStore.loadFromStorage()
}

function handleToggleUpload() {
  tsStore.setUploadEnabled(!tsStore.isUploadEnabled)
}

async function handlePackAndUpload() {
  packResult.value = null
  uploadResult.value = null
  uploadError.value = null

  // 校验上传开关
  if (!tsStore.isUploadEnabled) {
    uploadError.value = '请先开启「允许上传脱敏数据」开关'
    return
  }

  isPackaging.value = true
  try {
    const pkg = await buildDatasetPackage(5)
    if (!pkg) {
      packResult.value = '没有高质量样本可打包（qualityScore >= 5）'
      return
    }

    packResult.value = `已打包 ${pkg.manifest.sampleCount} 条样本，SHA256: ${pkg.manifest.sha256.slice(0, 16)}...`
    isPackaging.value = false
    isUploading.value = true

    const result = await uploadDatasetPackage(pkg)
    if (result.success) {
      uploadResult.value = '上传成功'
      tdStore.loadFromStorage()
    } else {
      uploadError.value = result.error || '上传失败'
    }
  } catch (err) {
    uploadError.value = (err as Error).message || '打包或上传失败'
  } finally {
    isPackaging.value = false
    isUploading.value = false
  }
}

function handleClearLocal() {
  if (confirm('确定清空所有本地训练数据？此操作不可恢复。')) {
    tdStore.reset()
    tsStore.clearAllSyncRecords()
    packResult.value = null
    uploadResult.value = null
    uploadError.value = null
  }
}

function formatTime(iso: string | null): string {
  if (!iso) return '从未'
  return new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="training-panel">
    <div class="training-panel__header">
      <Database :size="14" />
      <span>Learning / Distillation</span>
    </div>
    <p class="training-panel__desc">
      本地脱敏采样，为未来模型蒸馏积累训练数据。上传仅发送脱敏后的数据集，不含原始对话。
    </p>

    <!-- 开关区 -->
    <div class="training-panel__switches">
      <label class="training-panel__switch-row">
        <input type="checkbox" :checked="tsStore.isLearningEnabled" @change="handleToggleLearning" />
        <span class="training-panel__switch-label">
          <Shield :size="12" />
          开启本地数据采集
        </span>
      </label>
      <label class="training-panel__switch-row">
        <input type="checkbox" :checked="tsStore.isUploadEnabled" @change="handleToggleUpload" />
        <span class="training-panel__switch-label">
          <Upload :size="12" />
          允许上传脱敏数据
        </span>
      </label>
    </div>

    <!-- 统计区 -->
    <div class="training-panel__stats">
      <div class="training-panel__stat">
        <span class="training-panel__stat-value">{{ stats.total }}</span>
        <span class="training-panel__stat-label">总样本</span>
      </div>
      <div class="training-panel__stat">
        <span class="training-panel__stat-value">{{ stats.highQuality }}</span>
        <span class="training-panel__stat-label">高质量</span>
      </div>
      <div class="training-panel__stat">
        <span class="training-panel__stat-value">{{ tsStore.syncedCount }}</span>
        <span class="training-panel__stat-label">已上传</span>
      </div>
      <div class="training-panel__stat">
        <span class="training-panel__stat-value">{{ stats.avgScore }}</span>
        <span class="training-panel__stat-label">均分</span>
      </div>
    </div>

    <!-- 设备信息 -->
    <div class="training-panel__info">
      <div class="training-panel__info-row">
        <span class="training-panel__info-label">设备 ID</span>
        <span class="training-panel__info-value">{{ tsStore.deviceId }}</span>
      </div>
      <div class="training-panel__info-row">
        <span class="training-panel__info-label">最近上传</span>
        <span class="training-panel__info-value">
          <Clock :size="10" />
          {{ formatTime(tsStore.lastUploadAt) }}
        </span>
      </div>
      <div class="training-panel__info-row">
        <span class="training-panel__info-label">已上传样本</span>
        <span class="training-panel__info-value">{{ tsStore.uploadedCount }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="training-panel__actions">
      <button
        class="training-panel__btn training-panel__btn--primary"
        :disabled="isPackaging || isUploading || stats.highQuality === 0"
        @click="handlePackAndUpload"
      >
        <template v-if="isPackaging">
          <RefreshCw :size="12" class="spin" /> 打包中...
        </template>
        <template v-else-if="isUploading">
          <RefreshCw :size="12" class="spin" /> 上传中...
        </template>
        <template v-else>
          <Package :size="12" /> 打包并上传
        </template>
      </button>
      <button
        class="training-panel__btn training-panel__btn--danger"
        :disabled="stats.total === 0"
        @click="handleClearLocal"
      >
        <Trash2 :size="12" /> 清空本地
      </button>
    </div>

    <!-- 状态反馈 -->
    <div v-if="packResult" class="training-panel__feedback">
      <CheckCircle :size="12" /> {{ packResult }}
    </div>
    <div v-if="uploadResult" class="training-panel__feedback training-panel__feedback--success">
      <CheckCircle :size="12" /> {{ uploadResult }}
    </div>
    <div v-if="uploadError" class="training-panel__feedback training-panel__feedback--error">
      <AlertTriangle :size="12" /> {{ uploadError }}
    </div>

    <!-- 同步记录 -->
    <div v-if="tsStore.syncRecords.length > 0" class="training-panel__records">
      <div class="training-panel__records-title">上传记录</div>
      <div v-for="rec in tsStore.syncRecords.slice(-5).reverse()" :key="rec.packageId" class="training-panel__record">
        <span :class="['training-panel__record-status', `training-panel__record-status--${rec.status}`]">
          {{ rec.status === 'synced' ? '✓' : rec.status === 'failed' ? '✗' : rec.status === 'uploading' ? '...' : '○' }}
        </span>
        <span class="training-panel__record-info">{{ rec.sampleCount }} 条 · {{ formatTime(rec.uploadedAt) }}</span>
        <span v-if="rec.error" class="training-panel__record-error">{{ rec.error }}</span>
      </div>
    </div>

    <!-- R33: Quality Review -->
    <div v-if="tsStore.isLearningEnabled && tdStore.samples.length > 0" class="training-panel__review">
      <button class="training-panel__review-toggle" @click="showReview = !showReview">
        <Eye :size="12" />
        <span>质量审核 ({{ tdStore.samples.length }} 条)</span>
        <ChevronDown :size="12" :class="{ 'training-panel__chevron--open': showReview }" />
      </button>

      <div v-if="showReview" class="training-panel__review-body">
        <!-- 过滤器 -->
        <div class="training-panel__review-toolbar">
          <div class="training-panel__review-filters">
            <button
              v-for="(label, key) in reviewFilterLabels"
              :key="key"
              :class="['training-panel__filter-btn', { 'training-panel__filter-btn--active': reviewFilter === key }]"
              @click="reviewFilter = key as any"
            >
              {{ label }}
            </button>
          </div>
          <div class="training-panel__review-search">
            <Search :size="10" />
            <input v-model="reviewSearch" placeholder="搜索..." class="training-panel__search-input" />
            <button v-if="reviewSearch" class="training-panel__search-clear" @click="reviewSearch = ''">
              <X :size="10" />
            </button>
          </div>
        </div>

        <!-- 样本列表 -->
        <div v-if="reviewSamples.length === 0" class="training-panel__review-empty">
          无匹配样本
        </div>
        <div v-else class="training-panel__review-list">
          <div
            v-for="sample in reviewSamples"
            :key="sample.id"
            :class="['training-panel__review-item', { 'training-panel__review-item--expanded': expandedSampleId === sample.id }]"
          >
            <!-- 摘要行 -->
            <div class="training-panel__review-summary" @click="toggleSample(sample.id)">
              <div class="training-panel__review-left">
                <span class="training-panel__review-task" :title="sample.taskType">
                  {{ TASK_LABELS[sample.taskType] || sample.taskType }}
                </span>
                <span class="training-panel__review-input">{{ truncate(sample.userInput, 50) }}</span>
              </div>
              <div class="training-panel__review-right">
                <span class="training-panel__review-score" :style="{ color: getScoreColor(sample.qualityScore) }">
                  {{ sample.qualityScore >= 0 ? '+' : '' }}{{ sample.qualityScore }}
                </span>
                <span v-if="sample.accepted" class="training-panel__review-badge training-panel__review-badge--accept">
                  <Check :size="10" />
                </span>
                <span v-else-if="sample.rejected" class="training-panel__review-badge training-panel__review-badge--reject">
                  <X :size="10" />
                </span>
                <ChevronRight :size="12" :class="{ 'training-panel__chevron--open': expandedSampleId === sample.id }" />
              </div>
            </div>

            <!-- 展开详情 -->
            <div v-if="expandedSampleId === sample.id" class="training-panel__review-detail">
              <div class="training-panel__review-detail-row">
                <span class="training-panel__review-detail-label">模型</span>
                <span class="training-panel__review-detail-value">{{ sample.sourceModel }}</span>
              </div>
              <div class="training-panel__review-detail-row">
                <span class="training-panel__review-detail-label">时间</span>
                <span class="training-panel__review-detail-value">{{ formatTime(sample.createdAt) }}</span>
              </div>
              <div class="training-panel__review-detail-section">
                <span class="training-panel__review-detail-label">用户输入</span>
                <div class="training-panel__review-detail-content">{{ sample.userInput }}</div>
              </div>
              <div class="training-panel__review-detail-section">
                <span class="training-panel__review-detail-label">模型输出 (脱敏)</span>
                <div class="training-panel__review-detail-content training-panel__review-detail-content--output">
                  {{ truncate(sample.modelOutput, 300) }}
                </div>
              </div>
              <div class="training-panel__review-detail-actions">
                <button
                  :class="['training-panel__review-action', { 'training-panel__review-action--active': sample.accepted }]"
                  :disabled="sample.accepted"
                  @click="handleAccept(sample.id)"
                >
                  <ThumbsUp :size="11" /> 采纳
                </button>
                <button
                  :class="['training-panel__review-action', 'training-panel__review-action--reject', { 'training-panel__review-action--active': sample.rejected }]"
                  :disabled="sample.rejected"
                  @click="handleReject(sample.id)"
                >
                  <ThumbsDown :size="11" /> 否决
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.training-panel { padding: 12px 0; }
.training-panel__header {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: var(--ls-text-primary);
  margin-bottom: 6px;
}
.training-panel__desc { font-size: 11px; color: var(--ls-text-muted); margin-bottom: 12px; line-height: 1.5; }

.training-panel__switches { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.training-panel__switch-row { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.training-panel__switch-row input { accent-color: var(--ls-accent); }
.training-panel__switch-label { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--ls-text-secondary); }

.training-panel__stats { display: flex; gap: 12px; margin-bottom: 14px; }
.training-panel__stat { display: flex; flex-direction: column; align-items: center; flex: 1; }
.training-panel__stat-value { font-size: 18px; font-weight: 700; color: var(--ls-text-primary); }
.training-panel__stat-label { font-size: 10px; color: var(--ls-text-muted); }

.training-panel__info { margin-bottom: 14px; }
.training-panel__info-row { display: flex; justify-content: space-between; font-size: 11px; padding: 3px 0; }
.training-panel__info-label { color: var(--ls-text-muted); }
.training-panel__info-value { display: flex; align-items: center; gap: 4px; color: var(--ls-text-secondary); font-family: var(--ls-font-mono); }

.training-panel__actions { display: flex; gap: 8px; margin-bottom: 10px; }
.training-panel__btn {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 14px; border-radius: 6px; border: none;
  font-size: 12px; font-weight: 500; cursor: pointer;
  transition: all .12s;
}
.training-panel__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.training-panel__btn--primary { background: var(--ls-accent); color: #fff; }
.training-panel__btn--primary:hover:not(:disabled) { background: var(--ls-accent-hover); }
.training-panel__btn--danger { background: transparent; border: 1px solid var(--ls-border-soft); color: var(--ls-text-muted); }
.training-panel__btn--danger:hover:not(:disabled) { border-color: var(--ls-danger); color: var(--ls-danger); }

.training-panel__feedback {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: var(--ls-text-muted); padding: 4px 0;
}
.training-panel__feedback--success { color: #4caf50; }
.training-panel__feedback--error { color: var(--ls-danger); }

.training-panel__records { margin-top: 10px; }
.training-panel__records-title { font-size: 11px; font-weight: 600; color: var(--ls-text-muted); margin-bottom: 6px; }
.training-panel__record { display: flex; align-items: center; gap: 6px; font-size: 11px; padding: 2px 0; }
.training-panel__record-status { width: 12px; text-align: center; }
.training-panel__record-status--synced { color: #4caf50; }
.training-panel__record-status--failed { color: var(--ls-danger); }
.training-panel__record-status--uploading { color: var(--ls-accent); }
.training-panel__record-info { color: var(--ls-text-muted); }
.training-panel__record-error { color: var(--ls-danger); font-size: 10px; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* R33: Quality Review */
.training-panel__review { margin-top: 14px; border-top: 1px solid var(--ls-border-soft); padding-top: 10px; }
.training-panel__review-toggle {
  display: flex; align-items: center; gap: 6px;
  width: 100%; padding: 6px 0;
  background: none; border: none;
  font-size: 12px; font-weight: 500; color: var(--ls-text-secondary);
  cursor: pointer;
}
.training-panel__review-toggle:hover { color: var(--ls-text-primary); }
.training-panel__chevron--open { transform: rotate(90deg); transition: transform .15s; }

.training-panel__review-body { margin-top: 8px; }
.training-panel__review-toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.training-panel__review-filters { display: flex; gap: 3px; flex-wrap: wrap; }
.training-panel__filter-btn {
  padding: 2px 8px; border-radius: 10px; border: 1px solid var(--ls-border-soft);
  background: transparent; font-size: 10px; color: var(--ls-text-muted);
  cursor: pointer; transition: all .12s;
}
.training-panel__filter-btn:hover { border-color: var(--ls-accent); color: var(--ls-text-secondary); }
.training-panel__filter-btn--active { background: var(--ls-accent); color: #fff; border-color: var(--ls-accent); }

.training-panel__review-search {
  display: flex; align-items: center; gap: 4px;
  padding: 2px 6px; border-radius: 4px;
  background: var(--ls-bg-raised); border: 1px solid var(--ls-border-soft);
  margin-left: auto;
}
.training-panel__search-input {
  background: none; border: none; outline: none;
  font-size: 10px; color: var(--ls-text-primary); width: 80px;
}
.training-panel__search-input::placeholder { color: var(--ls-text-muted); }
.training-panel__search-clear { background: none; border: none; color: var(--ls-text-muted); cursor: pointer; padding: 0; }

.training-panel__review-empty { font-size: 11px; color: var(--ls-text-muted); text-align: center; padding: 12px; }
.training-panel__review-list { display: flex; flex-direction: column; gap: 2px; max-height: 360px; overflow-y: auto; }

.training-panel__review-item {
  border: 1px solid var(--ls-border-soft); border-radius: 6px;
  background: var(--ls-bg-raised); overflow: hidden;
}
.training-panel__review-item--expanded { border-color: var(--ls-accent); }

.training-panel__review-summary {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 8px; cursor: pointer; gap: 6px;
}
.training-panel__review-summary:hover { background: var(--ls-bg-hover); }
.training-panel__review-left { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; }
.training-panel__review-task {
  padding: 1px 5px; border-radius: 3px;
  background: var(--ls-bg-active); font-size: 9px; font-weight: 600;
  color: var(--ls-text-secondary); white-space: nowrap; flex-shrink: 0;
}
.training-panel__review-input {
  font-size: 11px; color: var(--ls-text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.training-panel__review-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.training-panel__review-score {
  font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums;
  min-width: 24px; text-align: right;
}
.training-panel__review-badge {
  display: flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; border-radius: 50%;
}
.training-panel__review-badge--accept { background: #e8f5e9; color: #4caf50; }
.training-panel__review-badge--reject { background: #fbe9e7; color: #f44336; }

.training-panel__review-detail { padding: 8px 8px 10px; border-top: 1px solid var(--ls-border-soft); }
.training-panel__review-detail-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
.training-panel__review-detail-label { font-size: 10px; color: var(--ls-text-muted); }
.training-panel__review-detail-value { font-size: 10px; color: var(--ls-text-secondary); }
.training-panel__review-detail-section { margin-bottom: 6px; }
.training-panel__review-detail-content {
  font-size: 11px; color: var(--ls-text-secondary); margin-top: 2px;
  padding: 6px; border-radius: 4px; background: var(--ls-bg-active);
  line-height: 1.5; white-space: pre-wrap; word-break: break-all; max-height: 80px; overflow-y: auto;
}
.training-panel__review-detail-content--output { max-height: 100px; }
.training-panel__review-detail-actions { display: flex; gap: 6px; margin-top: 8px; }
.training-panel__review-action {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 4px; border: 1px solid var(--ls-border-soft);
  background: transparent; font-size: 10px; color: var(--ls-text-muted);
  cursor: pointer; transition: all .12s;
}
.training-panel__review-action:hover:not(:disabled) { border-color: var(--ls-accent); color: var(--ls-text-primary); }
.training-panel__review-action--active { background: #e8f5e9; border-color: #4caf50; color: #4caf50; }
.training-panel__review-action--reject.training-panel__review-action--active { background: #fbe9e7; border-color: #f44336; color: #f44336; }
.training-panel__review-action:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
