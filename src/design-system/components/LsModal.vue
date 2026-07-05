<script setup lang="ts">
defineProps<{ visible: boolean; title?: string; width?: string }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="ls-modal-overlay" @click.self="$emit('close')">
      <div class="ls-modal" :style="width ? { maxWidth: width } : {}">
        <div v-if="title" class="ls-modal__header">
          <h3 class="ls-modal__title">{{ title }}</h3>
          <button class="ls-modal__close" @click="$emit('close')" aria-label="??">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="4" y1="4" x2="14" y2="14"/><line x1="14" y1="4" x2="4" y2="14"/></svg>
          </button>
        </div>
        <div class="ls-modal__body">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ls-modal-overlay {
  position: fixed; inset: 0; z-index: 10000;
  display: flex; align-items: center; justify-content: center;
  background: rgba(16,24,40,0.5); backdrop-filter: blur(4px);
}
.ls-modal {
  background: var(--ls-bg-surface); border-radius: var(--ls-radius-2xl);
  box-shadow: var(--ls-shadow-xl); width: 90%; max-width: 520px;
  max-height: 85vh; overflow-y: auto;
}
.ls-modal__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 0;
}
.ls-modal__title { font-size: 16px; font-weight: var(--ls-font-weight-semibold); color: var(--ls-text-primary); margin: 0; }
.ls-modal__close {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border: none; border-radius: var(--ls-radius-md);
  background: transparent; color: var(--ls-text-muted); cursor: pointer;
}
.ls-modal__close:hover { background: var(--ls-bg-muted); color: var(--ls-text-primary); }
.ls-modal__body { padding: 20px 24px 24px; }
</style>
