<script setup lang="ts">
import { computed } from "vue"
import { Settings } from "lucide-vue-next"
import { APP_NAME, APP_VERSION } from "@/shared/constants/app"
import { LsBadge } from "@/design-system/components"
import { useProjectStore } from "@/features/projects/store/project.store"
import { useThreadStore } from "@/features/threads/store/thread.store"
import { useSettingsStore } from "@/features/settings/store/settings.store"
import { useAgentTaskStore } from "@/features/agent-runtime/agent-task.store"

defineEmits<{ (e: "toggle-left"): void; (e: "open-settings"): void }>()

const projectStore = useProjectStore()
const threadStore = useThreadStore()
const settingsStore = useSettingsStore()
const agentTaskStore = useAgentTaskStore()

function getProjectDisplayName(projectPath?: string | null): string {
  if (!projectPath) return "未打开项目"
  const normalized = projectPath.replace(/\\/g, "/")
  const name = normalized.split("/").filter(Boolean).pop()
  return name || "未命名项目"
}

const currentTask = computed(() => {
  const threadId = threadStore.activeThread?.id
  return threadId ? agentTaskStore.getLatestTaskByThread(threadId) : null
})

const statusMeta = computed(() => {
  const task = currentTask.value
  if (!task) {
    return {
      text: "Agent 已就绪",
      tone: "success" as const,
    }
  }

  switch (task.status) {
    case "created":
      return { text: "任务已创建", tone: "primary" as const }
    case "building_context":
      return { text: "读取上下文中", tone: "primary" as const }
    case "planning":
      return { text: "正在生成计划", tone: "primary" as const }
    case "waiting_tool":
      return { text: "等待工具执行", tone: "warning" as const }
    case "executing_tool":
      return { text: "正在分析", tone: "primary" as const }
    case "analysis_done":
      return { text: "分析完成", tone: "success" as const }
    case "patch_requested":
      return { text: "正在生成补丁", tone: "primary" as const }
    case "generating_diff":
      return { text: "正在生成 Diff", tone: "primary" as const }
    case "waiting_confirm":
      return { text: "等待确认", tone: "warning" as const }
    case "applying_patch":
      return { text: "正在应用补丁", tone: "primary" as const }
    case "completed":
      return {
        text: task.patchStatus === "applied" ? "补丁已应用" : "任务已完成",
        tone: "success" as const,
      }
    case "failed":
      return { text: "任务失败", tone: "danger" as const }
    case "cancelled":
      return { text: "任务已取消", tone: "neutral" as const }
    default:
      return { text: "等待输入", tone: "neutral" as const }
  }
})

const projectName = computed(() => {
  const current = projectStore.currentProjectName?.trim()
  return current || getProjectDisplayName(projectStore.currentProjectPath)
})

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
  <header class="v03-topbar">
    <div class="v03-topbar__left">
      <button class="v03-topbar__menu-btn" title="切换侧栏" @click="$emit('toggle-left')">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <line x1="3" y1="4.5" x2="15" y2="4.5" />
          <line x1="3" y1="9" x2="15" y2="9" />
          <line x1="3" y1="13.5" x2="15" y2="13.5" />
        </svg>
      </button>

      <div class="v03-topbar__brand">
        <span class="v03-topbar__logo">灵</span>
        <div class="v03-topbar__brand-text">
          <span class="v03-topbar__name">{{ APP_NAME }}</span>
          <span class="v03-topbar__version">v{{ APP_VERSION }}</span>
        </div>
      </div>
    </div>

    <div class="v03-topbar__center">
      <div class="v03-topbar__context">
        <span class="v03-topbar__context-label">项目</span>
        <span class="v03-topbar__context-value">{{ projectName }}</span>
      </div>
      <span class="v03-topbar__sep">·</span>
      <div class="v03-topbar__context">
        <span class="v03-topbar__context-label">线程</span>
        <span class="v03-topbar__context-value v03-topbar__context-value--thread">{{ threadTitle }}</span>
      </div>
    </div>

    <div class="v03-topbar__right">
      <LsBadge color="neutral" variant="light" size="sm">{{ modelName }}</LsBadge>
      <LsBadge :color="statusMeta.tone" variant="light" size="sm">{{ statusMeta.text }}</LsBadge>
      <button class="v03-topbar__settings-btn" title="打开设置" @click="$emit('open-settings')">
        <Settings :size="16" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.v03-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  border-bottom: 1px solid var(--ls-border-default);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  user-select: none;
  -webkit-app-region: drag;
  flex-shrink: 0;
}

.v03-topbar__left,
.v03-topbar__center,
.v03-topbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
  -webkit-app-region: no-drag;
}

.v03-topbar__center {
  flex: 1;
  justify-content: center;
  min-width: 0;
}

.v03-topbar__menu-btn,
.v03-topbar__settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--ls-border-default);
  border-radius: 12px;
  background: var(--ls-bg-surface);
  color: var(--ls-text-muted);
  cursor: pointer;
  transition: all 140ms ease;
}

.v03-topbar__menu-btn:hover,
.v03-topbar__settings-btn:hover {
  background: var(--ls-bg-soft);
  color: var(--ls-text-primary);
}

.v03-topbar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.v03-topbar__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 10px;
  background: var(--ls-brand-50);
  color: var(--ls-brand-500);
  font-size: 15px;
  font-weight: 700;
}

.v03-topbar__brand-text {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.v03-topbar__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ls-text-primary);
}

.v03-topbar__version {
  font-size: 11px;
  color: var(--ls-text-subtle);
}

.v03-topbar__context {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.v03-topbar__context-label {
  font-size: 12px;
  color: var(--ls-text-subtle);
}

.v03-topbar__context-value {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: var(--ls-text-primary);
}

.v03-topbar__context-value--thread {
  color: var(--ls-text-muted);
}

.v03-topbar__sep {
  color: var(--ls-border-default);
}
</style>
