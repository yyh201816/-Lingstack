<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { FileSearch, Server, Terminal, Zap } from "lucide-vue-next"
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

type NavView = "chat" | "project" | "skills" | "review" | "terminal" | "server"

const leftCollapsed = ref(false)
const rightVisible = ref(true)
const showSettings = ref(false)
const activeNavView = ref<NavView>("chat")

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

const hasProject = computed(() => Boolean(projectStore.currentProjectPath))
const hasDiff = computed(() => Boolean(agentTaskStore.activeTask?.diff))

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

watch(
  () => reviewStore.activeReviewTab,
  (tab) => {
    if (tab === "review" || tab === "terminal" || tab === "git") {
      rightVisible.value = true
    }
  },
)

function handleOpenSettings() {
  showSettings.value = !showSettings.value
}

function handleNavChange(view: string) {
  activeNavView.value = view as NavView
  rightVisible.value = true

  if (view === "review") {
    reviewStore.setActiveReviewTab("review")
  } else if (view === "terminal") {
    reviewStore.setActiveReviewTab("terminal")
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
  <div class="v02-workbench">
    <WorkbenchTopBar @toggle-left="leftCollapsed = !leftCollapsed" @open-settings="handleOpenSettings" />

    <div class="v02-workbench__body">
      <LeftSidebar
        :collapsed="leftCollapsed"
        @toggle-collapse="leftCollapsed = !leftCollapsed"
        @open-settings="handleOpenSettings"
        @open-mcp="rightVisible = true"
        @nav-change="handleNavChange"
      />

      <template v-if="!showSettings">
        <div v-if="activeNavView === 'skills'" class="v02-workbench__placeholder">
          <div class="v02-placeholder">
            <Zap :size="32" class="v02-placeholder__icon" />
            <h2 class="v02-placeholder__title">Skill 中心即将接入</h2>
            <p class="v02-placeholder__desc">内置 Skill 与自定义 Skill 管理能力正在接入中。</p>
            <div class="v02-placeholder__actions">
              <button class="v02-placeholder__btn" disabled>创建 Skill</button>
              <button class="v02-placeholder__btn" disabled>查看内置 Skill</button>
            </div>
          </div>
        </div>

        <div v-else-if="activeNavView === 'terminal'" class="v02-workbench__placeholder">
          <div class="v02-placeholder">
            <Terminal :size="32" class="v02-placeholder__icon" />
            <h2 class="v02-placeholder__title">终端 Agent 即将接入</h2>
            <p class="v02-placeholder__desc">当前不会假装执行命令，终端能力将在后续版本接入。</p>
          </div>
        </div>

        <div v-else-if="activeNavView === 'server'" class="v02-workbench__placeholder">
          <div class="v02-placeholder">
            <Server :size="32" class="v02-placeholder__icon" />
            <h2 class="v02-placeholder__title">服务器 Agent 即将接入</h2>
            <p class="v02-placeholder__desc">当前不会假装连接服务器，SSH 与部署能力后续接入。</p>
          </div>
        </div>

        <div v-else-if="activeNavView === 'review'" class="v02-workbench__placeholder">
          <div class="v02-placeholder">
            <FileSearch :size="32" class="v02-placeholder__icon" />
            <h2 class="v02-placeholder__title">{{ hasDiff ? "审查面板已同步到右侧" : "暂无可审查变更" }}</h2>
            <p class="v02-placeholder__desc">
              {{ hasDiff ? "当前任务的变更文件和 Diff 摘要已显示在右侧审查面板。" : "当任务产生真实代码变更后，这里和右侧会同步显示审查内容。" }}
            </p>
          </div>
        </div>

        <MainTaskWorkspace
          v-else
          :view="activeNavView === 'project' ? 'project' : 'chat'"
        />
      </template>

      <RightReviewPane v-if="rightVisible && !showSettings" @close="rightVisible = false" />
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

  <LsDrawer :visible="showSettings" title="设置" @close="showSettings = false">
    <SettingsPanel />
  </LsDrawer>
</template>

<style scoped>
.v02-workbench {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--ls-bg-app, #f6f8fc);
  color: var(--ls-text-primary, #111827);
}

.v02-workbench__body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.v02-workbench__placeholder {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
}

.v02-placeholder {
  max-width: 420px;
  padding: 40px;
  text-align: center;
}

.v02-placeholder__icon {
  margin-bottom: 16px;
  color: var(--ls-text-subtle);
  opacity: 0.4;
}

.v02-placeholder__title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 650;
  color: var(--ls-text-muted);
}

.v02-placeholder__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--ls-text-subtle);
}

.v02-placeholder__actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.v02-placeholder__btn {
  padding: 8px 14px;
  border: 1px solid var(--ls-border-default);
  border-radius: 10px;
  background: var(--ls-bg-soft);
  color: var(--ls-text-subtle);
  font-size: 12px;
}
</style>
