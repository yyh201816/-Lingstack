<script setup lang="ts">
</script>

<template>
  <div class="git-empty">
    <span class="git-empty__icon">&#x1F500;</span>
    <p class="git-empty__title">No Git Changes</p>
    <p class="git-empty__desc">当前项目没有待审查的 Git 变更。</p>
  </div>
</template>

<style scoped>
.git-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px 20px;
  text-align: center;
}
.git-empty__icon { font-size: 28px; margin-bottom: 12px; opacity: 0.5; }
.git-empty__title { font-size: 13px; font-weight: 600; color: var(--ls-text-secondary, #c3c9d4); margin: 0 0 6px; }
.git-empty__desc { font-size: 11px; color: var(--ls-text-hint, #5d667a); margin: 0; max-width: 240px; line-height: 1.5; }
</style>
