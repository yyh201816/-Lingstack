<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue"
import { Server, Sparkles, Terminal } from "lucide-vue-next"
import WorkbenchTopBar from "./parts/WorkbenchTopBar.vue"
import LeftSidebar from "./parts/LeftSidebar.vue"
import MainTaskWorkspace from "./parts/MainTaskWorkspace.vue"
import RightReviewPane from "./parts/RightReviewPane.vue"
import SettingsPanel from "@/features/settings/components/SettingsPanel.vue"
import BetaFeedbackDialog from "@/features/beta/components/BetaFeedbackDialog.vue"
import AgentConfirmDialog from "@/features/agent-runtime/AgentConfirmDialog.vue"
import { LsDrawer } from "@/design-system/components"
import { useProjectService } from "@/features/workspace/composables/useProjectService"
import { useWorkspaceStore } from "@/features/workspace/store/workspace.store"
import { useProjectStore } from "@/features/projects/store/project.store"
import { useThreadStore } from "@/features/threads/store/thread.store"
import { useThreadSessionStore } from "@/features/threads/store/thread-session.store"
import { useComposerStore } from "@/features/chat/store/composer.store"
import { useMcpStore } from "@/features/mcp/store/mcp.store"
import { useReviewStore } from "@/features/review/store/review.store"
import { useTerminalStore } from "@/features/terminal/store/terminal.store"
import { initGlobalShortcuts, disposeGlobalShortcuts } from "@/features/settings/services/shortcut-registry.service"
import { setCommandContext } from "@/services/command-registry.service"
import { parseDeepLink, handleDeepLink } from "@/services/deeplink-router.service"
import { useBetaFeedbackStore } from "@/features/beta/store/beta-feedback.store"
import { useAgentTaskStore } from "@/features/agent-runtime/agent-task.store"
import { initBuiltinTools } from "@/features/tool-runtime/tools"

type NavView = "chat" | "project" | "task" | "skills" | "review" | "terminal" | "server"

const leftCollapsed = ref(false)
const showSettings = ref(false)
const activeNavView = ref<NavView>("chat")
const manualReviewPane = ref(false)

const projectStore = useProjectStore()
const threadStore = useThreadStore()
const threadSessionStore = useThreadSessionStore()
const composerStore = useComposerStore()
const reviewStore = useReviewStore()
const terminalStore = useTerminalStore()
const mcpStore = useMcpStore()
const betaStore = useBetaFeedbackStore()
const agentTaskStore = useAgentTaskStore()
const workspaceStore = useWorkspaceStore()
const projectService = useProjectService()

const confirmVisible = ref(false)
const confirmTitle = ref("")
const confirmMessage = ref("")
const confirmDetail = ref("")
let pendingConfirmResolve: ((value: boolean) => void) | null = null

const activeThreadId = computed(() => threadStore.activeThread?.id || "")
const activeTask = computed(() =>
  activeThreadId.value ? agentTaskStore.getLatestTaskByThread(activeThreadId.value) : null,
)

const autoReviewVisible = computed(() => {
  const task = activeTask.value
  if (!task) return false

  return Boolean(task.diff)
    || task.status === "waiting_confirm"
    || task.status === "applying_patch"
    || (task.status === "completed" && task.patchStatus === "applied")
})

const shouldShowReviewPane = computed(() =>
  !showSettings.value && (manualReviewPane.value || autoReviewVisible.value),
)

const placeholderMeta = computed(() => {
  if (activeNavView.value === "skills") {
    return {
      title: "Skill 中心即将接入",
      desc: "内置 Skill 与自定义 Skill 管理能力正在接入中。",
      icon: Sparkles,
    }
  }

  if (activeNavView.value === "terminal") {
    return {
      title: "终端 Agent 即将接入",
      desc: "当前不会假装执行命令，终端能力会在后续版本接入。",
      icon: Terminal,
    }
  }

  return {
    title: "服务器 Agent 即将接入",
    desc: "当前不会假装连接服务器，部署与远程执行能力将后续接入。",
    icon: Server,
  }
})

function showConfirm(title: string, message: string, detail?: string): Promise<boolean> {
  confirmTitle.value = title
  confirmMessage.value = message
  confirmDetail.value = detail || ""
  confirmVisible.value = true
  return new Promise((resolve) => {
    pendingConfirmResolve = resolve
  })
}

function handleConfirm() {
  confirmVisible.value = false
  pendingConfirmResolve?.(true)
  pendingConfirmResolve = null
}

function handleCancel() {
  confirmVisible.value = false
  pendingConfirmResolve?.(false)
  pendingConfirmResolve = null
}

function handleOpenSettings() {
  showSettings.value = !showSettings.value
}

function handleNavChange(view: NavView) {
  activeNavView.value = view

  if (view === "review") {
    manualReviewPane.value = true
    reviewStore.setActiveReviewTab("review")
    return
  }

  if (view === "task" || view === "chat" || view === "project") {
    reviewStore.setActiveReviewTab("review")
  }

  if (!autoReviewVisible.value) {
    manualReviewPane.value = false
  }
}

function setupCommandContext() {
  setCommandContext({
    toggleSidebar: () => {
      leftCollapsed.value = !leftCollapsed.value
    },
    openSettings: () => {
      handleOpenSettings()
    },
  })
}

async function handleInitialDeepLink() {
  try {
    const hash = window.location.hash
    if (hash.startsWith("#lingstack:")) {
      const payload = parseDeepLink(hash.slice(1))
      if (payload) await handleDeepLink(payload)
    }
  } catch {
    // ignore
  }
}

async function recoverSession() {
  try {
    const raw = localStorage.getItem("lingstack_session")
    if (!raw) return
    const snapshot = JSON.parse(raw)
    if (!snapshot?.activeProject || !snapshot?.tabs?.length) return
    await projectService.openProjectPath(snapshot.activeProject)
    workspaceStore.restoreTabs(snapshot)
  } catch {
    // ignore
  }
}

function handleCloseReviewPane() {
  manualReviewPane.value = false
  if (!autoReviewVisible.value && activeNavView.value === "review") {
    activeNavView.value = "chat"
  }
}

onMounted(async () => {
  initBuiltinTools()
  agentTaskStore.hydrate()
  projectStore.hydrate()
  threadStore.hydrate()
  threadSessionStore.hydrate()
  composerStore.hydrate()
  reviewStore.hydrate()
  terminalStore.hydrate()
  mcpStore.checkAllServices()
  setupCommandContext()
  initGlobalShortcuts()
  await handleInitialDeepLink()
  await recoverSession()
  ;(window as any).__LINGSTACK_CONFIRM__ = showConfirm
})

onUnmounted(() => {
  disposeGlobalShortcuts()
  delete (window as any).__LINGSTACK_CONFIRM__
})
</script>

<template>
  <div class="v03-workbench">
    <WorkbenchTopBar @toggle-left="leftCollapsed = !leftCollapsed" @open-settings="handleOpenSettings" />

    <div class="v03-workbench__body">
      <LeftSidebar
        :collapsed="leftCollapsed"
        :active-view="activeNavView"
        @toggle-collapse="leftCollapsed = !leftCollapsed"
        @open-settings="handleOpenSettings"
        @open-mcp="manualReviewPane = true"
        @nav-change="handleNavChange"
      />

      <template v-if="!showSettings">
        <div v-if="activeNavView === 'skills' || activeNavView === 'terminal' || activeNavView === 'server'" class="v03-workbench__placeholder">
          <div class="v03-placeholder">
            <component :is="placeholderMeta.icon" :size="32" class="v03-placeholder__icon" />
            <h2 class="v03-placeholder__title">{{ placeholderMeta.title }}</h2>
            <p class="v03-placeholder__desc">{{ placeholderMeta.desc }}</p>
            <div v-if="activeNavView === 'skills'" class="v03-placeholder__actions">
              <button class="v03-placeholder__btn" disabled>创建 Skill</button>
              <button class="v03-placeholder__btn" disabled>查看内置 Skill</button>
            </div>
          </div>
        </div>

        <MainTaskWorkspace
          v-else
          :view="activeNavView === 'project' ? 'project' : 'chat'"
        />
      </template>

      <RightReviewPane v-if="shouldShowReviewPane" @close="handleCloseReviewPane" />
    </div>

    <BetaFeedbackDialog v-if="betaStore.showFeedbackDialog" @close="betaStore.closeFeedbackDialog()" />
  </div>

  <AgentConfirmDialog
    :visible="confirmVisible"
    :title="confirmTitle"
    :message="confirmMessage"
    :detail="confirmDetail"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />

  <LsDrawer :visible="showSettings" title="设置" width="560px" @close="showSettings = false">
    <SettingsPanel />
  </LsDrawer>
</template>

<style scoped>
.v03-workbench {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--ls-bg-app, #f6f8fc);
  color: var(--ls-text-primary, #111827);
}

.v03-workbench__body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.v03-workbench__placeholder {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
}

.v03-placeholder {
  max-width: 420px;
  padding: 40px;
  text-align: center;
}

.v03-placeholder__icon {
  margin-bottom: 16px;
  color: var(--ls-text-subtle);
  opacity: 0.45;
}

.v03-placeholder__title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 650;
  color: var(--ls-text-muted);
}

.v03-placeholder__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--ls-text-subtle);
}

.v03-placeholder__actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.v03-placeholder__btn {
  padding: 8px 14px;
  border: 1px solid var(--ls-border-default);
  border-radius: 10px;
  background: var(--ls-bg-soft);
  color: var(--ls-text-subtle);
  font-size: 12px;
}
</style>
