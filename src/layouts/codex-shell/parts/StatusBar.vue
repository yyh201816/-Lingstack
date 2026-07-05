<script setup lang="ts">
import { computed } from 'vue'
import { useThreadStore } from '@/features/threads/store/thread.store'
import { useBetaFeedbackStore } from '@/features/beta/store/beta-feedback.store'

const threadStore = useThreadStore()
const betaStore = useBetaFeedbackStore()

const threadCount = computed(() => threadStore.threads.length)
const appVersion = computed(() => betaStore.versionInfo.appVersion)
const buildChannel = computed(() => betaStore.versionInfo.buildChannel)
const failedCount = computed(() => betaStore.failedFeedbacks.length)
</script>

<template>
  <div class="statusbar">
    <div class="statusbar__left">
      <span class="statusbar__item">本地</span>
      <span class="statusbar__sep">·</span>
      <span class="statusbar__item">线程： {{ threadCount }}</span>
      <span v-if="failedCount > 0" class="statusbar__sep">·</span>
      <span v-if="failedCount > 0" class="statusbar__item statusbar__item--warn">
        {{ failedCount }} feedback{{ failedCount > 1 ? 's' : '' }} 待处理
      </span>
    </div>
    <div class="statusbar__right">
      <span :class="['statusbar__channel', `statusbar__channel--${buildChannel}`]">{{ buildChannel }}</span>
      <span class="statusbar__item statusbar__item--muted">LingStack v{{ appVersion }}</span>
    </div>
  </div>
</template>

<style scoped>
.statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 28px;
  min-height: 28px;
  padding: 0 14px;
  background: var(--ls-bg-elevated, #101624);
  border-top: 1px solid var(--ls-divider, rgba(15, 23, 42, 0.07));
  user-select: none;
  flex-shrink: 0;
}
.statusbar__left, .statusbar__right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.statusbar__item {
  font-size: 11px;
  color: var(--ls-text-hint, #5d667a);
}
.statusbar__item--muted {
  color: var(--ls-text-hint, #5d667a);
  font-family: monospace;
  font-size: 10px;
}
.statusbar__sep {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.08);
}
.statusbar__item--warn {
  color: #ffd93d;
  font-size: 10px;
}
.statusbar__channel {
  font-size: 9px; padding: 1px 5px; border-radius: 3px;
  font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
  background: rgba(255, 255, 255, 0.04); color: var(--ls-text-hint, #5d667a);
}
.statusbar__channel--beta { background: rgba(90, 147, 255, 0.12); color: #5a93ff; }
.statusbar__channel--internal { background: rgba(255, 217, 61, 0.1); color: #ffd93d; }
.statusbar__channel--stable { background: rgba(84, 216, 140, 0.1); color: #54d88c; }
</style>
