<script setup lang="ts">
</script>

<template>
  <div class="rail-nav">
    <div class="rail-nav__section">
      <button class="rail-nav__item rail-nav__item--active">工作区</button>
      <button class="rail-nav__item">时间线</button>
      <button class="rail-nav__item">终端</button>
    </div>
  </div>
</template>

<style scoped>
.rail-nav { padding: var(--ls-space-2); }
.rail-nav__section { display: flex; flex-direction: column; gap: 2px; }
.rail-nav__item { padding: 6px 12px; border-radius: var(--ls-radius-xs); font-size: var(--ls-text-xs); color: var(--ls-text-muted); text-align: left; cursor: pointer; }
.rail-nav__item:hover { background: var(--ls-bg-panel-hover); color: var(--ls-text-primary); }
.rail-nav__item--active { background: var(--ls-accent-soft); color: var(--ls-accent); font-weight: var(--ls-font-weight-medium); }
</style>
