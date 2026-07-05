<script setup lang="ts">
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
