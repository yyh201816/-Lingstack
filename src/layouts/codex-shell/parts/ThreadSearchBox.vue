<script setup lang="ts">
import { Search } from "lucide-vue-next"
import { useThreadSearchStore } from "@/features/threads/store/thread-search.store"

const searchStore = useThreadSearchStore()
</script>

<template>
  <div class="thread-search" :class="{ 'thread-search--focused': searchStore.isFocused }">
    <span class="thread-search__icon">
      <Search :size="12" />
    </span>
    <input
      v-model="searchStore.query"
      class="thread-search__input"
      placeholder="搜索线程... (Ctrl+G)"
      @focus="searchStore.setFocused(true)"
      @blur="searchStore.setFocused(false)"
    />
    <kbd v-if="!searchStore.isFocused && !searchStore.isSearching" class="thread-search__kbd">Ctrl+G</kbd>
  </div>
</template>

<style scoped>
.thread-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  transition: border-color 140ms ease, background 140ms ease;
}

.thread-search--focused {
  border-color: rgba(90, 147, 255, 0.25);
  background: rgba(255, 255, 255, 0.04);
}

.thread-search__icon {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--ls-text-hint, #5d667a);
}

.thread-search__input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--ls-text-primary, #e9edf6);
  font-size: 12px;
}

.thread-search__input::placeholder {
  color: var(--ls-text-hint, #5d667a);
}

.thread-search__kbd {
  padding: 1px 5px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  font-family: monospace;
}
</style>
