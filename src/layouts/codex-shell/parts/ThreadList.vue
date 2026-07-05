<script setup lang="ts">
import { computed, ref } from "vue"
import { useThreadStore } from "@/features/threads/store/thread.store"
import { useComposerStore } from "@/features/chat/store/composer.store"
import { useThreadSearchStore } from "@/features/threads/store/thread-search.store"
import { useThreadSessionStore } from "@/features/threads/store/thread-session.store"
import ThreadListItem from "./ThreadListItem.vue"
import EmptyState from "./EmptyState.vue"

const threadStore = useThreadStore()
const composerStore = useComposerStore()
const sessionStore = useThreadSessionStore()
const searchStore = useThreadSearchStore()

const contextMenuThreadId = ref<string | null>(null)
const contextMenuPos = ref({ x: 0, y: 0 })
const isRenamingId = ref<string | null>(null)
const renameValue = ref("")

const filteredThreads = computed(() => {
  const query = searchStore.query.trim().toLowerCase()
  if (!query) return threadStore.activeThreads
  return threadStore.activeThreads.filter((thread) => thread.title.toLowerCase().includes(query))
})

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "刚刚"
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  return `${Math.floor(hours / 24)} 天前`
}

function handleContextMenu(event: MouseEvent, threadId: string) {
  event.preventDefault()
  contextMenuPos.value = { x: event.clientX, y: event.clientY }
  contextMenuThreadId.value = threadId
}

function closeContextMenu() {
  contextMenuThreadId.value = null
}

function handlePinFromMenu() {
  if (contextMenuThreadId.value) {
    threadStore.pinThread(contextMenuThreadId.value)
  }
  closeContextMenu()
}

function handleArchiveFromMenu() {
  if (contextMenuThreadId.value) {
    threadStore.archiveThread(contextMenuThreadId.value)
  }
  closeContextMenu()
}

function startRenameFromMenu() {
  if (contextMenuThreadId.value) {
    isRenamingId.value = contextMenuThreadId.value
    const thread = threadStore.threads.find((item) => item.id === contextMenuThreadId.value)
    renameValue.value = thread?.title ?? ""
  }
  closeContextMenu()
}

function confirmRename() {
  if (isRenamingId.value && renameValue.value.trim()) {
    threadStore.renameThread(isRenamingId.value, renameValue.value.trim())
  }
  isRenamingId.value = null
}

function cancelRename() {
  isRenamingId.value = null
}

function handleDeleteFromMenu() {
  const threadId = contextMenuThreadId.value
  if (!threadId) return
  const thread = threadStore.threads.find((item) => item.id === threadId)

  if (!window.confirm(`确认删除线程「${thread?.title}」吗？相关消息也会一并删除。`)) {
    closeContextMenu()
    return
  }

  sessionStore.clearThreadMessages(threadId)
  composerStore.clearDraft(threadId)
  threadStore.deleteThread(threadId)
  closeContextMenu()
}

function handleCopyDeepLink() {
  const threadId = contextMenuThreadId.value
  if (threadId) {
    navigator.clipboard.writeText(`lingstack://threads/${threadId}`).catch(() => {})
  }
  closeContextMenu()
}
</script>

<template>
  <div class="thread-list" @click="closeContextMenu">
    <div v-if="filteredThreads.length === 0 && !searchStore.isSearching" class="thread-list__empty">
      <EmptyState title="暂无线程" description="创建第一个线程，开始让灵栈围绕任务继续工作。" />
    </div>

    <div v-else class="thread-list__items">
      <ThreadListItem
        v-for="thread in filteredThreads"
        :key="thread.id"
        :title="thread.title"
        :status="thread.status"
        :project-name="thread.projectId"
        :updated-at="formatRelativeTime(thread.updatedAt)"
        :is-pinned="thread.pinned"
        :is-active="thread.id === threadStore.activeThreadId"
        :is-renaming="isRenamingId === thread.id"
        :rename-value="isRenamingId === thread.id ? renameValue : ''"
        @click="threadStore.setActiveThread(thread.id)"
        @contextmenu="handleContextMenu($event, thread.id)"
        @rename-confirm="confirmRename"
        @rename-cancel="cancelRename"
        @rename-update="(value) => { renameValue = value }"
      />
    </div>

    <div v-if="filteredThreads.length === 0 && searchStore.isSearching" class="thread-list__empty">
      <EmptyState title="没有搜索结果" description="换个关键词试试，或者先创建一个新线程。" />
    </div>

    <Teleport to="body">
      <div
        v-if="contextMenuThreadId"
        class="thread-list__context-menu"
        :style="{ left: `${contextMenuPos.x}px`, top: `${contextMenuPos.y}px` }"
      >
        <button class="thread-list__context-item" @click="startRenameFromMenu">重命名</button>
        <button class="thread-list__context-item" @click="handlePinFromMenu">
          {{ threadStore.threads.find((thread) => thread.id === contextMenuThreadId)?.pinned ? "取消置顶" : "置顶" }}
        </button>
        <button class="thread-list__context-item" @click="handleArchiveFromMenu">
          {{ threadStore.threads.find((thread) => thread.id === contextMenuThreadId)?.archived ? "取消归档" : "归档" }}
        </button>
        <div class="thread-list__context-sep"></div>
        <button class="thread-list__context-item" @click="handleCopyDeepLink">复制深链</button>
        <div class="thread-list__context-sep"></div>
        <button class="thread-list__context-item thread-list__context-item--danger" @click="handleDeleteFromMenu">删除线程</button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.thread-list {
  height: 100%;
  overflow-y: auto;
  padding: 4px 0;
}

.thread-list__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.thread-list__items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.thread-list__context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 160px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: var(--ls-bg-elevated, #151b2a);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.thread-list__context-item {
  display: block;
  width: 100%;
  padding: 7px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--ls-text-secondary, #c3c9d4);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.thread-list__context-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.thread-list__context-item--danger {
  color: #ff6b6b;
}

.thread-list__context-item--danger:hover {
  background: rgba(255, 107, 107, 0.1);
}

.thread-list__context-sep {
  height: 1px;
  margin: 4px 0;
  background: rgba(255, 255, 255, 0.06);
}
</style>
