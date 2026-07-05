<script setup lang="ts">
import { useRouter } from 'vue-router'
import { FolderOpen, Settings, Terminal, MessageSquare } from 'lucide-vue-next'

const router = useRouter()

const items = [
  { id: 'chat',      icon: MessageSquare, label: '对话',   route: '/chat' },
  { id: 'workspace', icon: FolderOpen,    label: '工作区', route: '/' },
  { id: 'terminal',  icon: Terminal,     label: '终端' },
  { id: 'settings',  icon: Settings,     label: '设置',   route: '/settings' },
]

function isActive(item: typeof items[0]): boolean {
  if (item.route) return router.currentRoute.value.path === item.route
  return false
}
</script>

<template>
  <nav class="rail">
    <div class="rail__top">
      <button
        v-for="item in items" :key="item.id"
        :class="['rail__item', { 'rail__item--active': isActive(item) }]"
        :title="item.label"
        @click="item.route ? router.push(item.route) : null"
      >
        <component :is="item.icon" :size="20" />
      </button>
    </div>
  </nav>
</template>

<style scoped>
.rail {
  display: flex; flex-direction: column; justify-content: space-between;
  align-items: center; height: 100%; padding: var(--ls-space-2) 0;
  background: var(--ls-bg-shell); border-right: 1px solid var(--ls-border-soft);
}
.rail__top { display: flex; flex-direction: column; align-items: center; gap: var(--ls-space-1); }
.rail__item {
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: var(--ls-radius-sm);
  color: var(--ls-text-muted);
  transition: background-color var(--ls-duration-fast), color var(--ls-duration-fast);
  position: relative;
}
.rail__item:hover { background: var(--ls-bg-panel-hover); color: var(--ls-text-secondary); }
.rail__item--active { color: var(--ls-accent); background: var(--ls-accent-soft); }
.rail__item--active::before {
  content:''; position: absolute; left: -6px; top: 50%; transform: translateY(-50%);
  width: 3px; height: 18px; background: var(--ls-accent); border-radius: 0 2px 2px 0;
}
</style>
