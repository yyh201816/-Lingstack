<script setup lang="ts">
import { FolderOpen } from "lucide-vue-next"
import { useProjectStore } from "@/features/projects/store/project.store"
import { useProjectService } from "@/features/workspace/composables/useProjectService"

const projectStore = useProjectStore()
const projectService = useProjectService()

async function handleOpenFolder() {
  await projectService.openProject()
}
</script>

<template>
  <div class="project-switcher">
    <div class="project-switcher__current">
      <span class="project-switcher__icon">
        <FolderOpen :size="15" />
      </span>
      <div class="project-switcher__info">
        <span class="project-switcher__name">{{ projectStore.currentProjectName || "未打开项目" }}</span>
        <span v-if="projectStore.currentProjectPath" class="project-switcher__path">{{ projectStore.currentProjectPath }}</span>
      </div>
    </div>

    <button class="project-switcher__action" title="打开项目目录" @click="handleOpenFolder">
      <span>打开项目</span>
    </button>
  </div>
</template>

<style scoped>
.project-switcher {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-switcher__current {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
}

.project-switcher__icon {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--ls-text-hint, #5d667a);
}

.project-switcher__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.project-switcher__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  color: var(--ls-text-primary, #e9edf6);
}

.project-switcher__path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  font-family: monospace;
  color: var(--ls-text-hint, #5d667a);
}

.project-switcher__action {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: transparent;
  color: var(--ls-text-secondary, #c3c9d4);
  font-size: 11px;
  cursor: pointer;
}

.project-switcher__action:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.12);
}
</style>
