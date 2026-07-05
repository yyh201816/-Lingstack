<script setup lang="ts">
import { computed } from "vue"
import {
  Bot,
  Bug,
  FileSearch,
  FolderGit2,
  MessageSquare,
  PanelLeftClose,
  Plus,
  Server,
  Settings,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-vue-next"
import ProjectSwitcher from "./ProjectSwitcher.vue"
import ThreadSearchBox from "./ThreadSearchBox.vue"
import ThreadList from "./ThreadList.vue"
import { useThreadStore } from "@/features/threads/store/thread.store"
import { useProjectStore } from "@/features/projects/store/project.store"
import { useBetaFeedbackStore } from "@/features/beta/store/beta-feedback.store"
import { useAgentTaskService } from "@/features/agent-runtime/agent-task.service"

type NavView = "chat" | "project" | "task" | "skills" | "review" | "terminal" | "server"

const props = defineProps<{
  collapsed?: boolean
  activeView?: NavView
}>()

const emit = defineEmits<{
  "toggle-collapse": []
  "open-settings": []
  "open-mcp": []
  "nav-change": [view: NavView]
}>()

const threadStore = useThreadStore()
const projectStore = useProjectStore()
const betaStore = useBetaFeedbackStore()
const agentTaskSvc = useAgentTaskService()

function getProjectDisplayName(): string {
  const path = projectStore.currentProjectPath
  if (!path) return "未打开项目"
  const normalized = path.replace(/\\/g, "/")
  return normalized.split("/").filter(Boolean).pop() || "未命名项目"
}

const hasProject = computed(() => Boolean(projectStore.currentProjectPath))
const activeNav = computed<NavView>(() => props.activeView || "chat")

function handleNavClick(view: NavView) {
  emit("nav-change", view)
}

function handleNewThread() {
  const projectId = projectStore.currentProjectId || "__none__"
  const projectName = projectStore.currentProjectName || getProjectDisplayName()
  const title = projectStore.currentProjectPath ? `新任务：${projectName}` : "新线程"
  threadStore.createThread(title, projectId)
  emit("nav-change", "chat")
}

function handleSelfRepair() {
  if (!projectStore.currentProjectPath) return

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

  emit("nav-change", "task")

  void agentTaskSvc.runTask("self_repair", "扫描当前项目并给出可执行修复建议", {
    projectPath: projectStore.currentProjectPath,
    projectName,
    threadId: thread.id,
  })
}

const mainNavItems: Array<{ id: NavView; label: string; icon: any }> = [
  { id: "chat", label: "对话", icon: MessageSquare },
  { id: "project", label: "项目", icon: FolderGit2 },
  { id: "task", label: "任务", icon: Bot },
  { id: "review", label: "审查", icon: FileSearch },
  { id: "skills", label: "Skill", icon: Sparkles },
]

const toolNavItems: Array<{ id: NavView; label: string; icon: any }> = [
  { id: "terminal", label: "终端", icon: Terminal },
  { id: "server", label: "服务器", icon: Server },
]
</script>

<template>
  <aside class="v03-sidebar" :class="{ 'v03-sidebar--collapsed': collapsed }">
    <template v-if="!collapsed">
      <div class="v03-sidebar__section v03-sidebar__section--project">
        <ProjectSwitcher />
      </div>

      <nav class="v03-sidebar__nav">
        <button
          v-for="item in mainNavItems"
          :key="item.id"
          class="v03-sidebar__nav-item"
          :class="{ 'v03-sidebar__nav-item--active': activeNav === item.id }"
          :title="item.label"
          @click="handleNavClick(item.id)"
        >
          <component :is="item.icon" :size="17" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="v03-sidebar__divider" />

      <div class="v03-sidebar__tool-head">工具</div>
      <nav class="v03-sidebar__nav v03-sidebar__nav--tools">
        <button
          v-for="item in toolNavItems"
          :key="item.id"
          class="v03-sidebar__nav-item v03-sidebar__nav-item--tool"
          :class="{ 'v03-sidebar__nav-item--active': activeNav === item.id }"
          :title="item.label"
          @click="handleNavClick(item.id)"
        >
          <component :is="item.icon" :size="15" />
          <span>{{ item.label }}</span>
        </button>
        <button class="v03-sidebar__nav-item v03-sidebar__nav-item--tool" title="MCP" @click="emit('open-mcp')">
          <Server :size="15" />
          <span>MCP</span>
        </button>
      </nav>

      <div class="v03-sidebar__divider" />

      <section class="v03-sidebar__section">
        <div class="v03-sidebar__section-header">
          <span class="v03-sidebar__section-title">线程</span>
          <button class="v03-sidebar__new-btn" title="新建线程" @click="handleNewThread">
            <Plus :size="14" />
          </button>
        </div>

        <ThreadSearchBox />

        <div class="v03-sidebar__agent-card">
          <div class="v03-sidebar__agent-card-head">
            <Wrench :size="14" />
            <span>自修复 Agent</span>
          </div>
          <p class="v03-sidebar__agent-card-desc">
            {{ hasProject ? "基于当前项目上下文发起诊断与补丁流程。" : "先打开项目，才能启动自修复流程。" }}
          </p>
          <button
            class="v03-sidebar__agent-btn"
            :disabled="!hasProject"
            :title="hasProject ? '启动自修复' : '请先打开项目'"
            @click="handleSelfRepair"
          >
            <Wrench :size="13" />
            <span>{{ hasProject ? "启动自修复" : "未打开项目" }}</span>
          </button>
        </div>

        <div class="v03-sidebar__thread-helper">
          当前项目：{{ projectStore.currentProjectName || getProjectDisplayName() }}
        </div>

        <div class="v03-sidebar__thread-list">
          <ThreadList />
        </div>
      </section>

      <div class="v03-sidebar__divider" />

      <div class="v03-sidebar__bottom">
        <button class="v03-sidebar__tool-btn" title="设置" @click="emit('open-settings')">
          <Settings :size="15" />
          <span>设置</span>
        </button>
        <button class="v03-sidebar__tool-btn" title="反馈" @click="betaStore.openFeedbackDialog()">
          <Bug :size="15" />
          <span>反馈</span>
        </button>
      </div>
    </template>

    <button class="v03-sidebar__collapse-btn" title="收起侧栏" @click="emit('toggle-collapse')">
      <PanelLeftClose :size="16" />
    </button>
  </aside>
</template>

<style scoped>
.v03-sidebar {
  display: flex;
  flex-direction: column;
  width: 240px;
  height: 100%;
  flex-shrink: 0;
  gap: 6px;
  padding: 12px;
  overflow: hidden;
  border-right: 1px solid var(--ls-border-default);
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
}

.v03-sidebar--collapsed {
  width: 50px;
  padding: 8px;
  align-items: center;
}

.v03-sidebar__section {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}

.v03-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.v03-sidebar__nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--ls-text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 140ms ease;
}

.v03-sidebar__nav-item:hover {
  background: var(--ls-bg-muted);
  color: var(--ls-text-primary);
}

.v03-sidebar__nav-item--active {
  background: var(--ls-brand-50);
  color: var(--ls-brand-500);
  font-weight: 600;
}

.v03-sidebar__nav-item--tool {
  font-size: 12px;
}

.v03-sidebar__tool-head,
.v03-sidebar__section-title {
  padding: 0 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ls-text-subtle);
}

.v03-sidebar__divider {
  height: 1px;
  margin: 2px 0;
  background: var(--ls-border-default);
}

.v03-sidebar__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.v03-sidebar__new-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 8px;
  background: var(--ls-accent-soft);
  color: var(--ls-accent);
  cursor: pointer;
}

.v03-sidebar__new-btn:hover {
  background: var(--ls-accent);
  color: #fff;
}

.v03-sidebar__agent-card {
  padding: 12px;
  border: 1px solid var(--ls-border-default);
  border-radius: 16px;
  background: var(--ls-bg-soft);
}

.v03-sidebar__agent-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  color: var(--ls-text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.v03-sidebar__agent-card-desc {
  margin: 0 0 10px;
  color: var(--ls-text-subtle);
  font-size: 12px;
  line-height: 1.5;
}

.v03-sidebar__agent-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: var(--ls-accent);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.v03-sidebar__agent-btn:disabled {
  background: var(--ls-bg-muted);
  color: var(--ls-text-subtle);
  cursor: not-allowed;
}

.v03-sidebar__thread-helper {
  padding: 0 4px;
  color: var(--ls-text-subtle);
  font-size: 11px;
}

.v03-sidebar__thread-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.v03-sidebar__bottom {
  display: flex;
  gap: 6px;
}

.v03-sidebar__tool-btn,
.v03-sidebar__collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--ls-text-subtle);
  font-size: 12px;
  cursor: pointer;
}

.v03-sidebar__tool-btn:hover,
.v03-sidebar__collapse-btn:hover {
  background: var(--ls-bg-muted);
  color: var(--ls-text-primary);
}

.v03-sidebar__collapse-btn {
  width: 28px;
  height: 28px;
  margin-top: auto;
  padding: 0;
}
</style>
