<script setup lang="ts">
import { computed, ref } from "vue"
import { Archive, Edit3, Pin, Play, Square, Trash2 } from "lucide-vue-next"
import { useProjectStore } from "@/features/projects/store/project.store"
import { useThreadStore } from "@/features/threads/store/thread.store"
import { useThreadSessionStore } from "@/features/threads/store/thread-session.store"
import { useComposerStore } from "@/features/chat/store/composer.store"

const threadStore = useThreadStore()
const projectStore = useProjectStore()
const sessionStore = useThreadSessionStore()
const composerStore = useComposerStore()

const isRenaming = ref(false)
const renameValue = ref("")

const activeThread = computed(() => threadStore.activeThread)
const title = computed(() => activeThread.value?.title || "未命名线程")
const status = computed(() => activeThread.value?.status || "idle")
const projectName = computed(() => projectStore.currentProjectName || "未打开项目")

const statusLabels: Record<string, string> = {
  idle: "等待输入",
  running: "运行中",
  waiting_approval: "等待确认",
  waiting_input: "等待输入",
  ready_review: "待审查",
  paused: "已暂停",
  failed: "失败",
  done: "已完成",
}

function formatTime(isoString: string): string {
  if (!isoString) return ""
  const date = new Date(isoString)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "刚刚"
  if (diffMins < 60) return `${diffMins} 分钟前`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} 小时前`
  return date.toLocaleDateString()
}

function startRename() {
  if (!activeThread.value) return
  renameValue.value = activeThread.value.title
  isRenaming.value = true
}

function confirmRename() {
  const threadId = threadStore.activeThreadId
  const nextTitle = renameValue.value.trim()
  if (threadId && nextTitle) {
    threadStore.renameThread(threadId, nextTitle)
  }
  isRenaming.value = false
}

function togglePin() {
  if (threadStore.activeThreadId) {
    threadStore.pinThread(threadStore.activeThreadId)
  }
}

function togglePause() {
  if (!threadStore.activeThreadId) return
  threadStore.updateThreadStatus(threadStore.activeThreadId, status.value === "paused" ? "waiting_input" : "paused")
}

function archiveThread() {
  if (threadStore.activeThreadId) {
    threadStore.archiveThread(threadStore.activeThreadId)
  }
}

function deleteThread() {
  const threadId = threadStore.activeThreadId
  if (!threadId) return
  if (!window.confirm(`确认删除线程「${title.value}」吗？这会同时清空本线程消息。`)) return
  sessionStore.clearThreadMessages(threadId)
  composerStore.clearDraft(threadId)
  threadStore.deleteThread(threadId)
}
</script>

<template>
  <div class="thread-header">
    <div class="thread-header__info">
      <div class="thread-header__title-row">
        <template v-if="isRenaming">
          <input
            v-model="renameValue"
            class="thread-header__rename-input"
            @keydown.enter="confirmRename"
            @keydown.escape="isRenaming = false"
            @blur="confirmRename"
          />
        </template>
        <template v-else>
          <h2 class="thread-header__title">{{ title }}</h2>
          <button class="thread-header__icon-btn" title="重命名线程" @click="startRename">
            <Edit3 :size="14" />
          </button>
        </template>
      </div>
      <div class="thread-header__meta">
        <span class="thread-header__project">{{ projectName }}</span>
        <span v-if="activeThread" class="thread-header__time">{{ formatTime(activeThread.updatedAt) }}</span>
        <span class="thread-header__status" :class="`thread-header__status--${status}`">
          {{ statusLabels[status] || status }}
        </span>
      </div>
    </div>

    <div class="thread-header__actions">
      <button class="thread-header__icon-btn" title="置顶线程" @click="togglePin">
        <Pin :size="14" />
      </button>
      <button class="thread-header__icon-btn" :title="status === 'paused' ? '继续线程' : '暂停线程'" @click="togglePause">
        <Play v-if="status === 'paused'" :size="14" />
        <Square v-else :size="14" />
      </button>
      <button class="thread-header__icon-btn" title="归档线程" @click="archiveThread">
        <Archive :size="14" />
      </button>
      <button class="thread-header__icon-btn thread-header__icon-btn--danger" title="删除线程" @click="deleteThread">
        <Trash2 :size="14" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.thread-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: var(--ls-bg-panel, #0b0f18);
  flex-shrink: 0;
}

.thread-header__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.thread-header__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.thread-header__title {
  margin: 0;
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 620;
  color: var(--ls-text-primary, #e9edf6);
}

.thread-header__rename-input {
  width: 320px;
  padding: 4px 8px;
  border: 1px solid rgba(90, 147, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--ls-text-primary, #e9edf6);
  font-size: 14px;
  outline: none;
}

.thread-header__meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.thread-header__project,
.thread-header__time {
  font-size: 11px;
  color: var(--ls-text-hint, #5d667a);
}

.thread-header__status {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 500;
}

.thread-header__status--running {
  background: rgba(90, 147, 255, 0.12);
  color: var(--ls-accent, #5a93ff);
}

.thread-header__status--waiting_input,
.thread-header__status--idle {
  background: rgba(255, 255, 255, 0.06);
  color: var(--ls-text-secondary, #c3c9d4);
}

.thread-header__status--ready_review {
  background: rgba(84, 216, 140, 0.12);
  color: #54d88c;
}

.thread-header__status--paused,
.thread-header__status--waiting_approval {
  background: rgba(245, 158, 11, 0.14);
  color: #f59e0b;
}

.thread-header__status--failed {
  background: rgba(255, 107, 107, 0.14);
  color: #ff6b6b;
}

.thread-header__status--done {
  background: rgba(84, 216, 140, 0.12);
  color: #54d88c;
}

.thread-header__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.thread-header__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  background: transparent;
  color: var(--ls-text-hint, #5d667a);
  cursor: pointer;
}

.thread-header__icon-btn:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--ls-text-primary, #e9edf6);
}

.thread-header__icon-btn--danger:hover {
  color: #ff6b6b;
}
</style>
