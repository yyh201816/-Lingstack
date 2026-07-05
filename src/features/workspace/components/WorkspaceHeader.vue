<script setup lang="ts">
import { useWorkspaceStore } from '../store/workspace.store'
const ws = useWorkspaceStore()
</script>

<template>
  <div class="ws-header">
    <div class="ws-header__left">
      <span class="ws-header__project" v-if="ws.activeProject">{{ ws.activeProject }}</span>
      <span class="ws-header__placeholder" v-else>未打开工作区</span>
    </div>
  </div>
</template>

<style scoped>
.ws-header { display: flex; align-items: center; justify-content: space-between; padding: var(--ls-space-2) var(--ls-space-4); background: var(--ls-bg-surface); border-bottom: 1px solid var(--ls-border-soft); min-height: 36px; }
.ws-header__project { font-size: var(--ls-text-xs); font-weight: var(--ls-font-weight-medium); color: var(--ls-text-secondary); }
.ws-header__placeholder { font-size: var(--ls-text-xs); color: var(--ls-text-subtle); }
</style>
