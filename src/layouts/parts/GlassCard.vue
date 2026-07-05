<template>
  <div :class="['gcard', { 'gcard--interactive': interactive }]"><slot /></div>
</template>

<script setup lang="ts">
defineProps<{ interactive?: boolean }>()
</script>

<style scoped>
.gcard {
  background: var(--ls-bg-elevated);
  border: 1px solid var(--ls-border-default);
  border-radius: 12px;
  padding: 18px 20px;
  backdrop-filter: blur(12px);
  box-shadow: var(--ls-shadow-xs);
  transition: all .18s var(--ls-ease-standard);
}
.gcard--interactive { cursor: pointer; }
.gcard--interactive:hover {
  background: var(--ls-bg-surface);
  border-color: var(--ls-border-strong);
  box-shadow: var(--ls-shadow-sm);
  transform: translateY(-1px);
}
.gcard--interactive:active {
  transform: translateY(0);
  box-shadow: var(--ls-shadow-xs);
}
</style>
