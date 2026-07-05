import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type NavView = 'chat' | 'project' | 'terminal' | 'servers' | 'skills' | 'models' | 'settings'

export interface NavItem {
  id: NavView
  label: string
  route: string
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'chat',     label: '对话',   route: '/chat' },
  { id: 'project',  label: '项目',   route: '/' },
  { id: 'terminal', label: '终端',   route: '/terminal' },
  { id: 'servers',  label: '服务器', route: '/servers' },
  { id: 'skills',   label: '技能',   route: '/skills' },
  { id: 'models',   label: '模型',   route: '/models' },
  { id: 'settings', label: '设置',   route: '/settings' },
]

export const useNavigationStore = defineStore('navigation', () => {
  const activeView = ref<NavView>('project')
  const hasOpenProject = ref(false)
  const projectPath = ref('')
  const projectName = ref('')

  const isWorkspace = computed(() => activeView.value === 'project')

  function setView(view: NavView) {
    activeView.value = view
  }

  function openProject(path: string, name: string) {
    projectPath.value = path
    projectName.value = name
    hasOpenProject.value = true
  }

  function closeProject() {
    hasOpenProject.value = false
    projectPath.value = ''
    projectName.value = ''
  }

  function setHasOpenProject(v: boolean) {
    hasOpenProject.value = v
  }

  return { activeView, hasOpenProject, projectPath, projectName, isWorkspace, setView, openProject, closeProject, setHasOpenProject }
})
