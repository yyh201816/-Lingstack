<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Send, Bug, Lightbulb, Gauge, MessageSquare, AlertTriangle } from 'lucide-vue-next'
import { useBetaFeedbackStore } from '../store/beta-feedback.store'
import { syncFeedbackToRemote } from '../services/beta-feedback.service'
import { useThreadStore } from '@/features/threads/store/thread.store'
import { useProjectStore } from '@/features/projects/store/project.store'
import type { BetaFeedbackType } from '../types/beta-feedback.types'

const emit = defineEmits<{ close: [] }>()

const betaStore = useBetaFeedbackStore()
const threadStore = useThreadStore()
const projectStore = useProjectStore()

const feedbackType = ref<BetaFeedbackType>('bug')
const title = ref('')
const description = ref('')
const includeThread = ref(true)
const includeProject = ref(true)
const isSubmitting = ref(false)
const submitError = ref('')

const typeOptions: { value: BetaFeedbackType; label: string; icon: typeof Bug; color: string }[] = [
  { value: 'bug', label: 'Bug', icon: Bug, color: '#ff6b6b' },
  { value: 'ux', label: 'UX', icon: MessageSquare, color: '#ffd93d' },
  { value: 'feature', label: 'Feature', icon: Lightbulb, color: '#5a93ff' },
  { value: 'performance', label: 'Performance', icon: Gauge, color: '#54d88c' },
  { value: 'other', label: 'Other', icon: AlertTriangle, color: '#c3c9d4' },
]

const canSubmit = computed(() => title.value.trim().length > 0 && description.value.trim().length > 0)

async function handleSubmit() {
  if (!canSubmit.value || isSubmitting.value) return
  isSubmitting.value = true
  submitError.value = ''

  try {
    const fb = betaStore.createFeedback(
      feedbackType.value,
      title.value.trim(),
      description.value.trim(),
      {
        threadId: includeThread.value ? (threadStore.activeThreadId ?? undefined) : undefined,
        projectId: includeProject.value ? (projectStore.currentProjectId ?? undefined) : undefined,
        includeRuntimeState: true,
        runtimeSnapshot: {
          activeView: 'thread',
          openTabCount: 0,
        },
      },
    )

    // Attempt sync
    const result = await syncFeedbackToRemote(fb)
    if (result.success) {
      betaStore.updateFeedbackStatus(fb.id, 'synced')
    } else {
      betaStore.updateFeedbackStatus(fb.id, 'failed')
      submitError.value = result.error || 'Sync failed — feedback saved locally'
    }

    // Close on success (even if sync failed, the feedback is persisted)
    betaStore.closeFeedbackDialog()
    emit('close')
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  betaStore.closeFeedbackDialog()
  emit('close')
}
</script>

<template>
  <div class="feedback-overlay" @click.self="handleClose">
    <div class="feedback-dialog">
      <div class="feedback-dialog__header">
        <h2 class="feedback-dialog__title">提交内测反馈</h2>
        <button class="feedback-dialog__close" @click="handleClose">
          <X :size="16" />
        </button>
      </div>

      <div class="feedback-dialog__body">
        <!-- Type selector -->
        <div class="feedback-field">
          <label class="feedback-field__label">类型</label>
          <div class="feedback-type-list">
            <button
              v-for="opt in typeOptions"
              :key="opt.value"
              :class="['feedback-type-btn', { active: feedbackType === opt.value }]"
              :style="feedbackType === opt.value ? { borderColor: opt.color, background: opt.color + '12' } : {}"
              @click="feedbackType = opt.value"
            >
              <component :is="opt.icon" :size="14" :color="feedbackType === opt.value ? opt.color : undefined" />
              <span>{{ opt.label }}</span>
            </button>
          </div>
        </div>

        <!-- Title -->
        <div class="feedback-field">
          <label class="feedback-field__label">标题</label>
          <input
            v-model="title"
            class="feedback-input"
            placeholder="Brief summary of the issue or suggestion"
            maxlength="200"
          />
        </div>

        <!-- Description -->
        <div class="feedback-field">
          <label class="feedback-field__label">描述</label>
          <textarea
            v-model="description"
            class="feedback-textarea"
            placeholder="Describe what happened, what you expected, or what you'd like to see..."
            rows="5"
            maxlength="5000"
          />
        </div>

        <!-- Context toggles -->
        <div class="feedback-field">
          <label class="feedback-field__label">附加上下文</label>
          <div class="feedback-context-toggles">
            <label class="feedback-toggle">
              <input type="checkbox" v-model="includeThread" />
              <span>Current thread ({{ threadStore.activeThreadId ? 'active' : 'none' }})</span>
            </label>
            <label class="feedback-toggle">
              <input type="checkbox" v-model="includeProject" />
              <span>Current project ({{ projectStore.currentProjectName || 'none' }})</span>
            </label>
          </div>
        </div>

        <!-- Version info -->
        <div class="feedback-meta">
          App v{{ betaStore.versionInfo.appVersion }} · {{ betaStore.versionInfo.buildChannel }}
        </div>

        <!-- Error -->
        <div v-if="submitError" class="feedback-error">
          <AlertTriangle :size="14" />
          <span>{{ submitError }}</span>
        </div>
      </div>

      <div class="feedback-dialog__footer">
        <button class="feedback-btn feedback-btn--cancel" @click="handleClose">取消</button>
        <button
          class="feedback-btn feedback-btn--submit"
          :disabled="!canSubmit || isSubmitting"
          @click="handleSubmit"
        >
          <Send :size="13" />
          {{ isSubmitting ? 'Submitting...' : 'Submit Feedback' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feedback-overlay {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);
}
.feedback-dialog {
  width: 480px; max-height: 85vh; overflow-y: auto;
  background: var(--ls-bg-panel, #0b0f18);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}
.feedback-dialog__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.feedback-dialog__title {
  font-size: 15px; font-weight: 600; color: var(--ls-text-primary, #e8ecf1);
}
.feedback-dialog__close {
  width: 28px; height: 28px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; color: var(--ls-text-muted, #8a92a4);
  cursor: pointer; transition: background .12s;
}
.feedback-dialog__close:hover { background: rgba(255, 255, 255, 0.06); }
.feedback-dialog__body { padding: 16px 20px; }
.feedback-dialog__footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 20px; border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.feedback-field { margin-bottom: 14px; }
.feedback-field__label {
  display: block; font-size: 11px; font-weight: 500;
  color: var(--ls-text-muted, #8a92a4); margin-bottom: 6px;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.feedback-type-list { display: flex; gap: 6px; flex-wrap: wrap; }
.feedback-type-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 10px; border-radius: 6px; font-size: 11px;
  border: 1px solid rgba(255, 255, 255, 0.08); background: transparent;
  color: var(--ls-text-secondary, #c3c9d4); cursor: pointer;
  transition: all .12s;
}
.feedback-type-btn.active { color: var(--ls-text-primary, #e8ecf1); }
.feedback-input, .feedback-textarea {
  width: 100%; padding: 8px 12px; border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03); color: var(--ls-text-primary, #e8ecf1);
  font-size: 13px; outline: none; resize: vertical;
  transition: border-color .12s;
}
.feedback-input:focus, .feedback-textarea:focus {
  border-color: var(--ls-accent, #5a93ff);
}
.feedback-input::placeholder, .feedback-textarea::placeholder {
  color: var(--ls-text-hint, #5d667a);
}
.feedback-context-toggles { display: flex; flex-direction: column; gap: 6px; }
.feedback-toggle {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: var(--ls-text-secondary, #c3c9d4); cursor: pointer;
}
.feedback-toggle input { accent-color: var(--ls-accent, #5a93ff); }
.feedback-meta {
  font-size: 10px; color: var(--ls-text-hint, #5d667a);
  font-family: monospace; margin-top: 8px;
}
.feedback-error {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; border-radius: 6px;
  background: rgba(255, 107, 107, 0.08); color: #ff6b6b;
  font-size: 12px; margin-top: 10px;
}
.feedback-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 16px; border-radius: 6px; font-size: 12px;
  font-weight: 500; border: none; cursor: pointer;
  transition: all .12s;
}
.feedback-btn--cancel {
  background: transparent; color: var(--ls-text-muted, #8a92a4);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.feedback-btn--cancel:hover { background: rgba(255, 255, 255, 0.04); }
.feedback-btn--submit {
  background: var(--ls-accent, #5a93ff); color: #fff;
}
.feedback-btn--submit:hover:not(:disabled) { background: var(--ls-accent-hover, #4a83ef); }
.feedback-btn--submit:disabled { opacity: .4; cursor: not-allowed; }
</style>
