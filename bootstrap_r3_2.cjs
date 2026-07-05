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
// R3.2: Monaco Editor 接入 editor feature
// ============================================================

w('features/editor/components/MonacoEditorPane.vue',
`<script setup lang="ts">
/**
 * MonacoEditorPane — 编辑器主舞台
 *
 * 方案：monaco-editor 作为纯编辑器内核。
 * 数据流：
 *   workspaceStore.activeTab.content ←→ Monaco.getValue()/setValue()
 *   workspaceStore.setEditedContent() → 跨 Tab 保留未保存改动
 *
 * 主题：跟随 document.documentElement.dataset.theme
 *   light → vs
 *   dark  → vs-dark
 */
import { ref, watch, onBeforeUnmount, computed } from 'vue'
import { useWorkspaceStore } from '@/features/workspace/store/workspace.store'
import { useThemeStore } from '@/stores/theme.store'
import * as monaco from 'monaco-editor'
import { TauriService } from '@/services/ipc/tauri.service'

const wsStore = useWorkspaceStore()
const themeStore = useThemeStore()

const editorContainer = ref<HTMLDivElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null

const showEditor = computed(() => wsStore.hasOpenTabs && !!wsStore.activeTab)

/** 创建编辑器实例 */
function createEditor() {
  if (!editorContainer.value || !wsStore.activeTab) return

  const lang = wsStore.activeTab.language
  const content = wsStore.activeTab.content

  if (editor) editor.dispose()

  editor = monaco.editor.create(editorContainer.value, {
    value: content,
    language: lang,
    theme: themeStore.mode === 'dark' ? 'vs-dark' : 'vs',
    fontSize: 13,
    fontFamily: "var(--ls-font-mono, 'JetBrains Mono', 'Cascadia Code', Consolas, monospace)",
    lineHeight: 22,
    minimap: { enabled: true, scale: 1, showSlider: 'mouseover' as const },
    scrollBeyondLastLine: false,
    wordWrap: 'off',
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    renderLineHighlight: 'line',
    bracketPairColorization: { enabled: true },
    autoIndent: 'full',
    formatOnPaste: true,
    tabSize: 2,
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    padding: { top: 12 },
  })

  // 编辑变更 → store
  editor.onDidChangeModelContent(() => {
    if (editor && wsStore.activeTab) {
      const newContent = editor.getValue()
      wsStore.setEditedContent(wsStore.activeTab.filePath, newContent)
      wsStore.markDirty(wsStore.activeTab.filePath, true)
    }
  })

  // Ctrl+S → 保存
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    handleSave()
  })

  // 焦点时通知外部（可用于状态栏更新）
  editor.onDidFocusEditorText(() => {
    // placeholder for future cursor position tracking
  })
}

/** 销毁编辑器 */
function disposeEditor() {
  if (editor) {
    editor.dispose()
    editor = null
  }
}

/** 保存当前文件 */
async function handleSave() {
  const tab = wsStore.activeTab
  if (!tab) return
  const content = editor?.getValue() ?? tab.content
  await TauriService.writeFile(tab.filePath, content)
  wsStore.onSaved(tab.filePath, content)
}

// ---- 生命周期 ----

// 切换 Tab 时重新创建编辑器
watch(() => wsStore.activeTabId, (newId, oldId) => {
  // 先保存旧 Tab 内容到 editedContentMap
  if (oldId && editor) {
    const oldTab = wsStore.tabs.find(t => t.id === oldId)
    if (oldTab) {
      wsStore.setEditedContent(oldTab.filePath, editor.getValue())
    }
  }
  if (newId) {
    // 延迟等 DOM 渲染
    setTimeout(createEditor, 0)
  } else {
    disposeEditor()
  }
}, { immediate: false })

// 主题切换
watch(() => themeStore.mode, (mode) => {
  monaco.editor.setTheme(mode === 'dark' ? 'vs-dark' : 'vs')
})

onBeforeUnmount(() => {
  disposeEditor()
})
</script>

<template>
  <div class="monaco-pane">
    <div ref="editorContainer" class="monaco-pane__editor" />
  </div>
</template>

<style scoped>
.monaco-pane {
  flex: 1; min-height: 0; position: relative;
}
.monaco-pane__editor {
  width: 100%; height: 100%;
}
</style>
`);

// ---- Update WorkspaceShell to include MonacoEditorPane ----
w('features/workspace/components/WorkspaceShell.vue',
`<script setup lang="ts">
import { useWorkspaceStore } from '../store/workspace.store'
import WorkspaceHeader from './WorkspaceHeader.vue'
import EditorTabs from './EditorTabs.vue'
import EditorEmptyState from './EditorEmptyState.vue'
import MonacoEditorPane from '@/features/editor/components/MonacoEditorPane.vue'

const ws = useWorkspaceStore()
</script>

<template>
  <div class="ws-shell">
    <WorkspaceHeader />
    <div class="ws-shell__body">
      <!-- 左侧文件树占位（R3.3 接入） -->
      <aside class="ws-shell__file-tree">
        <div class="ws-file-tree-placeholder">
          <span class="ws-file-tree-placeholder__icon">📁</span>
          <span>文件树（R3.3 接入）</span>
        </div>
      </aside>

      <!-- 中间编辑区 -->
      <div class="ws-shell__editor">
        <EditorTabs />
        <div class="ws-shell__content">
          <EditorEmptyState v-if="!ws.hasOpenTabs" />
          <MonacoEditorPane v-else />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ws-shell { display: flex; flex-direction: column; height: 100%; }
.ws-shell__body { display: flex; flex: 1; min-height: 0; }
.ws-shell__file-tree { width: 240px; flex-shrink: 0; border-right: 1px solid var(--ls-border-soft); background: var(--ls-bg-shell); overflow-y: auto; }
.ws-file-tree-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--ls-space-2); padding: var(--ls-space-8); font-size: var(--ls-text-xs); color: var(--ls-text-subtle); }
.ws-file-tree-placeholder__icon { font-size: 24px; opacity: 0.4; }
.ws-shell__editor { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ws-shell__content { flex: 1; display: flex; align-items: center; justify-content: center; background: var(--ls-bg-surface); }
</style>
`);

// ---- Update TauriService to be fully importable ----
w('services/ipc/tauri.service.ts',
`/**
 * tauri.service.ts — Tauri 2 IPC 服务层
 *
 * 所有与 Rust 后端的通信通过此服务封装。
 * 浏览器模式下降级为 console.warn + 返回模拟值。
 *
 * import { TauriService } from '@/services/ipc/tauri.service'
 */

function isTauriEnv(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

async function getInvoke() {
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke as (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
}

/** 读取文件内容 */
async function readFile(path: string): Promise<string> {
  if (!isTauriEnv()) { console.warn('[tauri] readFile 非 Tauri 环境'); return '' }
  const invoke = await getInvoke()
  return invoke('read_file', { path }) as Promise<string>
}

/** 写入文件 */
async function writeFile(path: string, content: string): Promise<void> {
  if (!isTauriEnv()) { console.warn('[tauri] writeFile 非 Tauri 环境'); return }
  const invoke = await getInvoke()
  return invoke('write_file', { path, content }) as Promise<void>
}

/** 列出目录 */
async function listDir(path: string): Promise<string[]> {
  if (!isTauriEnv()) { console.warn('[tauri] listDir 非 Tauri 环境'); return [] }
  const invoke = await getInvoke()
  return invoke('list_dir', { path }) as Promise<string[]>
}

export const TauriService = { readFile, writeFile, listDir }
`);

console.log('\\nR3.2 Monaco Editor done.');
