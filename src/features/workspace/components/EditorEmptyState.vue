<script setup lang="ts">
import { FolderOpen } from 'lucide-vue-next'
</script>

<template>
  <div class="empty-state">
    <div class="empty-state__icon"><FolderOpen :size="32" stroke-width="1.5" /></div>
    <h2 class="empty-state__title">打开文件以开始编辑</h2>
    <p class="empty-state__desc">使用左侧文件树浏览项目，或通过命令面板打开文件</p>
    <div class="empty-state__shortcuts"><kbd class="kbd">Ctrl+P</kbd><span class="empty-state__shortcut-label">快速打开文件</span></div>
  </div>
</template>

<style scoped>
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--ls-space-3); text-align: center; max-width: 360px; }
.empty-state__icon { color: var(--ls-text-subtle); margin-bottom: var(--ls-space-2); }
.empty-state__title { font-size: var(--ls-text-lg); font-weight: var(--ls-font-weight-semibold); color: var(--ls-text-primary); }
.empty-state__desc { font-size: var(--ls-text-sm); color: var(--ls-text-muted); line-height: var(--ls-leading-normal); }
.empty-state__shortcuts { display: flex; align-items: center; gap: var(--ls-space-2); margin-top: var(--ls-space-2); }
.kbd { padding: 2px 8px; font-size: 11px; font-family: var(--ls-font-mono); background: var(--ls-bg-muted); border: 1px solid var(--ls-border-soft); border-radius: var(--ls-radius-xs); color: var(--ls-text-muted); }
.empty-state__shortcut-label { font-size: var(--ls-text-xs); color: var(--ls-text-subtle); }
</style>
