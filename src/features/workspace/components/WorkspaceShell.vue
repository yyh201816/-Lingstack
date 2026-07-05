<script setup lang="ts">
import { useWorkspaceStore } from '../store/workspace.store'
import { useTerminalStore } from '@/features/terminal/store/terminal.store'
import WorkspaceHeader from './WorkspaceHeader.vue'
import EditorTabs from './EditorTabs.vue'
import EditorEmptyState from './EditorEmptyState.vue'
import MonacoEditorPane from '@/features/editor/components/MonacoEditorPane.vue'
import FileTreePanel from './FileTreePanel.vue'
import TerminalPane from '@/features/terminal/components/TerminalPane.vue'

const ws = useWorkspaceStore()
const termStore = useTerminalStore()
</script>

<template>
  <div class="ws-shell">
    <WorkspaceHeader />
    <div class="ws-shell__body">
      <!-- 左侧文件树 -->
      <aside class="ws-shell__file-tree">
        <FileTreePanel />
      </aside>

      <!-- 中间编辑区 + 底部终端 -->
      <div class="ws-shell__editor">
        <div class="ws-shell__editor-top" :class="{ 'ws-shell__editor-top--full': !termStore.isOpen }">
          <EditorTabs />
          <div class="ws-shell__content">
            <EditorEmptyState v-if="!ws.hasOpenTabs" />
            <MonacoEditorPane v-else />
          </div>
        </div>
        <TerminalPane />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ws-shell { display: flex; flex-direction: column; height: 100%; }
.ws-shell__body { display: flex; flex: 1; min-height: 0; overflow: hidden; }
.ws-shell__file-tree { width: 240px; flex-shrink: 0; border-right: 1px solid var(--ls-border-soft); background: var(--ls-bg-shell); overflow: hidden; }
.ws-shell__editor { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ws-shell__editor-top { flex: 1; min-height: 0; display: flex; flex-direction: column; border-bottom: 1px solid var(--ls-border-soft); }
.ws-shell__editor-top--full { border-bottom: none; }
.ws-shell__content { flex: 1; display: flex; background: var(--ls-bg-surface); overflow: hidden; }
</style>
