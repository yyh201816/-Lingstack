<script setup lang="ts">
defineProps<{ visible: boolean; title?: string; width?: string }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="ls-drawer-overlay" @click.self="$emit('close')">
      <div class="ls-drawer" :style="width ? { width } : {}">
        <div class="ls-drawer__header">
          <h3 v-if="title" class="ls-drawer__title">{{ title }}</h3>
          <button class="ls-drawer__close" @click="$emit('close')" aria-label="??">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="4" y1="4" x2="14" y2="14"/><line x1="14" y1="4" x2="4" y2="14"/></svg>
          </button>
        </div>
        <div class="ls-drawer__body">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ls-drawer-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(16,24,40,0.3); backdrop-filter: blur(2px);
}
.ls-drawer {
  position: fixed; top: 0; right: 0; bottom: 0; width: 480px; max-width: 95vw;
  background: var(--ls-bg-surface); box-shadow: var(--ls-shadow-xl);
  display: flex; flex-direction: column; overflow: hidden;
}
.ls-drawer__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-bottom: 1px solid var(--ls-border-default); flex-shrink: 0;
}
.ls-drawer__title { font-size: 16px; font-weight: var(--ls-font-weight-semibold); color: var(--ls-text-primary); margin: 0; }
.ls-drawer__close {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border: none; border-radius: var(--ls-radius-md);
  background: transparent; color: var(--ls-text-muted); cursor: pointer;
}
.ls-drawer__close:hover { background: var(--ls-bg-muted); }
.ls-drawer__body { flex: 1; overflow-y: auto; padding: 24px; }
</style>
