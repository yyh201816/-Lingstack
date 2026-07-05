/**
 * mcp.store.ts  MCP / Integrations  State Management
 * Phase 6: First-class MCP entry in Codex-style workbench
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MCPServiceItem } from '../mcp.types'
import { createDefaultMCPServices } from '../mcp.types'

export const useMcpStore = defineStore('mcp', () => {
  const services = ref<MCPServiceItem[]>(createDefaultMCPServices())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const enabledServices = computed(() => services.value.filter(s => s.enabled))
  const connectedServices = computed(() => services.value.filter(s => s.status === 'connected' && s.enabled))
  const hasErrors = computed(() => services.value.some(s => s.status === 'error'))
  const serviceCount = computed(() => services.value.length)
  const connectedCount = computed(() => connectedServices.value.length)

  function toggleService(id: string) {
    const svc = services.value.find(s => s.id === id)
    if (svc) {
      svc.enabled = !svc.enabled
      if (!svc.enabled && svc.status === 'connected') {
        svc.status = 'disconnected'
      }
    }
  }

  function setServiceStatus(id: string, status: MCPServiceItem['status'], errorMessage?: string) {
    const svc = services.value.find(s => s.id === id)
    if (svc) {
      svc.status = status
      svc.errorMessage = errorMessage
      svc.lastCheckedAt = new Date().toISOString()
    }
  }

  function checkAllServices() {
    loading.value = true
    error.value = null
    // Bridge: simulate async check
    setTimeout(() => {
      for (const svc of services.value) {
        if (svc.enabled) {
          svc.lastCheckedAt = new Date().toISOString()
        }
      }
      loading.value = false
    }, 300)
  }

  return {
    services, loading, error,
    enabledServices, connectedServices, hasErrors, serviceCount, connectedCount,
    toggleService, setServiceStatus, checkAllServices,
  }
})
