/**
 * computer-use.store.ts  Computer Use State Management
 * Phase 6: First-class Computer Use entry in Codex-style workbench
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ComputerUseState } from '../computer-use.types'
import { createDefaultComputerUseState } from '../computer-use.types'

export const useComputerUseStore = defineStore('computer-use', () => {
  const state = ref<ComputerUseState>(createDefaultComputerUseState())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAvailable = computed(() => state.value.available)
  const isGranted = computed(() => state.value.permission === 'granted')
  const isRunning = computed(() => state.value.isRunning)
  const permissionStatus = computed(() => state.value.permission)

  function checkAvailability() {
    loading.value = true
    error.value = null
    setTimeout(() => {
      state.value.available = false
      loading.value = false
    }, 200)
  }

  function requestPermission() {
    loading.value = true
    error.value = null
    setTimeout(() => {
      state.value.permission = 'granted'
      state.value.available = true
      loading.value = false
    }, 500)
  }

  function setRunning(running: boolean, targetApp?: string) {
    state.value.isRunning = running
    if (running && targetApp) {
      state.value.currentTargetApp = targetApp
    }
    if (!running) {
      state.value.lastActionSummary = 'Completed'
      state.value.currentTargetApp = undefined
    }
  }

  function setLastActionSummary(summary: string) {
    state.value.lastActionSummary = summary
  }

  function resetState() {
    state.value = createDefaultComputerUseState()
  }

  return {
    state, loading, error,
    isAvailable, isGranted, isRunning, permissionStatus,
    checkAvailability, requestPermission, setRunning, setLastActionSummary, resetState,
  }
})
