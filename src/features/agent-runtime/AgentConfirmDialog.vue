<script setup lang="ts">
import { AlertTriangle, Check, X } from "lucide-vue-next"

defineProps<{
  visible: boolean
  title: string
  message: string
  detail?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="agent-confirm-overlay" @click.self="emit('cancel')">
      <div class="agent-confirm-dialog">
        <div class="agent-confirm-header">
          <AlertTriangle :size="20" class="agent-confirm-icon" />
          <span>{{ title }}</span>
        </div>
        <p class="agent-confirm-message">{{ message }}</p>
        <pre v-if="detail" class="agent-confirm-detail">{{ detail }}</pre>
        <div class="agent-confirm-actions">
          <button class="agent-confirm-btn agent-confirm-btn--cancel" @click="emit('cancel')">
            <X :size="14" />
            取消
          </button>
          <button class="agent-confirm-btn agent-confirm-btn--confirm" @click="emit('confirm')">
            <Check :size="14" />
            确认执行
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.agent-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
}

.agent-confirm-dialog {
  width: 90%;
  max-width: 440px;
  padding: 24px;
  border: 1px solid var(--ls-border-default, #e8edf5);
  border-radius: var(--ls-radius-lg, 16px);
  background: var(--ls-bg-surface, #fff);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.agent-confirm-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  color: var(--ls-text-primary);
  font-size: 15px;
  font-weight: 650;
}

.agent-confirm-icon {
  color: var(--ls-warning, #f59e0b);
}

.agent-confirm-message {
  margin: 0 0 8px;
  color: var(--ls-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.agent-confirm-detail {
  max-height: 160px;
  overflow-y: auto;
  margin: 0 0 16px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--ls-bg-soft);
  color: var(--ls-text-subtle);
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  white-space: pre-wrap;
}

.agent-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.agent-confirm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 550;
  cursor: pointer;
}

.agent-confirm-btn--cancel {
  background: var(--ls-bg-muted);
  color: var(--ls-text-muted);
}

.agent-confirm-btn--confirm {
  background: var(--ls-accent, #4f6bff);
  color: #fff;
}
</style>
