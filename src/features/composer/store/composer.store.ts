import { defineStore } from 'pinia'
import { ref } from 'vue'

type ComposerMode = 'command' | 'chat' | 'inline'

export const useComposerStore = defineStore('composer', () => {
  const mode = ref<ComposerMode>('command')
  const input = ref('')
  const contextFiles = ref<string[]>([])
  function clear() { input.value = ''; contextFiles.value = [] }
  return { mode, input, contextFiles, clear }
})
