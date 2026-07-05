<script setup lang="ts">
import { ref, computed } from 'vue'
import { useShortcutStore } from '@/features/settings/store/shortcut.store'
import { Search } from 'lucide-vue-next'

const store = useShortcutStore()
const searchQuery = ref('')

const filtered = computed(() => {
  if (!searchQuery.value.trim()) return store.bindings
  return store.searchBindings(searchQuery.value)
})

const categories = computed(() => {
  const cats = new Map<string, string>()
  cats.set('global', 'Global')
  cats.set('thread', 'Thread')
  cats.set('composer', 'Composer')
  cats.set('review', 'Review')
  cats.set('terminal', 'Terminal')
  cats.set('git', 'Git')
  cats.set('navigation', 'Navigation')
  return cats
})

function groupedBindings() {
  const groups: Record<string, typeof filtered.value> = {}
  for (const b of filtered.value) {
    const cat = b.category || 'global'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(b)
  }
  return groups
}
</script>

<template>
  <div class="shortcut-settings">
    <div class="shortcut-settings__header">
      <h3 class="shortcut-settings__title">Keyboard Shortcuts</h3>
      <div class="shortcut-settings__search">
        <Search :size="14" class="shortcut-settings__search-icon" />
        <input
          v-model="searchQuery"
          class="shortcut-settings__search-input"
          placeholder="Search shortcuts..."
        />
      </div>
    </div>

    <div v-for="(bindings, catKey) in groupedBindings()" :key="catKey" class="shortcut-settings__group">
      <h4 class="shortcut-settings__group-title">{{ categories.get(catKey) || catKey }}</h4>
      <div
        v-for="binding in bindings"
        :key="binding.id"
        class="shortcut-settings__row"
        :class="{ 'shortcut-settings__row--conflict': store.conflicts.includes(binding.id) }"
      >
        <span class="shortcut-settings__row-label">{{ binding.label }}</span>
        <kbd class="shortcut-settings__row-keys">{{ binding.keys }}</kbd>
      </div>
    </div>

    <div v-if="filtered.length === 0" class="shortcut-settings__empty">
      No shortcuts found for "{{ searchQuery }}"
    </div>

    <div class="shortcut-settings__footer">
      <button class="shortcut-settings__reset-btn" @click="store.resetDefaults()">
        Reset to Defaults
      </button>
    </div>
  </div>
</template>

<style scoped>
.shortcut-settings {
  padding: 16px;
}
.shortcut-settings__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}
.shortcut-settings__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--ls-text-primary, #e9edf6);
  margin: 0;
  flex-shrink: 0;
}
.shortcut-settings__search {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 4px 10px;
  background: rgba(0,0,0,0.15);
}
.shortcut-settings__search-icon {
  color: var(--ls-text-hint, #5d667a);
  flex-shrink: 0;
}
.shortcut-settings__search-input {
  border: none;
  background: transparent;
  color: var(--ls-text-primary, #e9edf6);
  font-size: 12px;
  outline: none;
  width: 140px;
}
.shortcut-settings__group {
  margin-bottom: 14px;
}
.shortcut-settings__group-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--ls-text-hint, #5d667a);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 6px;
}
.shortcut-settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  border-radius: 6px;
  transition: background 120ms ease;
}
.shortcut-settings__row:hover { background: rgba(255,255,255,0.02); }
.shortcut-settings__row--conflict { background: rgba(255,107,107,0.06); }
.shortcut-settings__row-label {
  font-size: 12px;
  color: var(--ls-text-secondary, #c3c9d4);
}
.shortcut-settings__row-keys {
  font-size: 11px;
  font-family: monospace;
  background: rgba(255,255,255,0.06);
  color: var(--ls-accent, #5a93ff);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.08);
}
.shortcut-settings__empty {
  text-align: center;
  padding: 24px;
  font-size: 12px;
  color: var(--ls-text-hint, #5d667a);
}
.shortcut-settings__footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.shortcut-settings__reset-btn {
  padding: 4px 12px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  background: transparent;
  color: var(--ls-text-hint, #5d667a);
  font-size: 11px;
  cursor: pointer;
  transition: all 120ms ease;
}
.shortcut-settings__reset-btn:hover { background: rgba(255,255,255,0.04); color: var(--ls-text-secondary, #c3c9d4); }
</style>
