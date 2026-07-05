<script setup lang="ts">
/**
 * FileTreePanel — 文件树面板
 * 左侧递归展开、点击文件打开、与编辑区联动
 */
import { computed } from 'vue'
import { useWorkspaceStore } from '../store/workspace.store'
import { useFileTree } from '../composables/useFileTree'
import { TauriService } from '@/services/ipc/tauri.service'
import { FolderOpen, RefreshCw } from 'lucide-vue-next'
import FileTreeNode from './FileTreeNode.vue'

const ws = useWorkspaceStore()
const ft = useFileTree()

const childPaths = computed(() => {
  const rc = ft.rootChildren.value
  if (!Array.isArray(rc) || rc.length === 0) return []
  return rc.filter((p): p is string => typeof p === 'string' && p.length > 0)
})

/** 点击文件 → 读取内容 → 打开编辑器 Tab */
async function handleFileClick(path: string) {
  const node = ft.nodes[path]
  if (!node) return
  if (node.isDirectory) {
    ft.toggleExpand(path)
    return
  }
  try {
    const content = await TauriService.readFile(path)
    const lang = node.name.split('.').pop() ?? 'plaintext'
    ws.selectFile(path, node.name, content, lang)
  } catch {
    ws.selectFile(path, node.name, '', 'plaintext')
  }
}

/** 点击目录 → 展开/折叠 */
function handleToggle(path: string) {
  ft.toggleExpand(path)
}

/** 刷新根目录 */
function refreshRoot() {
  const rp = ft.rootPath.value
  if (rp) ft.setRoot(rp)
}

/** 打开文件夹 */
async function openRoot() {
  await ft.setRoot('g:/灵栈LingStack')
}
</script>

<template>
  <div class="file-tree">
    <div class="file-tree__header">
      <span v-if="ft.rootPath.value" class="file-tree__root">
        <FolderOpen :size="14" /> {{ ft.rootPath.value }}
      </span>
      <button
        v-if="ft.rootPath.value"
        class="file-tree__refresh"
        @click="refreshRoot"
      >
        <RefreshCw :size="12" />
      </button>
    </div>
    <div class="file-tree__body">
      <div v-if="!ft.rootPath.value" class="file-tree__empty">
        <button class="file-tree__empty-btn" @click="openRoot">
          <FolderOpen :size="14" /> 打开文件夹
        </button>
      </div>
      <template v-else>
        <FileTreeNode
          v-for="cp in childPaths"
          :key="cp"
          :nodePath="cp"
          :nodes="ft.nodes"
          :onToggle="handleToggle"
          :onFileClick="handleFileClick"
          :depth="0"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.file-tree { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.file-tree__header { display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; border-bottom: 1px solid var(--ls-border-soft); flex-shrink: 0; }
.file-tree__root { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--ls-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }
.file-tree__refresh { display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border: none; border-radius: 4px; background: transparent; color: var(--ls-text-subtle); cursor: pointer; flex-shrink: 0; }
.file-tree__refresh:hover { background: var(--ls-bg-panel-hover); color: var(--ls-text-muted); }
.file-tree__body { flex: 1; overflow-y: auto; padding: 4px 0; }
.file-tree__empty { display: flex; align-items: center; justify-content: center; padding: 32px; }
.file-tree__empty-btn { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border: 1px solid var(--ls-border-soft); border-radius: 4px; background: var(--ls-bg-elevated); color: var(--ls-text-secondary); font-size: 12px; cursor: pointer; transition: all 0.12s; }
.file-tree__empty-btn:hover { border-color: var(--ls-accent); color: var(--ls-accent); }
</style>
