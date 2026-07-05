<script setup lang="ts">
import { useWorkbenchLayout } from '@/layouts/composables/useWorkbenchLayout'
const { rightPanelVisible } = useWorkbenchLayout()
</script>

<template>
  <aside v-if="rightPanelVisible" class="context-panel">
    <div class="context-panel__header"><span class="context-panel__title">上下文</span></div>
    <div class="context-panel__body"><div class="context-panel__empty">右侧上下文面板预留区域</div></div>
  </aside>
</template>

<style scoped>
.context-panel { width: 320px; flex-shrink: 0; display: flex; flex-direction: column; background: var(--ls-bg-surface-2); border-left: 1px solid var(--ls-border-soft); height: 100%; overflow-y: auto; }
.context-panel__header { padding: var(--ls-space-3) var(--ls-space-4); border-bottom: 1px solid var(--ls-divider); }
.context-panel__title { font-size: var(--ls-text-xs); font-weight: var(--ls-font-weight-semibold); color: var(--ls-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.context-panel__body { flex: 1; padding: var(--ls-space-4); }
.context-panel__empty { font-size: var(--ls-text-xs); color: var(--ls-text-subtle); }
</style>
