<script setup lang="ts">
import { useThemeStore } from '@/stores/theme.store'
import CodexWorkbench from '@/layouts/codex-shell/CodexWorkbench.vue'
import { onMounted } from 'vue'

const theme = useThemeStore()

onMounted(() => {
  document.documentElement.setAttribute('data-theme', theme.mode)
})
</script>

<template>
  <CodexWorkbench />
</template>
