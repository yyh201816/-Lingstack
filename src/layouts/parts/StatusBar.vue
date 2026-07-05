<script setup lang="ts">
import { useAppStore } from '@/stores/app.store'
import { useTerminalStore } from '@/features/terminal/store/terminal.store'
import { Monitor, Activity, Terminal } from 'lucide-vue-next'
const app = useAppStore()
const termStore = useTerminalStore()
</script>

<template>
  <footer class="statusbar">
    <div class="statusbar__left">
      <span class="statusbar__item"><Monitor :size="12" />{{ app.isTauri ? 'Tauri' : 'Browser' }}</span>
      <button class="statusbar__item statusbar__item--btn" title="切换终端" @click="termStore.toggle()">
        <Terminal :size="12" />
        <span>终端</span>
      </button>
    </div>
    <div class="statusbar__right">
      <span class="statusbar__item"><Activity :size="12" />v{{ app.appVersion }}</span>
    </div>
  </footer>
</template>

<style scoped>
.statusbar {
  display: flex; align-items: center; justify-content: space-between;
  height: 100%; padding: 0 var(--ls-space-3);
  background: var(--ls-bg-surface); border-top: 1px solid var(--ls-border-soft);
  font-size: 11px; color: var(--ls-text-muted); z-index: 40;
}
.statusbar__left, .statusbar__right { display: flex; align-items: center; gap: var(--ls-space-3); }
.statusbar__item { display: flex; align-items: center; gap: 4px; white-space: nowrap; cursor: default; }
.statusbar__item:hover { color: var(--ls-text-secondary); }
.statusbar__item--btn { background: none; border: none; cursor: pointer; padding: 0 6px; height: 100%; border-radius: 0; }
.statusbar__item--btn:hover { color: var(--ls-text-primary); background: var(--ls-bg-panel-hover); }
</style>
