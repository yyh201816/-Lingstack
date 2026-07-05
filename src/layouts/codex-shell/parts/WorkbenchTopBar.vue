<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue"
import { Settings } from "lucide-vue-next"
import { APP_NAME, APP_VERSION } from "@/shared/constants/app"
import { LsBadge } from "@/design-system/components"
import { useProjectStore } from "@/features/projects/store/project.store"
import { useThreadStore } from "@/features/threads/store/thread.store"
import { useSettingsStore } from "@/features/settings/store/settings.store"
import { runtimeEventBus } from "@/features/agent-runtime/runtime-event-bus"

defineEmits<{ (e: "toggle-left"): void; (e: "open-settings"): void }>()

const projectStore = useProjectStore()
const threadStore = useThreadStore()
const settingsStore = useSettingsStore()

const agentStatusText = ref("Agent 已就绪")
const agentPhase = ref<"idle" | "running" | "waiting" | "failed">("idle")
const unsubs: Array<() => void> = []

function getProjectDisplayName(projectPath?: string | null): string {
  if (!projectPath) return "未打开项目"
  const normalized = projectPath.replace(/\\/g, "/")
  const name = normalized.split("/").filter(Boolean).pop()
  return name || "未命名项目"
}

const statusLabels: Record<string, string> = {
  created: "任务已创建",
  building_context: "构建上下文",
  planning: "生成计划中",
  waiting_tool: "等待工具执行",
  executing_tool: "正在分析",
  generating_diff: "生成 Diff",
  waiting_confirm: "等待确认",
  applying_patch: "应用变更中",
  completed: "Agent 已就绪",
  failed: "任务失败",
  cancelled: "任务已取消",
}

onMounted(() => {
  unsubs.push(
    runtimeEventBus.on("task_created", () => {
      agentStatusText.value = "任务已创建"
      agentPhase.value = "running"
    }),
  )
  unsubs.push(
    runtimeEventBus.on("task_status_changed", (event) => {
      const status = String(event.payload?.status || "")
      agentStatusText.value = statusLabels[status] || "任务处理中"
      if (status === "waiting_confirm") {
        agentPhase.value = "waiting"
      } else if (status === "failed") {
        agentPhase.value = "failed"
      } else if (status === "completed" || status === "cancelled") {
        agentPhase.value = "idle"
      } else {
        agentPhase.value = "running"
      }
    }),
  )
  unsubs.push(
    runtimeEventBus.on("task_completed", () => {
      agentStatusText.value = "Agent 已就绪"
      agentPhase.value = "idle"
    }),
  )
  unsubs.push(
    runtimeEventBus.on("task_failed", () => {
      agentStatusText.value = "任务失败"
      agentPhase.value = "failed"
    }),
  )
})

onUnmounted(() => {
  unsubs.forEach((unsubscribe) => unsubscribe())
})

const projectName = computed(() => getProjectDisplayName(projectStore.currentProjectPath))
const threadTitle = computed(() => {
  const title = threadStore.activeThread?.title?.trim()
  return title || "无活动线程"
})
const modelName = computed(() => {
  const model = settingsStore.model?.trim()
  return model || "未配置模型"
})
</script>

<template>
  <header class="v02-topbar">
    <div class="v02-topbar__left">
      <button class="v02-topbar__menu-btn" @click="$emit('toggle-left')" title="切换侧边栏">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <line x1="3" y1="4.5" x2="15" y2="4.5" />
          <line x1="3" y1="9" x2="15" y2="9" />
          <line x1="3" y1="13.5" x2="15" y2="13.5" />
        </svg>
      </button>
      <div class="v02-topbar__brand">
        <span class="v02-topbar__logo">灵</span>
        <span class="v02-topbar__name">{{ APP_NAME }}</span>
        <span class="v02-topbar__version">v{{ APP_VERSION }}</span>
      </div>
    </div>

    <div class="v02-topbar__center">
      <span class="v02-topbar__context-label">项目</span>
      <span class="v02-topbar__context-value">{{ projectName }}</span>
      <span class="v02-topbar__sep">·</span>
      <span class="v02-topbar__context-label">线程</span>
      <span class="v02-topbar__context-value v02-topbar__context-value--thread">{{ threadTitle }}</span>
    </div>

    <div class="v02-topbar__right">
      <LsBadge color="neutral" variant="light" size="sm">{{ modelName }}</LsBadge>
      <LsBadge
        :color="agentPhase === 'running' ? 'primary' : agentPhase === 'waiting' ? 'warning' : agentPhase === 'failed' ? 'danger' : 'success'"
        :variant="agentPhase === 'idle' ? 'light' : 'solid'"
        size="sm"
      >
        {{ agentStatusText }}
      </LsBadge>
      <button class="v02-topbar__settings-btn" @click="$emit('open-settings')" title="打开设置">
        <Settings :size="16" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.v02-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  background: var(--ls-bg-surface);
  border-bottom: 1px solid var(--ls-border-default);
  user-select: none;
  -webkit-app-region: drag;
  flex-shrink: 0;
}

.v02-topbar__left,
.v02-topbar__center,
.v02-topbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
  -webkit-app-region: no-drag;
}

.v02-topbar__menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--ls-border-default);
  border-radius: var(--ls-radius-lg);
  background: var(--ls-bg-surface);
  color: var(--ls-text-muted);
  cursor: pointer;
  transition: all 140ms ease;
}

.v02-topbar__menu-btn:hover {
  background: var(--ls-bg-soft);
  color: var(--ls-text-primary);
}

.v02-topbar__brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.v02-topbar__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: var(--ls-brand-50);
  color: var(--ls-brand-500);
  font-size: 14px;
  font-weight: 700;
}

.v02-topbar__name {
  font-size: 14px;
  font-weight: var(--ls-font-weight-semibold);
  color: var(--ls-text-primary);
}

.v02-topbar__version {
  font-size: 11px;
  color: var(--ls-text-subtle);
  background: var(--ls-bg-muted);
  padding: 2px 8px;
  border-radius: var(--ls-radius-pill);
}

.v02-topbar__center {
  flex: 1;
  justify-content: center;
}

.v02-topbar__context-label {
  font-size: 12px;
  color: var(--ls-text-subtle);
}

.v02-topbar__context-value {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--ls-text-primary);
  font-weight: var(--ls-font-weight-medium);
}

.v02-topbar__context-value--thread {
  color: var(--ls-text-muted);
}

.v02-topbar__sep {
  color: var(--ls-border-default);
}

.v02-topbar__settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--ls-radius-lg);
  background: transparent;
  color: var(--ls-text-muted);
  cursor: pointer;
  transition: all 140ms ease;
}

.v02-topbar__settings-btn:hover {
  background: var(--ls-bg-muted);
  color: var(--ls-text-primary);
}
</style>
