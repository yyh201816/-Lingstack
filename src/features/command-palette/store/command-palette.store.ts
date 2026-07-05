import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCommandPaletteStore = defineStore('command-palette', () => {
  const isOpen = ref(false)
  const query = ref('')
  function toggle() { isOpen.value ? close() : open() }
  function open() { isOpen.value = true; query.value = '' }
  function close() { isOpen.value = false; query.value = '' }
  return { isOpen, query, toggle, open, close }
})
