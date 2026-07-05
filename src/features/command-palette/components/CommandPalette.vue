<script setup lang="ts">
import { useCommandPaletteStore } from '../store/command-palette.store'
import { Search } from 'lucide-vue-next'
const cp = useCommandPaletteStore()
</script>

<template>
  <Teleport to="body">
    <div v-if="cp.isOpen" class="cmd-overlay" @click="cp.isOpen = false">
      <div class="cmd-palette" @click.stop>
        <div class="cmd-palette__input"><Search :size="14" /><input type="text" placeholder="输入命令..." v-model="cp.query" autofocus /></div>
        <div class="cmd-palette__hint">命令面板即将接入 · Esc 关闭</div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.cmd-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.15); display: flex; justify-content: center; padding-top: 16vh; z-index: 999; backdrop-filter: blur(4px); }
.cmd-palette { width: 560px; max-height: 360px; background: var(--ls-bg-elevated); border: 1px solid var(--ls-border-default); border-radius: var(--ls-radius-lg); box-shadow: var(--ls-shadow-lg); overflow: hidden; }
.cmd-palette__input { display: flex; align-items: center; gap: var(--ls-space-2); padding: var(--ls-space-3) var(--ls-space-4); border-bottom: 1px solid var(--ls-divider); color: var(--ls-text-subtle); }
.cmd-palette__input input { flex: 1; background: none; border: none; outline: none; font-size: var(--ls-text-md); color: var(--ls-text-primary); }
.cmd-palette__hint { padding: var(--ls-space-4); font-size: var(--ls-text-xs); color: var(--ls-text-subtle); text-align: center; }
</style>
