import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useWorkspaceStore } from '@/features/workspace/store/workspace.store'

interface EditorState { filePath: string; language: string; content: string; isDirty: boolean }

export const useEditorStore = defineStore('editor', () => {
  const active = ref<EditorState | null>(null)

  /** 记录所有打开文件的编辑内容（含未保存改动） */
  const editedContentMap = ref<Record<string, string>>({})

  /** 当前是否 dirty */
  const isActiveDirty = computed(() => active.value?.isDirty ?? false)

  function setActive(filePath: string, content: string, language: string) {
    const resolvedContent = editedContentMap.value[filePath] ?? content
    active.value = { filePath, content: resolvedContent, language, isDirty: resolvedContent !== content }
  }

  /** 编辑器内容变更回调（跨 Tab 保留） */
  function onContentChange(filePath: string, newContent: string, originalContent: string) {
    editedContentMap.value[filePath] = newContent
    const ws = useWorkspaceStore()
    ws.setEditedContent(filePath, newContent)
    ws.markDirty(filePath, newContent !== originalContent)
    if (active.value?.filePath === filePath) {
      active.value.isDirty = newContent !== originalContent
    }
  }

  /** 保存当前激活文件 */
  async function saveActiveFile() {
    const ws = useWorkspaceStore()
    const tab = ws.activeTab
    if (!tab) return { success: false, reason: 'no_active_tab' }
    const content = editedContentMap.value[tab.filePath] ?? tab.content
    // TODO: 后续接入 Tauri fs.writeTextFile
    ws.onSaved(tab.filePath, content)
    active.value!.isDirty = false
    return { success: true, filePath: tab.filePath }
  }

  return { active, editedContentMap, isActiveDirty, setActive, onContentChange, saveActiveFile }
})
