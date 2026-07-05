const fs = require('fs');
const B = 'g:/LingStack-nexT/src';

function w(rel, content) {
  const p = B + '/' + rel; fs.mkdirSync(p.substring(0, p.lastIndexOf('/')), { recursive: true });
  fs.writeFileSync(p, content, 'utf-8'); console.log('✓ ' + rel);
}

// ---- 分离递归节点为独立组件 ----
w('features/workspace/components/FileTreeNode.vue',
`<script setup lang="ts">
/**
 * FileTreeNode — 递归文件树节点
 *
 * self-referencing：Vue 3 SFC 可在 template 中使用自身名字实现递归
 */
import type { PropType } from 'vue'
import type { FileNode } from '../composables/useFileTree'
import { getFileIcon } from '../composables/useFileTree'
import { ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  nodePath: { type: String, required: true },
  nodes: { type: Object as PropType<Record<string, FileNode>>, required: true },
  onToggle: { type: Function as PropType<(p: string) => void>, required: true },
  onFileClick: { type: Function as PropType<(p: string) => void>, required: true },
  depth: { type: Number, default: 0 },
})

function getNode(): FileNode | undefined { return props.nodes[props.nodePath] }
function ext(): string { const n = getNode(); return n ? n.name.split('.').pop() || '' : '' }
</script>

<template>
  <div v-if="getNode()">
    <div
      class="ft-node"
      :style="{ paddingLeft: (depth * 16 + 8) + 'px' }"
      @click="onFileClick(nodePath)"
    >
      <span v-if="getNode().isDirectory" :class="['ft-node__chevron', { 'ft-node__chevron--open': getNode().expanded }]">
        <ChevronRight :size="12" />
      </span>
      <span class="ft-node__icon">
        {{ getNode().isDirectory ? (getNode().expanded ? '📂' : '📁') : getFileIcon(ext()) }}
      </span>
      <span class="ft-node__name">{{ getNode().name }}</span>
    </div>
    <!-- 递归子节点 -->
    <template v-if="getNode().isDirectory && getNode().expanded">
      <FileTreeNode
        v-for="childPath in getNode().children"
        :key="childPath"
        :nodePath="childPath"
        :nodes="nodes"
        :onToggle="onToggle"
        :onFileClick="onFileClick"
        :depth="depth + 1"
      />
    </template>
  </div>
</template>

<style>
.ft-node { display: flex; align-items: center; gap: 4px; height: 28px; padding-right: var(--ls-space-2); font-size: var(--ls-text-xs); color: var(--ls-text-secondary); cursor: pointer; white-space: nowrap; transition: background-color var(--ls-duration-fast); }
.ft-node:hover { background: var(--ls-bg-panel-hover); }
.ft-node__chevron { width: 14px; display: flex; align-items: center; justify-content: center; color: var(--ls-text-subtle); flex-shrink: 0; transition: transform 0.12s; }
.ft-node__chevron--open { transform: rotate(90deg); }
.ft-node__icon { font-size: 13px; flex-shrink: 0; }
.ft-node__name { overflow: hidden; text-overflow: ellipsis; }
</style>
`);

// ---- Update FileTreePanel to use standalone FileTreeNode ----
w('features/workspace/components/FileTreePanel.vue',
`<script setup lang="ts">
import { useWorkspaceStore } from '../store/workspace.store'
import { useFileTree } from '../composables/useFileTree'
import { TauriService } from '@/services/ipc/tauri.service'
import FileTreeNode from './FileTreeNode.vue'
import { FolderOpen, RefreshCw } from 'lucide-vue-next'

const wsStore = useWorkspaceStore()
const ft = useFileTree()

async function handleFileClick(nodePath: string) {
  const node = ft.nodes[nodePath]
  if (!node) return
  if (node.isDirectory) {
    ft.toggleExpand(nodePath)
    return
  }
  const content = await TauriService.readFile(nodePath)
  wsStore.selectFile(nodePath, node.name, content)
}

async function openRoot() {
  const testPath = 'g:/灵栈LingStack'
  await ft.setRoot(testPath)
}
</script>

<template>
  <div class="file-tree">
    <div class="file-tree__header">
      <span class="file-tree__root" v-if="ft.rootPath">
        <FolderOpen :size="14" />
        {{ ft.rootPath }}
      </span>
      <button v-if="ft.rootPath" class="file-tree__refresh" title="刷新" @click="ft.setRoot(ft.rootPath!)">
        <RefreshCw :size="12" />
      </button>
    </div>

    <div class="file-tree__body">
      <div v-if="!ft.rootPath" class="file-tree__empty">
        <button class="file-tree__open-btn" @click="openRoot">打开项目文件夹</button>
      </div>

      <template v-else>
        <FileTreeNode
          v-for="childPath in ft.rootChildren"
          :key="childPath"
          :nodePath="childPath"
          :nodes="ft.nodes"
          :onToggle="ft.toggleExpand"
          :onFileClick="handleFileClick"
          :depth="0"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.file-tree { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.file-tree__header { display: flex; align-items: center; justify-content: space-between; padding: var(--ls-space-2) var(--ls-space-3); border-bottom: 1px solid var(--ls-divider); }
.file-tree__root { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--ls-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-tree__refresh { padding: 3px; border-radius: var(--ls-radius-xs); color: var(--ls-text-subtle); }
.file-tree__refresh:hover { background: var(--ls-bg-panel-hover); color: var(--ls-text-muted); }
.file-tree__body { flex: 1; overflow-y: auto; padding: var(--ls-space-1) 0; }
.file-tree__empty { display: flex; align-items: center; justify-content: center; padding: var(--ls-space-8); }
.file-tree__open-btn { padding: 6px 14px; border-radius: var(--ls-radius-sm); font-size: var(--ls-text-xs); background: var(--ls-accent-soft); color: var(--ls-accent); font-weight: var(--ls-font-weight-medium); transition: background-color var(--ls-duration-fast); }
.file-tree__open-btn:hover { background: var(--ls-accent); color: var(--ls-text-on-accent); }
</style>
`);

// ---- Also add xterm CSS import to index.css ----
const idxCss = B + '/styles/index.css';
const current = fs.readFileSync(idxCss, 'utf-8');
if (!current.includes('@xterm/xterm/css')) {
  const updated = current.replace(
    "@import './base.css';",
    "@import '@xterm/xterm/css/xterm.css';\n@import './base.css';"
  );
  fs.writeFileSync(idxCss, updated, 'utf-8');
  console.log('✓ styles/index.css (added xterm CSS import)');
}

console.log('\\nR3.3 fix + R3.5 prep done.');
