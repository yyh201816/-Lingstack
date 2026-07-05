<script setup lang="ts">
defineProps<{
  branch: string
  stagedCount: number
  totalCount: number
}>()

defineEmits<{
  (e: 'stage-all'): void
  (e: 'revert-all'): void
}>()
</script>

<template>
  <div class="git-branch-bar">
    <div class="git-branch-bar__info">
      <span class="git-branch-bar__branch-icon">&#x1F310;</span>
      <span class="git-branch-bar__branch">{{ branch }}</span>
      <span class="git-branch-bar__stats">
        <span class="git-branch-bar__staged">{{ stagedCount }} staged</span>
        <span class="git-branch-bar__sep">/</span>
        <span class="git-branch-bar__total">{{ totalCount }} changed</span>
      </span>
    </div>
    <div class="git-branch-bar__actions">
      <button class="git-branch-bar__btn git-branch-bar__btn--stage" @click="$emit('stage-all')">全部暂存</button>
      <button class="git-branch-bar__btn git-branch-bar__btn--revert" @click="$emit('revert-all')">全部还原</button>
    </div>
  </div>
</template>

<style scoped>
.git-branch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}
.git-branch-bar__info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.git-branch-bar__branch-icon { font-size: 12px; flex-shrink: 0; }
.git-branch-bar__branch {
  font-size: 12px;
  font-weight: 600;
  font-family: monospace;
  color: var(--ls-text-primary, #e9edf6);
}
.git-branch-bar__stats {
  display: flex;
  gap: 3px;
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
}
.git-branch-bar__staged { color: rgba(84, 216, 140, 0.8); }
.git-branch-bar__sep { color: var(--ls-text-hint, #5d667a); }
.git-branch-bar__actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.git-branch-bar__btn {
  padding: 2px 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  background: transparent;
  font-size: 10px;
  cursor: pointer;
  transition: all 120ms ease;
}
.git-branch-bar__btn--stage { color: rgba(84, 216, 140, 0.8); }
.git-branch-bar__btn--stage:hover { background: rgba(84, 216, 140, 0.1); border-color: rgba(84, 216, 140, 0.2); }
.git-branch-bar__btn--revert { color: #ff6b6b; }
.git-branch-bar__btn--revert:hover { background: rgba(255, 107, 107, 0.1); border-color: rgba(255, 107, 107, 0.2); }
</style>
