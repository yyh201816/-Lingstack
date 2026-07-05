/**
 * useFileTree — 文件树状态与操作
 *
 * 数据源：TauriService.listDir()（返回 DirEntry[]，含 is_directory/is_file 标志）
 * 节点扁平化存储 Record<path, FileNode>
 */
import { ref, reactive } from 'vue'
import { TauriService, type DirEntry } from '@/services/ipc/tauri.service'

export interface FileNode {
  name: string
  path: string
  isDirectory: boolean
  children: string[]
  expanded: boolean
  loaded: boolean
}

/** 获取文件图标 emoji（按扩展名） */
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

/** 归一化路径分隔符 */
function normPath(p: string): string {
  return p.replace(/\\/g, '/')
}

/** 获取父目录路径 */
export function parentPath(p: string): string {
  const np = normPath(p)
  const idx = np.lastIndexOf('/')
  return idx > 0 ? np.slice(0, idx) : np
}

export function useFileTree() {
  const rootPath = ref<string | null>(null)
  const nodes = reactive<Record<string, FileNode>>({})
  const rootChildren = ref<string[]>([])

  async function setRoot(path: string) {
    rootPath.value = path
    rootChildren.value = []
    Object.keys(nodes).forEach((k) => delete nodes[k])
    const np = normPath(path)
    const name = np.split('/').pop() || path
    const rootNode: FileNode = {
      name, path: np, isDirectory: true,
      children: [], expanded: true, loaded: false,
    }
    nodes[np] = rootNode
    await loadChildren(np)
    rootChildren.value = [...rootNode.children]
  }

  async function loadChildren(dirPath: string): Promise<void> {
    const node = nodes[dirPath]
    if (!node || node.loaded) return
    try {
      const entries: DirEntry[] = await TauriService.listDir(dirPath)
      const childPaths: string[] = []

      for (const entry of entries) {
        const childPath = normPath(entry.path)
        const child: FileNode = {
          name: entry.name,
          path: childPath,
          isDirectory: entry.is_directory,
          children: [],
          expanded: false,
          loaded: false,
        }
        nodes[childPath] = child
        childPaths.push(childPath)
      }

      node.children = childPaths
      node.loaded = true
    } catch (e) {
      console.warn('[FileTree] loadChildren failed:', dirPath, e)
      node.loaded = true
    }
  }

  async function toggleExpand(nodePath: string) {
    const node = nodes[nodePath]
    if (!node || !node.isDirectory) return
    if (!node.loaded) await loadChildren(nodePath)
    node.expanded = !node.expanded
  }

  return {
    rootPath, nodes, rootChildren,
    setRoot, loadChildren, toggleExpand,
  }
}
