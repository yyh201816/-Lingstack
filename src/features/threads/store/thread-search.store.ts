import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useThreadSearchStore = defineStore('thread-search', () => {
  // --- state ---
  const query = ref('')
  const isFocused = ref(false)
  const results = ref<string[]>([]) // thread IDs

  // --- getters ---
  const isSearching = computed(() => query.value.length > 0)

  // --- actions ---
  function setQuery(q: string) {
    query.value = q
  }

  function setFocused(f: boolean) {
    isFocused.value = f
  }

  function setResults(ids: string[]) {
    results.value = ids
  }

  function clear() {
    query.value = ''
    results.value = []
    isFocused.value = false
  }

  return {
    query,
    isFocused,
    results,
    isSearching,
    setQuery,
    setFocused,
    setResults,
    clear,
  }
})
