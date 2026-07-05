<script setup lang="ts">
import { computed } from "vue"
import ThreadHeader from "./ThreadHeader.vue"
import EmptyState from "./EmptyState.vue"
import { useThreadStore } from "@/features/threads/store/thread.store"
import { useThreadSessionStore } from "@/features/threads/store/thread-session.store"

const threadStore = useThreadStore()
const sessionStore = useThreadSessionStore()

const hasThread = computed(() => threadStore.activeThread !== null)
const messages = computed(() => {
  const threadId = threadStore.activeThreadId
  return threadId ? sessionStore.getMessages(threadId) : []
})

function getRoleLabel(type: string, role?: string): string {
  if (role === "user") return "你"
  if (role === "assistant") return "灵栈"
  if (role === "system") return "系统"
  if (type === "task_status") return "任务状态"
  return "消息"
}
</script>

<template>
  <div class="center-pane">
    <template v-if="hasThread">
      <ThreadHeader />
      <div class="center-pane__timeline">
        <div class="center-pane__messages">
          <div v-if="messages.length === 0" class="center-pane__placeholder-text">
            暂无消息，请在底部 Command Bar 输入你的任务。
          </div>
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="center-pane__message"
            :class="`center-pane__message--${msg.type}`"
          >
            <div class="center-pane__msg-role">{{ getRoleLabel(msg.type, msg.role) }}</div>
            <div class="center-pane__msg-content" :class="{ 'center-pane__msg-content--streaming': msg.streaming }">
              {{ msg.content }}
              <span v-if="msg.streaming" class="center-pane__streaming-cursor">|</span>
            </div>
            <div v-if="msg.error" class="center-pane__msg-error">
              错误：{{ msg.meta?.errorMessage || "获取响应失败" }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="center-pane__welcome">
      <EmptyState
        title="灵栈工作台"
        description="创建线程或打开项目后，灵栈会围绕当前任务和项目上下文继续工作。"
      />
    </div>
  </div>
</template>

<style scoped>
.center-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--ls-bg-app, #070a10);
}

.center-pane__timeline {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.center-pane__welcome {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px;
}

.center-pane__messages {
  padding: 20px;
}

.center-pane__placeholder-text {
  padding: 40px 0;
  font-size: 13px;
  text-align: center;
  color: var(--ls-text-hint, #5d667a);
}

.center-pane__message {
  margin-bottom: 8px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
}

.center-pane__message--user {
  background: rgba(90, 147, 255, 0.06);
  border-color: rgba(90, 147, 255, 0.1);
}

.center-pane__message--assistant {
  background: rgba(84, 216, 140, 0.04);
  border-color: rgba(84, 216, 140, 0.08);
}

.center-pane__message--system {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.04);
}

.center-pane__message--task_status {
  background: rgba(90, 147, 255, 0.05);
  border-color: rgba(90, 147, 255, 0.12);
}

.center-pane__msg-role {
  margin-bottom: 4px;
  font-size: 10px;
  letter-spacing: 0.05em;
  color: var(--ls-text-hint, #5d667a);
  text-transform: uppercase;
}

.center-pane__msg-content {
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ls-text-primary, #e9edf6);
}

.center-pane__msg-content--streaming {
  color: var(--ls-text-secondary, #c3c9d4);
}

.center-pane__streaming-cursor {
  color: var(--ls-accent, #5a93ff);
  animation: blink-cursor 1s step-end infinite;
}

.center-pane__msg-error {
  margin-top: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(255, 107, 107, 0.08);
  font-size: 11px;
  color: #ff6b6b;
}

@keyframes blink-cursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
