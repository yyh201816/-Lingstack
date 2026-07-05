<script setup lang="ts">
import { useWorkspaceStore } from '../store/workspace.store'
import { X } from 'lucide-vue-next'
import { computed } from 'vue'

const ws = useWorkspaceStore()
const displayTabs = computed(() => ws.tabs.slice(0, 12))
</script>

<template>
  <div v-if="displayTabs.length > 0" class="editor-tabs">
    <div v-for="tab in displayTabs" :key="tab.id"
      :class="['editor-tabs__tab', { active: tab.id === ws.activeTabId }]"
      @click="ws.activeTabId = tab.id">
      <span class="editor-tabs__name">{{ tab.fileName }}</span>
      <span v-if="tab.isDirty" class="editor-tabs__dirty" />
      <button class="editor-tabs__close" @click.stop="ws.closeTab(tab.id)"><X :size="12" /></button>
    </div>
  </div>
</template>

<style scoped>
.editor-tabs { display: flex; align-items: stretch; background: var(--ls-bg-surface); border-bottom: 1px solid var(--ls-border-soft); overflow-x: auto; scrollbar-width: none; }
.editor-tabs::-webkit-scrollbar { display: none; }
.editor-tabs__tab { display: flex; align-items: center; gap: 6px; padding: 6px var(--ls-space-3); font-size: var(--ls-text-xs); color: var(--ls-text-muted); cursor: pointer; border-right: 1px solid var(--ls-border-soft); white-space: nowrap; min-width: 0; transition: background-color var(--ls-duration-fast), color var(--ls-duration-fast); }
.editor-tabs__tab:hover { background: var(--ls-bg-panel-hover); color: var(--ls-text-secondary); }
.editor-tabs__tab.active { background: var(--ls-bg-elevated); color: var(--ls-text-primary); border-bottom: 2px solid var(--ls-accent); margin-bottom: -1px; padding-bottom: 4px; }
.editor-tabs__name { max-width: 140px; overflow: hidden; text-overflow: ellipsis; }
.editor-tabs__dirty { width: 7px; height: 7px; border-radius: 50%; background: var(--ls-accent); }
.editor-tabs__close { display: flex; align-items: center; justify-content: center; padding: 2px; border-radius: 3px; opacity: 0; transition: opacity var(--ls-duration-fast); }
.editor-tabs__tab:hover .editor-tabs__close { opacity: 1; }
.editor-tabs__close:hover { background: var(--ls-bg-panel-hover); }
</style>
