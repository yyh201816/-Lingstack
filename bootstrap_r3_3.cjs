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
// R3.3: 文件树面板接入 Tauri FS
// ============================================================

// ---- useFileTree composable ----
w('features/workspace/composables/useFileTree.ts',
`/**
 * useFileTree — 文件树状态与操作
 *
 * 职责：展开/收起目录、懒加载子节点、文件选择
 * 数据源：TauriService.listDir()（Tauri 环境）或空数组（浏览器降级）
 *
 * 文件树节点类型扁平化存储（Map<path, node>），
 * children 为 string[]（子路径数组），方便递归渲染。
 */
import { ref, reactive } from 'vue'
import { TauriService } from '@/services/ipc/tauri.service'

export interface FileNode {
  name: string
  path: string
  isDirectory: boolean
  children: string[]         // 子路径数组
  expanded: boolean          // 是否已展开
  loaded: boolean            // 子节点是否已加载
}

/** 获取文件图标 emoji（按扩展名粗略映射） */
export function getFileIcon(ext: string): string {
  const map: Record<string, string> = {
    ts: '🔷', tsx: '⚛️', vue: '🟢', js: '🟨', jsx: '⚛️',
    json: '📋', css: '🎨', scss: '🎨', html: '🌐', md: '📝',
    py: '🐍', rs: '🦀', go: '🔵', java: '☕', cpp: '⚙️', c: '⚙️',
    png: '🖼️', jpg: '🖼️', svg: '🖼️', ico: '🖼️',
    gitignore: '⚙️', lock: '🔒', yml: '⚙️', yaml: '⚙️', toml: '⚙️',
  }
  return map[ext] || '📄'
}

export function useFileTree() {
  const rootPath = ref<string | null>(null)
  const nodes = reactive<Record<string, FileNode>>({})
  const rootChildren = ref<string[]>([])

  /** 设置根目录 */
  async function setRoot(path: string) {
    rootPath.value = path
    rootChildren.value = []
    // 清空旧节点
    Object.keys(nodes).forEach(k => delete nodes[k])

    const rootNode: FileNode = { name: path.split(/[/\\]/).pop() || path, path, isDirectory: true, children: [], expanded: true, loaded: false }
    nodes[path] = rootNode
    await loadChildren(path)
    rootChildren.value = rootNode.children
  }

  /** 懒加载目录子节点 */
  async function loadChildren(dirPath: string): Promise<void> {
    const node = nodes[dirPath]
    if (!node) return
    if (node.loaded) return

    try {
      const names = await TauriService.listDir(dirPath)
      const childPaths: string[] = []

      for (const name of names) {
        const childPath = dirPath.replace(/\\/g, '/') + '/' + name
        // 简单推断是否目录：无扩展名视为目录
        const isDir = !name.includes('.') || name.startsWith('.')
        const child: FileNode = { name, path: childPath, isDirectory: isDir, children: [], expanded: false, loaded: false }
        nodes[childPath] = child
        childPaths.push(childPath)
      }

      node.children = childPaths
      node.loaded = true
    } catch (e) {
      console.warn('[FileTree] listDir failed:', dirPath, e)
      node.loaded = true  // 失败也标记已加载，避免重复尝试
    }
  }

  /** 切换展开/收起 */
  async function toggleExpand(nodePath: string) {
    const node = nodes[nodePath]
    if (!node || !node.isDirectory) return

    if (!node.loaded) await loadChildren(nodePath)
    node.expanded = !node.expanded
  }

  return { rootPath, nodes, rootChildren, setRoot, loadChildren, toggleExpand }
}
`);

// ---- FileTreePanel.vue ----
w('features/workspace/components/FileTreePanel.vue',
`<script setup lang="ts">
/**
 * FileTreePanel — 左侧文件树面板
 *
 * 功能：
 *   - 打开项目根目录
 *   - 递归展开子目录
 *   - 点击文件 → workspaceStore.selectFile → 打开编辑器 + 切换到该 Tab
 *   - Icon：文件夹📁/📂，文件按扩展名 map
 *
 * 联动：点击文件后调用 workspaceStore.selectFile，
 *      会自动创建 Tab + 读取内容 + 切换到编辑器
 */
import { useWorkspaceStore } from '../store/workspace.store'
import { useFileTree, getFileIcon } from '../composables/useFileTree'
import { TauriService } from '@/services/ipc/tauri.service'
import FolderOpenIcon from 'lucide-vue-next/dist/esm/icons/folder-open'
import ChevronRightIcon from 'lucide-vue-next/dist/esm/icons/chevron-right'
import RefreshCw from 'lucide-vue-next/dist/esm/icons/refresh-cw'

const wsStore = useWorkspaceStore()
const ft = useFileTree()

/** 递归渲染节点组件 */
defineExpose({})

/** 处理文件点击 → 读内容 → 打开 Tab */
async function handleFileClick(nodePath: string) {
  const node = ft.nodes[nodePath]
  if (!node) return
  if (node.isDirectory) {
    ft.toggleExpand(nodePath)
    return
  }
  // 读文件内容
  const content = await TauriService.readFile(nodePath)
  wsStore.selectFile(nodePath, node.name, content)
}

/** 打开项目根目录 */
async function openRoot() {
  // 简化：用固定测试路径（后续接 open dialog）
  const testPath = 'g:/灵栈LingStack'
  await ft.setRoot(testPath)
}
</script>

<template>
  <div class="file-tree">
    <!-- 头部：项目路径 + 操作 -->
    <div class="file-tree__header">
      <span class="file-tree__root" v-if="ft.rootPath">
        <FolderOpenIcon :size="14" />
        {{ ft.rootPath }}
      </span>
      <button v-if="ft.rootPath" class="file-tree__refresh" title="刷新" @click="ft.setRoot(ft.rootPath!)">
        <RefreshCw :size="12" />
      </button>
    </div>

    <!-- 树节点列表 -->
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

<!-- ===== 递归节点子组件 ===== -->
<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { FileNode } from '../composables/useFileTree'
import FileIcon from 'lucide-vue-next/dist/esm/icons/file'

const TreeNode = defineComponent({
  name: 'FileTreeNode',
  props: {
    nodePath: { type: String, required: true },
    nodes: { type: Object as PropType<Record<string, FileNode>>, required: true },
    onToggle: { type: Function as PropType<(p: string) => void>, required: true },
    onFileClick: { type: Function as PropType<(p: string) => void>, required: true },
    depth: { type: Number, default: 0 },
  },
  setup(props) {
    return () => {
      const node = props.nodes[props.nodePath]
      if (!node) return null

      const indent = props.depth * 16
      const ext = node.name.split('.').pop() || ''
      const icon = node.isDirectory
        ? (node.expanded ? '📂' : '📁')
        : getFileIcon(ext)

      return (
        <div>
          <div
            class="ft-node"
            style={{ paddingLeft: (indent + 8) + 'px' }}
            onClick={() => props.onFileClick(props.nodePath)}
          >
            {node.isDirectory && (
              <span class={'ft-node__chevron' + (node.expanded ? ' ft-node__chevron--open' : '')}>
                <ChevronRightIcon size={12} />
              </span>
            )}
            <span class="ft-node__icon">{icon}</span>
            <span class="ft-node__name">{node.name}</span>
          </div>
          {node.isDirectory && node.expanded && node.children.map(childPath => (
            <TreeNode
              key={childPath}
              nodePath={childPath}
              nodes={props.nodes}
              onToggle={props.onToggle}
              onFileClick={props.onFileClick}
              depth={props.depth + 1}
            />
          ))}
        </div>
      )
    }
  },
})

export default {
  components: { FileTreeNode: TreeNode },
}
</script>

<style scoped>
.file-tree {
  display: flex; flex-direction: column;
  height: 100%; overflow: hidden;
}
.file-tree__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--ls-space-2) var(--ls-space-3);
  border-bottom: 1px solid var(--ls-divider);
}
.file-tree__root { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--ls-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-tree__refresh { padding: 3px; border-radius: var(--ls-radius-xs); color: var(--ls-text-subtle); }
.file-tree__refresh:hover { background: var(--ls-bg-panel-hover); color: var(--ls-text-muted); }
.file-tree__body { flex: 1; overflow-y: auto; padding: var(--ls-space-1) 0; }
.file-tree__empty { display: flex; align-items: center; justify-content: center; padding: var(--ls-space-8); }
.file-tree__open-btn {
  padding: 6px 14px; border-radius: var(--ls-radius-sm); font-size: var(--ls-text-xs);
  background: var(--ls-accent-soft); color: var(--ls-accent); font-weight: var(--ls-font-weight-medium);
  transition: background-color var(--ls-duration-fast);
}
.file-tree__open-btn:hover { background: var(--ls-accent); color: var(--ls-text-on-accent); }
</style>

<style>
/* 非 scoped：递归节点样式 */
.ft-node {
  display: flex; align-items: center; gap: 4px;
  height: 28px; padding-right: var(--ls-space-2);
  font-size: var(--ls-text-xs); color: var(--ls-text-secondary);
  cursor: pointer; white-space: nowrap;
  transition: background-color var(--ls-duration-fast);
}
.ft-node:hover { background: var(--ls-bg-panel-hover); }
.ft-node__chevron { width: 14px; display: flex; align-items: center; justify-content: center; color: var(--ls-text-subtle); flex-shrink: 0; transition: transform 0.12s; }
.ft-node__chevron--open { transform: rotate(90deg); }
.ft-node__icon { font-size: 13px; flex-shrink: 0; }
.ft-node__name { overflow: hidden; text-overflow: ellipsis; }
</style>
`);

// ---- Update WorkspaceShell to use FileTreePanel ----
w('features/workspace/components/WorkspaceShell.vue',
`<script setup lang="ts">
import { useWorkspaceStore } from '../store/workspace.store'
import WorkspaceHeader from './WorkspaceHeader.vue'
import EditorTabs from './EditorTabs.vue'
import EditorEmptyState from './EditorEmptyState.vue'
import MonacoEditorPane from '@/features/editor/components/MonacoEditorPane.vue'
import FileTreePanel from './FileTreePanel.vue'

const ws = useWorkspaceStore()
</script>

<template>
  <div class="ws-shell">
    <WorkspaceHeader />
    <div class="ws-shell__body">
      <!-- 左侧文件树 -->
      <aside class="ws-shell__file-tree">
        <FileTreePanel />
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
.ws-shell__file-tree { width: 240px; flex-shrink: 0; border-right: 1px solid var(--ls-border-soft); background: var(--ls-bg-shell); overflow: hidden; }
.ws-shell__editor { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ws-shell__content { flex: 1; display: flex; background: var(--ls-bg-surface); overflow: hidden; }
</style>
`);

console.log('\\nR3.3 FileTree done.');
