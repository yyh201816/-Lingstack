const fs = require('fs');
const B = 'g:/LingStack-nexT/src';

function w(rel, content) {
  const p = B + '/' + rel;
  const dir = p.substring(0, p.lastIndexOf('/'));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, content, 'utf-8');
  console.log('✓ ' + rel);
}

// ============================================================
// R3.4: xterm.js 终端接入
// ============================================================

// ---- useTerminal composable ----
w('features/terminal/composables/useTerminal.ts',
`/**
 * useTerminal — xterm.js 终端管理
 *
 * 职责：创建/销毁 xterm 实例、尺寸适配、输入事件、
 *       与 store 联动（isOpen、active terminal）
 *
 * 当前浏览器模式仅做容器展示，Tauri 环境可接 shell plugin。
 */
import { ref, type Ref } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'

export function useTerminal() {
  const term = ref<Terminal | null>(null)
  const fitAddon = new FitAddon()

  /** 在目标容器中创建终端 */
  function createTerminal(container: HTMLElement): Terminal {
    const t = new Terminal({
      fontSize: 13,
      fontFamily: "var(--ls-font-mono, 'JetBrains Mono', 'Cascadia Code', Consolas, monospace)",
      cursorBlink: true,
      cursorStyle: 'bar',
      allowProposedApi: true,
      scrollback: 5000,
      theme: {
        background: '#f5f7fb',
        foreground: '#111827',
        cursor: '#4f6ef7',
        selectionBackground: 'rgba(79,110,247,0.15)',
        black: '#f1f5f9',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#4f6ef7',
        magenta: '#a855f7',
        cyan: '#0ea5e9',
        white: '#334155',
        brightBlack: '#94a3b8',
        brightRed: '#f87171',
        brightGreen: '#34d399',
        brightYellow: '#fbbf24',
        brightBlue: '#6b8cf8',
        brightMagenta: '#c084fc',
        brightCyan: '#38bdf8',
        brightWhite: '#e8edf4',
      },
    })

    t.loadAddon(fitAddon)
    try { t.loadAddon(new WebglAddon()) } catch { /* fallback */ }

    t.open(container)
    fitAddon.fit()

    // 欢迎信息
    t.writeln('  LingStack-nexT Terminal')
    t.writeln('  ──────────────────────')
    t.writeln('')

    term.value = t
    return t
  }

  /** 写入终端 */
  function write(text: string) {
    term.value?.write(text)
  }

  /** 写入行 */
  function writeln(text: string) {
    term.value?.writeln(text)
  }

  /** 调整尺寸 */
  function fit() {
    try { fitAddon.fit() } catch { /* ignore */ }
  }

  /** 销毁 */
  function dispose() {
    term.value?.dispose()
    term.value = null
  }

  return { term, createTerminal, write, writeln, fit, dispose }
}
`);

// ---- TerminalPane.vue (rewrite) ----
w('features/terminal/components/TerminalPane.vue',
`<script setup lang="ts">
/**
 * TerminalPane — 终端面板容器
 *
 * 挂在 WorkspaceShell 底部，通过 terminalStore.isOpen 控制显隐。
 * 使用 xterm.js + FitAddon + WebglAddon。
 */
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useTerminalStore } from '../store/terminal.store'
import { useThemeStore } from '@/stores/theme.store'
import { useTerminal } from '../composables/useTerminal'
import { X, Plus, Trash2 } from 'lucide-vue-next'

const termStore = useTerminalStore()
const themeStore = useThemeStore()
const { createTerminal, dispose, fit } = useTerminal()

const containerRef = ref<HTMLDivElement>()

onMounted(() => {
  if (containerRef.value) {
    createTerminal(containerRef.value)
  }
})

onBeforeUnmount(() => {
  dispose()
})

// 窗口大小变化时调整终端尺寸
function handleResize() {
  fit()
}

watch(() => termStore.isOpen, (open) => {
  if (open) {
    nextTick(() => fit())
  }
})
</script>

<template>
  <div v-if="termStore.isOpen" class="terminal-pane" @resize="handleResize">
    <!-- 工具栏 -->
    <div class="terminal-pane__toolbar">
      <div class="terminal-pane__tabs">
        <span class="terminal-pane__tab terminal-pane__tab--active">终端</span>
      </div>
      <div class="terminal-pane__actions">
        <button class="terminal-pane__close" title="关闭终端" @click="termStore.toggle()">
          <X :size="14" />
        </button>
      </div>
    </div>

    <!-- xterm 容器 -->
    <div ref="containerRef" class="terminal-pane__body" />
  </div>
</template>

<style scoped>
.terminal-pane {
  display: flex; flex-direction: column;
  height: 220px; flex-shrink: 0;
  border-top: 1px solid var(--ls-border-soft);
  background: var(--ls-bg-app);
}

.terminal-pane__toolbar {
  display: flex; align-items: center; justify-content: space-between;
  height: 28px; padding: 0 var(--ls-space-2);
  background: var(--ls-bg-surface);
  border-bottom: 1px solid var(--ls-divider);
}

.terminal-pane__tabs { display: flex; align-items: center; }
.terminal-pane__tab {
  padding: 4px 12px; font-size: 10px; color: var(--ls-text-muted);
  border-radius: var(--ls-radius-xs);
}
.terminal-pane__tab--active { color: var(--ls-text-primary); background: var(--ls-bg-panel-hover); }
.terminal-pane__actions { display: flex; align-items: center; gap: 4px; }
.terminal-pane__close { display: flex; padding: 2px; border-radius: 3px; color: var(--ls-text-muted); }
.terminal-pane__close:hover { background: var(--ls-bg-panel-hover); color: var(--ls-text-primary); }

.terminal-pane__body { flex: 1; overflow: hidden; padding-left: 8px; }
</style>
`);

// ---- Update terminal store ----
w('features/terminal/store/terminal.store.ts',
`import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTerminalStore = defineStore('terminal', () => {
  const isOpen = ref(false)

  function toggle() { isOpen.value = !isOpen.value }
  function open()  { isOpen.value = true }
  function close() { isOpen.value = false }

  return { isOpen, toggle, open, close }
})
`);

// ---- Update WorkspaceShell with integrated terminal ----
w('features/workspace/components/WorkspaceShell.vue',
`<script setup lang="ts">
import { useWorkspaceStore } from '../store/workspace.store'
import { useTerminalStore } from '@/features/terminal/store/terminal.store'
import WorkspaceHeader from './WorkspaceHeader.vue'
import EditorTabs from './EditorTabs.vue'
import EditorEmptyState from './EditorEmptyState.vue'
import MonacoEditorPane from '@/features/editor/components/MonacoEditorPane.vue'
import FileTreePanel from './FileTreePanel.vue'
import TerminalPane from '@/features/terminal/components/TerminalPane.vue'
import { Terminal } from 'lucide-vue-next'

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
        <!-- 编辑区上半 -->
        <div class="ws-shell__editor-top">
          <EditorTabs />
          <div class="ws-shell__content">
            <EditorEmptyState v-if="!ws.hasOpenTabs" />
            <MonacoEditorPane v-else />
          </div>
        </div>

        <!-- 终端面板 -->
        <TerminalPane />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ws-shell { display: flex; flex-direction: column; height: 100%; }
.ws-shell__body { display: flex; flex: 1; min-height: 0; }
.ws-shell__file-tree { width: 240px; flex-shrink: 0; border-right: 1px solid var(--ls-border-soft); background: var(--ls-bg-shell); overflow: hidden; }
.ws-shell__editor { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ws-shell__editor-top { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.ws-shell__content { flex: 1; display: flex; background: var(--ls-bg-surface); overflow: hidden; }
</style>
`);

console.log('\\nR3.4 Terminal done.');
