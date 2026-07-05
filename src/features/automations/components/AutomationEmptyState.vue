<script setup lang="ts">
const emit = defineEmits<{
  create: []
}>()
</script>

<template>
  <div class="auto-empty">
    <span class="auto-empty__icon">&#x2699;&#xFE0F;</span>
    <p class="auto-empty__title">No automations yet</p>
    <p class="auto-empty__desc">Create an automation to schedule recurring AI tasks for your projects.</p>
    <button class="auto-empty__btn" @click="emit('create')">Create First Automation</button>
  </div>
</template>

<style scoped>
.auto-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px 20px;
  text-align: center;
}
.auto-empty__icon { font-size: 28px; margin-bottom: 12px; opacity: 0.5; }
.auto-empty__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ls-text-primary, #c3c9d4);
  margin: 0 0 6px;
}
.auto-empty__desc {
  font-size: 11px;
  color: var(--ls-text-muted, #5d667a);
  margin: 0 0 16px;
  max-width: 240px;
  line-height: 1.5;
}
.auto-empty__btn {
  padding: 6px 16px;
  border: none;
  border-radius: var(--ls-radius-sm, 4px);
  background: var(--ls-accent, #5b8af5);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity var(--ls-duration-fast, 0.15s);
}
.auto-empty__btn:hover { opacity: 0.85; }
</style>
