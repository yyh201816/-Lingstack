<script setup lang="ts">
import { useWorkbenchLayout } from '@/layouts/composables/useWorkbenchLayout'
import { ArrowUp } from 'lucide-vue-next'
const { composerExpanded } = useWorkbenchLayout()
</script>

<template>
  <div class="composer">
    <div class="composer__inner">
      <div class="composer__input-wrapper">
        <input type="text" class="composer__input" placeholder="输入指令... (Ctrl+K)" disabled />
        <button class="composer__send" disabled><ArrowUp :size="16" /></button>
      </div>
      <div class="composer__hint">命令模式 · 即将接入</div>
    </div>
  </div>
</template>

<style scoped>
.composer { padding: var(--ls-space-3) var(--ls-space-4) var(--ls-space-4); background: linear-gradient(to top, var(--ls-bg-shell), transparent); }
.composer__inner { max-width: 720px; margin: 0 auto; }
.composer__input-wrapper {
  display: flex; align-items: center; gap: var(--ls-space-2);
  padding: var(--ls-space-2) var(--ls-space-3);
  background: var(--ls-bg-surface); border: 1px solid var(--ls-border-default);
  border-radius: var(--ls-radius-md);
  transition: border-color var(--ls-duration-fast), box-shadow var(--ls-duration-fast);
}
.composer__input-wrapper:focus-within { border-color: var(--ls-accent); box-shadow: var(--ls-shadow-input-focus); }
.composer__input { flex: 1; background: none; border: none; outline: none; font-size: var(--ls-text-sm); color: var(--ls-text-primary); padding: var(--ls-space-1) 0; }
.composer__input::placeholder { color: var(--ls-text-subtle); }
.composer__send { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: var(--ls-radius-xs); background: var(--ls-accent-soft); color: var(--ls-accent); opacity: 0.4; }
.composer__hint { margin-top: var(--ls-space-2); font-size: 10px; color: var(--ls-text-subtle); text-align: center; }
</style>
