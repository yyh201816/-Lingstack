import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { BetaInstance, RuntimeStatus, UpdaterStatus } from '../types'

const STORAGE_KEY = 'lingstack_beta_instances'

function genId(): string {
  return 'inst_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}
function now(): string { return new Date().toISOString() }
function load<T>(k: string, d: T): T {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d } catch { return d }
}
function save(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
}

export const useBetaInstanceStore = defineStore('beta-instance', () => {
  const instances = ref<BetaInstance[]>(load(STORAGE_KEY, []))
  const currentInstanceId = ref<string>(load('lingstack_current_instance', ''))

  watch(instances, v => save(STORAGE_KEY, v), { deep: true })
  watch(currentInstanceId, v => save('lingstack_current_instance', v))

  const onlineCount = computed(() => instances.value.filter(i => i.runtimeStatus === 'online').length)
  const offlineCount = computed(() => instances.value.filter(i => i.runtimeStatus === 'offline').length)
  const staleCount = computed(() => instances.value.filter(i => i.runtimeStatus === 'stale').length)
  const crashRecoveredCount = computed(() => instances.value.filter(i => i.runtimeStatus === 'crash-recovered').length)

  const outdatedInstances = computed(() =>
    instances.value.filter(i => i.updaterStatus === 'update-available' || i.updaterStatus === 'failed')
  )

  const recentProblemInstances = computed(() =>
    instances.value.filter(i => i.healthScore < 70 || i.runtimeStatus === 'crash-recovered')
  )

  const lowestHealthInstances = computed(() =>
    [...instances.value].sort((a, b) => a.healthScore - b.healthScore).slice(0, 5)
  )

  const totalInstances = computed(() => instances.value.length)
  const avgHealthScore = computed(() => {
    if (instances.value.length === 0) return 0
    const sum = instances.value.reduce((acc, i) => acc + i.healthScore, 0)
    return Math.round(sum / instances.value.length)
  })

  function registerInstance(opts: {
    deviceName: string
    userAlias: string
    osVersion: string
    appVersion: string
    channel?: BetaInstance['channel']
    projectHint?: string
  }): BetaInstance {
    const inst: BetaInstance = {
      instanceId: genId(),
      deviceName: opts.deviceName,
      userAlias: opts.userAlias,
      osVersion: opts.osVersion,
      appVersion: opts.appVersion,
      channel: opts.channel ?? 'beta',
      installAt: now(),
      lastSeenAt: now(),
      runtimeStatus: 'online',
      updaterStatus: 'up-to-date',
      healthScore: 100,
      currentProjectHint: opts.projectHint,
    }
    instances.value.unshift(inst)
    if (!currentInstanceId.value) currentInstanceId.value = inst.instanceId
    return inst
  }

  function updateInstance(id: string, patch: Partial<Pick<BetaInstance,
    'deviceName' | 'userAlias' | 'osVersion' | 'appVersion' | 'channel' |
    'runtimeStatus' | 'updaterStatus' | 'healthScore' | 'currentProjectHint' | 'notes'
  >>) {
    const inst = instances.value.find(i => i.instanceId === id)
    if (!inst) return
    Object.assign(inst, patch)
    inst.lastSeenAt = now()
  }

  function setRuntimeStatus(id: string, status: RuntimeStatus) {
    const inst = instances.value.find(i => i.instanceId === id)
    if (inst) { inst.runtimeStatus = status; inst.lastSeenAt = now() }
  }

  function setUpdaterStatus(id: string, status: UpdaterStatus) {
    const inst = instances.value.find(i => i.instanceId === id)
    if (inst) { inst.updaterStatus = status; inst.lastSeenAt = now() }
  }

  function touchInstance(id: string) {
    const inst = instances.value.find(i => i.instanceId === id)
    if (inst) inst.lastSeenAt = now()
  }

  function getInstance(id: string): BetaInstance | undefined {
    return instances.value.find(i => i.instanceId === id)
  }

  function getCurrentInstance(): BetaInstance | undefined {
    return instances.value.find(i => i.instanceId === currentInstanceId.value)
  }

  function removeInstance(id: string) {
    instances.value = instances.value.filter(i => i.instanceId !== id)
  }

  function seedMockInstances() {
    if (instances.value.length > 0) return
    const base = [
      { device: 'dev-win11-x64', alias: 'Alice', os: 'Windows 11', ver: '0.1.7', score: 92, runtime: 'online' as const },
      { device: 'dev-win10-x64', alias: 'Bob', os: 'Windows 10', ver: '0.1.6', score: 78, runtime: 'stale' as const },
      { device: 'dev-mac-m1', alias: 'Carol', os: 'macOS 14', ver: '0.1.7', score: 88, runtime: 'online' as const },
      { device: 'test-win11', alias: 'Dave', os: 'Windows 11', ver: '0.1.5', score: 65, runtime: 'crash-recovered' as const },
    ]
    for (const b of base) {
      registerInstance({
        deviceName: b.device,
        userAlias: b.alias,
        osVersion: b.os,
        appVersion: b.ver,
        projectHint: 'LingStack-nexT',
      })
      const id = instances.value[0].instanceId
      setRuntimeStatus(id, b.runtime)
      const inst = instances.value.find(i => i.instanceId === id)
      if (inst) inst.healthScore = b.score
      if (b.ver !== '0.1.7') setUpdaterStatus(id, 'update-available')
    }
  }

  return {
    instances, currentInstanceId,
    onlineCount, offlineCount, staleCount, crashRecoveredCount,
    outdatedInstances, recentProblemInstances, lowestHealthInstances,
    totalInstances, avgHealthScore,
    registerInstance, updateInstance, setRuntimeStatus, setUpdaterStatus,
    touchInstance, getInstance, getCurrentInstance, removeInstance,
    seedMockInstances,
  }
})
