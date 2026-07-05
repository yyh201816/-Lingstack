<script setup lang="ts">
import { ref } from "vue"
import {
  Plus,
  MessageSquare,
  FolderGit2,
  Zap,
  FileSearch,
  Terminal,
  Server,
  PanelLeftClose,
  Wrench,
  Bug,
  Settings,
} from "lucide-vue-next"
import ProjectSwitcher from "./ProjectSwitcher.vue"
import ThreadSearchBox from "./ThreadSearchBox.vue"
import ThreadList from "./ThreadList.vue"
import { useThreadStore } from "@/features/threads/store/thread.store"
import { useProjectStore } from "@/features/projects/store/project.store"
import { useBetaFeedbackStore } from "@/features/beta/store/beta-feedback.store"
import { useAgentTaskService } from "@/features/agent-runtime/agent-task.service"

defineProps<{ collapsed?: boolean }>()

const emit = defineEmits<{
  "toggle-collapse": []
  "open-settings": []
  "open-mcp": []
  "nav-change": [view: string]
}>()

type NavView = "chat" | "project" | "skills" | "review" | "terminal" | "server"

const threadStore = useThreadStore()
const projectStore = useProjectStore()
const betaStore = useBetaFeedbackStore()
const agentTaskSvc = useAgentTaskService()

const activeNav = ref<NavView>("chat")

function getProjectDisplayName(): string {
  const path = projectStore.currentProjectPath
  if (!path) return "未命名项目"
  const normalized = path.replace(/\\/g, "/")
  return normalized.split("/").filter(Boolean).pop() || "未命名项目"
}

function handleNavClick(view: NavView) {
  activeNav.value = view
  emit("nav-change", view)
}

function handleNewThread() {
  const projectId = projectStore.currentProjectId || "__none__"
  const projectName = projectStore.currentProjectName || getProjectDisplayName()
  const title = projectStore.currentProjectPath ? `新任务：${projectName}` : "新线程"
  threadStore.createThread(title, projectId)
  handleNavClick("chat")
}

function handleSelfRepair() {
  if (!projectStore.currentProjectPath) {
    handleNavClick("project")
    window.alert("请先打开项目，再运行自修复。")
    return
  }

  const projectId = projectStore.currentProjectId || "__none__"
  const projectName = projectStore.currentProjectName || getProjectDisplayName()
  const thread = threadStore.createThread(
    `自修复：${projectName}`,
    projectId,
    "local",
    "self_repair",
    {
      goal: "扫描当前项目并给出可执行修复建议",
      targetScope: projectStore.currentProjectPath,
    },
  )

  handleNavClick("chat")

  void agentTaskSvc.runTask("self_repair", "扫描当前项目并给出可执行修复建议", {
    projectPath: projectStore.currentProjectPath,
    projectName,
    threadId: thread.id,
  })
}

const mainNavItems: Array<{ id: NavView; label: string; icon: any }> = [
  { id: "chat", label: "对话", icon: MessageSquare },
  { id: "project", label: "项目", icon: FolderGit2 },
  { id: "review", label: "审查", icon: FileSearch },
  { id: "skills", label: "Skill", icon: Zap },
]

const toolNavItems: Array<{ id: NavView; label: string; icon: any }> = [
  { id: "terminal", label: "终端", icon: Terminal },
  { id: "server", label: "服务器", icon: Server },
]
</script>

<template>
  <aside class="v02-sidebar" :class="{ 'v02-sidebar--collapsed': collapsed }">
    <template v-if="!collapsed">
      <div class="v02-sidebar__section v02-sidebar__section--project">
        <ProjectSwitcher />
      </div>

      <nav class="v02-sidebar__nav">
        <button
          v-for="item in mainNavItems"
          :key="item.id"
          class="v02-sidebar__nav-item"
          :class="{ 'v02-sidebar__nav-item--active': activeNav === item.id }"
          :title="item.label"
          @click="handleNavClick(item.id)"
        >
          <component :is="item.icon" :size="18" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="v02-sidebar__divider" />

      <div class="v02-sidebar__section-label">工具区</div>
      <nav class="v02-sidebar__nav v02-sidebar__nav--tools">
        <button
          v-for="item in toolNavItems"
          :key="item.id"
          class="v02-sidebar__nav-item v02-sidebar__nav-item--tool"
          :class="{ 'v02-sidebar__nav-item--active': activeNav === item.id }"
          :title="item.label"
          @click="handleNavClick(item.id)"
        >
          <component :is="item.icon" :size="16" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="v02-sidebar__divider" />

      <div class="v02-sidebar__section">
        <div class="v02-sidebar__section-header">
          <span class="v02-sidebar__section-title">线程</span>
          <button class="v02-sidebar__new-btn" @click="handleNewThread" title="新建线程">
            <Plus :size="14" />
          </button>
        </div>

        <ThreadSearchBox />

        <div class="v02-sidebar__thread-actions">
          <button class="v02-sidebar__action-btn v02-sidebar__action-btn--repair" @click="handleSelfRepair">
            <Wrench :size="13" />
            <span>自修复</span>
          </button>
        </div>

        <div class="v02-sidebar__thread-helper" v-if="projectStore.currentProjectPath">
          当前项目：{{ projectStore.currentProjectName || getProjectDisplayName() }}
        </div>

        <div class="v02-sidebar__thread-list">
          <ThreadList />
        </div>
      </div>

      <div class="v02-sidebar__divider" />

      <div class="v02-sidebar__bottom">
        <button class="v02-sidebar__tool-btn" @click="emit('open-mcp')" title="查看 MCP">
          <Server :size="15" />
          <span>MCP</span>
        </button>
        <button class="v02-sidebar__tool-btn" @click="emit('open-settings')" title="设置">
          <Settings :size="15" />
          <span>设置</span>
        </button>
        <button class="v02-sidebar__tool-btn" @click="betaStore.openFeedbackDialog()" title="反馈">
          <Bug :size="15" />
          <span>反馈</span>
        </button>
      </div>
    </template>

    <button class="v02-sidebar__collapse-btn" @click="emit('toggle-collapse')" title="收起侧边栏">
      <PanelLeftClose :size="16" />
    </button>
  </aside>
</template>

<style scoped>
.v02-sidebar {
  display: flex;
  flex-direction: column;
  width: 260px;
  height: 100%;
  background: var(--ls-bg-surface, #fff);
  border-right: 1px solid var(--ls-border-default, #e8edf5);
  padding: 12px;
  gap: 4px;
  flex-shrink: 0;
  overflow: hidden;
}

.v02-sidebar--collapsed {
  width: 48px;
  padding: 8px;
  align-items: center;
}

.v02-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.v02-sidebar__nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: var(--ls-radius-lg);
  background: transparent;
  color: var(--ls-text-muted);
  font-size: 13px;
  font-weight: var(--ls-font-weight-medium);
  cursor: pointer;
  transition: all 140ms ease;
}

.v02-sidebar__nav-item:hover {
  background: var(--ls-bg-muted);
  color: var(--ls-text-primary);
}

.v02-sidebar__nav-item--active {
  background: var(--ls-brand-50);
  color: var(--ls-brand-500);
  font-weight: var(--ls-font-weight-semibold);
}

.v02-sidebar__nav-item--tool {
  font-size: 12px;
  padding: 6px 12px;
  color: var(--ls-text-subtle);
}

.v02-sidebar__section-label {
  padding: 8px 12px 4px;
  font-size: 10px;
  font-weight: var(--ls-font-weight-semibold);
  color: var(--ls-text-faint);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.v02-sidebar__divider {
  height: 1px;
  background: var(--ls-border-default);
  margin: 6px 0;
}

.v02-sidebar__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.v02-sidebar__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.v02-sidebar__section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--ls-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.v02-sidebar__new-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 6px;
  background: var(--ls-accent-soft);
  color: var(--ls-accent);
  cursor: pointer;
}

.v02-sidebar__new-btn:hover {
  background: var(--ls-accent);
  color: #fff;
}

.v02-sidebar__thread-actions {
  padding: 0 2px;
}

.v02-sidebar__action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--ls-border-default);
  border-radius: 8px;
  background: var(--ls-bg-soft);
  color: var(--ls-text-muted);
  font-size: 12px;
  cursor: pointer;
}

.v02-sidebar__action-btn:hover {
  border-color: var(--ls-accent);
  color: var(--ls-accent);
}

.v02-sidebar__action-btn--repair:hover {
  border-color: var(--ls-warning);
  color: var(--ls-warning);
}

.v02-sidebar__thread-helper {
  padding: 0 4px;
  font-size: 11px;
  color: var(--ls-text-subtle);
}

.v02-sidebar__thread-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.v02-sidebar__bottom {
  display: flex;
  gap: 4px;
  padding-top: 4px;
}

.v02-sidebar__tool-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--ls-text-subtle);
  font-size: 12px;
  cursor: pointer;
}

.v02-sidebar__tool-btn:hover {
  background: var(--ls-bg-muted);
  color: var(--ls-text-secondary);
}

.v02-sidebar__collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--ls-text-subtle);
  cursor: pointer;
  margin-top: auto;
}

.v02-sidebar__collapse-btn:hover {
  background: var(--ls-bg-muted);
  color: var(--ls-text-primary);
}
</style>
