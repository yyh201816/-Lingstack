/**
 * deeplink-router.service.ts — Deep Link 路由分发
 *
 * 解析 lingstack:// URI，分发到对应 store。
 * Deep link 优先级高于启动默认恢复逻辑。
 */

export interface DeepLinkPayload {
  type: 'thread' | 'project' | 'settings' | 'newThread'
  threadId?: string
  projectId?: string
  settingsSection?: string
  params?: Record<string, string>
}

export function parseDeepLink(url: string): DeepLinkPayload | null {
  try {
    if (!url.startsWith('lingstack://')) return null
    const uri = url.replace('lingstack://', '')
    const [path, queryString] = uri.split('?')
    const segments = path.split('/').filter(Boolean)

    const params: Record<string, string> = {}
    if (queryString) {
      queryString.split('&').forEach(pair => {
        const [k, v] = pair.split('=')
        if (k) params[k] = decodeURIComponent(v ?? '')
      })
    }

    if (segments[0] === 'threads' && segments.length === 2) {
      if (segments[1] === 'new') return { type: 'newThread', params }
      return { type: 'thread', threadId: segments[1] }
    }
    if (segments[0] === 'projects' && segments.length === 2) {
      return { type: 'project', projectId: segments[1] }
    }
    if (segments[0] === 'settings') {
      return { type: 'settings', settingsSection: segments[1] }
    }
    return null
  } catch {
    return null
  }
}

export function buildDeepLink(payload: DeepLinkPayload): string {
  switch (payload.type) {
    case 'thread': return `lingstack://threads/${payload.threadId}`
    case 'newThread': {
      const qs = payload.params
        ? '?' + Object.entries(payload.params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
        : ''
      return `lingstack://threads/new${qs}`
    }
    case 'project': return `lingstack://projects/${payload.projectId}`
    case 'settings': return `lingstack://settings/${payload.settingsSection || ''}`
    default: return ''
  }
}

export async function handleDeepLink(payload: DeepLinkPayload): Promise<boolean> {
  const { useThreadStore } = await import('@/features/threads/store/thread.store')
  const { useProjectStore } = await import('@/features/projects/store/project.store')

  const threadStore = useThreadStore()
  const projectStore = useProjectStore()

  switch (payload.type) {
    case 'thread': {
      if (!payload.threadId) return false
      const thread = threadStore.threads.find(t => t.id === payload.threadId)
      if (thread) { threadStore.setActiveThread(payload.threadId); return true }
      return false
    }
    case 'newThread': {
      threadStore.createThread('New Thread', 'default')
      return true
    }
    case 'project': {
      if (!payload.projectId) return false
      const proj = projectStore.recentProjects.find((p: any) => p.id === payload.projectId)
      if (proj) { projectStore.setCurrentProject(payload.projectId); return true }
      return false
    }
    default:
      return false
  }
}
