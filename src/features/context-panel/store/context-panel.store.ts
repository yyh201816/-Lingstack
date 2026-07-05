import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useContextPanelStore = defineStore('context-panel', () => {
  const isVisible = ref(false)
  const activeSection = ref<string | null>(null)
  return { isVisible, activeSection }
})
