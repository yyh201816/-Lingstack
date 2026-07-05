<!-- Legacy shell: superseded by src/layouts/codex-shell/CodexWorkbench.vue. -->
<script setup lang="ts">
/**
 * WorkbenchLayout — LingStack vNext 桌面工作台总壳
 *
 * 线框结构:
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ TopBar (48px)                                                       │
 * ├───────┬──────────────────────┬───────────────────────────────────────┤
 * │       │                      │                                       │
 * │  Nav  │     ProjectPanel     │           Main Workspace              │
 * │ 60px  │       272px          │         (nav 驱动视图切换)              │
 * │       │                      │                                       │
 * ├───────┴──────────────────────┴───────────────────────────────────────┤
 * │                         CommandBar                                    │
 * ├──────────────────────────────────────────────────────────────────────┤
 * │ StatusBar (28px)                                                     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Codex 风格：简洁克制、弱页面感、强工作区连续性
 *
 * 项目打开链路全部收敛于此，通过 useProjectService 统一管理。
 */
import { useNavigationStore } from '@/features/navigation/store/navigation.store'
import { useProjectService } from '@/features/workspace/composables/useProjectService'
import { useWorkspaceStore } from '@/features/workspace/store/workspace.store'
import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue'
import TopBar from './parts/TopBar.vue'
import SidebarNav from './parts/SidebarNav.vue'
import ProjectPanel from './parts/ProjectPanel.vue'
import AgentWelcome from './parts/AgentWelcome.vue'
import CommandBar from './parts/CommandBar.vue'
import StatusBar from './parts/StatusBar.vue'
import WorkspaceShell from '@/features/workspace/components/WorkspaceShell.vue'
import ChatPanel from '@/features/chat/ChatPanel.vue'
import SkillsPanel from '@/features/skills/components/SkillsPanel.vue'
import SettingsPanel from '@/features/settings/components/SettingsPanel.vue'
import TerminalPane from '@/features/terminal/components/TerminalPane.vue'

const nav = useNavigationStore()
const ps = useProjectService()
const ws = useWorkspaceStore()
const chatPanelRef = ref<InstanceType<typeof ChatPanel>>()
const isChatSending = ref(false)

// Watcher 清理
let unwatchSending: (() => void) | null = null

watch(chatPanelRef, (panel) => {
  if (unwatchSending) { unwatchSending(); unwatchSending = null }
  if (!panel) { isChatSending.value = false; return }
  const sendingRef = (panel as any).isSending as Ref<boolean> | undefined
  if (sendingRef) {
    unwatchSending = watch(sendingRef, (val) => {
      isChatSending.value = val
    }, { immediate: true })
  }
})

/** 统一打开项目入口：无参数 → Tauri dialog，有参数 → 直接打开路径 */
function handleOpenProject(path?: string) {
  if (path) {
    ps.openProjectPath(path)
  } else {
    ps.openProject()
  }
}

/** CommandBar 发送 → 切换到 Chat 视图并自动发送 */
function handleCommandBarSend(text: string) {
  nav.setView('chat' as any)
  // ChatPanel 通过 v-if 条件渲染，需要等 DOM 更新后调用
  setTimeout(() => {
    chatPanelRef.value?.receiveExternalMessage(text)
  }, 0)
}

/** 会话恢复：启动时检查是否有保存的工作区状态 */
onMounted(async () => {
  try {
    const raw = localStorage.getItem('lingstack_session')
    if (!raw) return
    const snapshot = JSON.parse(raw)
    if (!snapshot?.activeProject || !snapshot?.tabs?.length) return
    await ps.openProjectPath(snapshot.activeProject)
    ws.restoreTabs(snapshot)
  } catch { /* 静默失败，不影响正常启动 */ }
})

/** 窗口关闭前保存当前工作区状态 */
function onBeforeUnload() {
  ws.saveSession()
}

onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
})
</script>

<template>
  <div class="workbench">
    <!-- 1. TopBar — 桌面工具状态栏 -->
    <TopBar class="workbench__topbar" />

    <!-- 2. 主体：Nav + ProjectPanel + Main -->
    <div class="workbench__body">
      <!-- 2a. SidebarNav — AI 工具主导航 -->
      <SidebarNav class="workbench__sidenav" />

      <!-- 2b. ProjectPanel — 仅项目视图时显示 -->
      <ProjectPanel
        v-if="nav.activeView === 'project'"
        :has-project="nav.hasOpenProject"
        :recent-projects="ps.recentProjects.value"
        class="workbench__project-panel"
        @open-project="handleOpenProject"
      />

      <!-- 2c. 主工作区 -->
      <main class="workbench__main">
        <!-- 项目视图：未打开 → AgentWelcome，已打开 → WorkspaceShell -->
        <template v-if="nav.activeView === 'project'">
          <AgentWelcome
            v-if="!nav.hasOpenProject"
            :on-open-project="() => ps.openProject()"
          />
          <WorkspaceShell v-else />
        </template>
        <ChatPanel v-else-if="nav.activeView === 'chat'" ref="chatPanelRef" />
        <SkillsPanel v-else-if="nav.activeView === 'skills'" />
        <SettingsPanel v-else-if="nav.activeView === 'settings'" />
        <TerminalPane v-else-if="nav.activeView === 'terminal'" />
        <!-- 其他视图占位 -->
        <div v-else class="workbench__placeholder">
          <span class="workbench__placeholder-icon">◆</span>
          <h2 class="workbench__placeholder-title">
            {{ nav.activeView === 'servers' ? '服务器' : '模型' }}
          </h2>
          <p class="workbench__placeholder-desc">此模块将在后续版本开放。</p>
        </div>
      </main>
    </div>

    <!-- 3. CommandBar — 底部 Agent 命令中枢（R29.2: 聊天页隐藏，由 ChatPanel 作为唯一输入入口） -->
    <CommandBar v-if="nav.activeView !== 'chat'" class="workbench__cmdbar" :is-sending="isChatSending" @send="handleCommandBarSend" />

    <!-- 4. StatusBar — 状态提示行 -->
    <StatusBar class="workbench__statusbar" />
  </div>
</template>

<style scoped>
.workbench {
  display: flex; flex-direction: column;
  width: 100vw; height: 100vh; overflow: hidden;
  background: var(--ls-bg-app);
  color: var(--ls-text-primary);
}
.workbench__topbar    { flex-shrink: 0; }
.workbench__body      { display: flex; flex: 1; min-height: 0; overflow: hidden; }
.workbench__sidenav   { flex-shrink: 0; }
.workbench__project-panel { flex-shrink: 0; }
.workbench__cmdbar    { flex-shrink: 0; }
.workbench__statusbar { flex-shrink: 0; height: 28px; }

/* 主工作区 */
.workbench__main {
  flex: 1; min-width: 0; overflow: hidden;
  display: flex; flex-direction: column;
  background: var(--ls-bg-app);
}

/* 占位视图 */
.workbench__placeholder {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
.workbench__placeholder-icon {
  font-size: 28px; color: var(--ls-text-subtle); margin-bottom: 8px;
}
.workbench__placeholder-title {
  font-size: 15px; font-weight: 600; color: var(--ls-text-secondary);
  margin: 0 0 4px;
}
.workbench__placeholder-desc {
  font-size: 12px; color: var(--ls-text-subtle); margin: 0;
}
</style>
