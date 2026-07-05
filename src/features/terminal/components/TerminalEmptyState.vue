<script setup lang="ts">
</script>

<template>
  <div class="term-empty">
    <span class="term-empty__icon">&#x1F4BB;</span>
    <p class="term-empty__title">终端</p>
    <p class="term-empty__desc">在此执行命令，或等待智能体命令出现。</p>
  </div>
</template>

<style scoped>
.term-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px 20px;
  text-align: center;
}
.term-empty__icon { font-size: 28px; margin-bottom: 12px; opacity: 0.5; }
.term-empty__title { font-size: 13px; font-weight: 600; color: var(--ls-text-secondary, #c3c9d4); margin: 0 0 6px; }
.term-empty__desc { font-size: 11px; color: var(--ls-text-hint, #5d667a); margin: 0; max-width: 240px; line-height: 1.5; }
</style>
