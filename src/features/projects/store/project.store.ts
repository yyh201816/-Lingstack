import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ProjectItem } from '../types'

const STORAGE_KEY = 'lingstack_projects'

function loadProjects(): ProjectItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveProjects(projects: ProjectItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

function loadCurrentProjectId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY + '_current') || null
  } catch {
    return null
  }
}

function saveCurrentProjectId(id: string | null) {
  if (id) {
    localStorage.setItem(STORAGE_KEY + '_current', id)
  } else {
    localStorage.removeItem(STORAGE_KEY + '_current')
  }
}

function generateId(): string {
  return 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}

export const useProjectStore = defineStore('project', () => {
  // --- state ---
  const currentProjectId = ref<string | null>(loadCurrentProjectId())
  const recentProjects = ref<ProjectItem[]>(loadProjects())

  // --- getters ---
  const currentProject = computed<ProjectItem | null>(() =>
    recentProjects.value.find((p) => p.id === currentProjectId.value) ?? null,
  )

  const currentProjectPath = computed(() => currentProject.value?.path ?? null)
  const currentProjectName = computed(() => currentProject.value?.name ?? null)
  const currentBranch = computed(() => currentProject.value?.branch ?? null)

  // --- actions ---
  function setCurrentProject(id: string | null) {
    currentProjectId.value = id
    saveCurrentProjectId(id)
    if (id) {
      const p = recentProjects.value.find((proj) => proj.id === id)
      if (p) {
        p.lastOpenedAt = new Date().toISOString()
        saveProjects(recentProjects.value)
      }
    }
  }

  function addRecentProject(name: string, path: string, kind: ProjectItem['kind'] = 'local') {
    const existing = recentProjects.value.find((p) => p.path === path)
    if (existing) {
      existing.name = name
      existing.lastOpenedAt = new Date().toISOString()
      setCurrentProject(existing.id)
      saveProjects(recentProjects.value)
      return existing
    }

    const project: ProjectItem = {
      id: generateId(),
      name,
      path,
      kind,
      lastOpenedAt: new Date().toISOString(),
    }
    recentProjects.value.unshift(project)

    // keep at most 20 recent projects
    if (recentProjects.value.length > 20) {
      recentProjects.value = recentProjects.value.slice(0, 20)
    }

    currentProjectId.value = project.id
    saveProjects(recentProjects.value)
    return project
  }

  function removeRecentProject(id: string) {
    recentProjects.value = recentProjects.value.filter((p) => p.id !== id)
    if (currentProjectId.value === id) {
      currentProjectId.value = recentProjects.value[0]?.id ?? null
    }
    saveProjects(recentProjects.value)
  }

  function hydrate() {
    recentProjects.value = loadProjects()
  }

  function persist() {
    saveProjects(recentProjects.value)
  }

  return {
    // state
    currentProjectId,
    recentProjects,
    // getters
    currentProject,
    currentProjectPath,
    currentProjectName,
    currentBranch,
    // actions
    setCurrentProject,
    addRecentProject,
    removeRecentProject,
    hydrate,
    persist,
  }
})
