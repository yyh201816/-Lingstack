import { ref } from 'vue'

export function useWorkbenchLayout() {
  const rightPanelVisible = ref(false)
  const rightPanelWidth = ref(320)
  const composerExpanded = ref(false)

  function toggleRightPanel() { rightPanelVisible.value = !rightPanelVisible.value }
  function toggleComposer() { composerExpanded.value = !composerExpanded.value }

  return { rightPanelVisible, rightPanelWidth, composerExpanded, toggleRightPanel, toggleComposer }
}
