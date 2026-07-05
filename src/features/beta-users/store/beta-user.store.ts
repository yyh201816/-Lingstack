/**
 * beta-user.store.ts — Phase 14
 * Internal beta tester user management
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { BetaUser, BetaUserRole, BetaUserCohort, BetaUserStatus } from '../types'

const STORAGE_KEY = 'lingstack_beta_users'

function loadUsers(): BetaUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as BetaUser[]
  } catch {
    return []
  }
}

function saveUsers(users: BetaUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

function uid(): string {
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export const useBetaUserStore = defineStore('betaUsers', () => {
  const users = ref<BetaUser[]>(loadUsers())
  const selectedUserId = ref<string | null>(null)

  // ── computed ──

  const totalUsers = computed(() => users.value.length)
  const activeUsers = computed(() => users.value.filter(u => u.status === 'active'))
  const activeCount = computed(() => activeUsers.value.length)
  const usersByCohort = computed(() => {
    const map: Record<string, BetaUser[]> = {}
    for (const u of users.value) {
      if (!map[u.cohort]) map[u.cohort] = []
      map[u.cohort].push(u)
    }
    return map
  })
  const usersByStatus = computed(() => {
    const map: Record<string, BetaUser[]> = {}
    for (const u of users.value) {
      if (!map[u.status]) map[u.status] = []
      map[u.status].push(u)
    }
    return map
  })

  // ── actions ──

  function addUser(
    displayName: string,
    emailOrAlias: string,
    role: BetaUserRole,
    cohort: BetaUserCohort,
  ): BetaUser {
    const now = new Date().toISOString()
    const user: BetaUser = {
      betaUserId: uid(),
      displayName,
      emailOrAlias,
      role,
      cohort,
      status: 'active',
      joinedAt: now,
      lastActiveAt: now,
      boundInstanceIds: [],
      currentVersion: '',
      feedbackCount: 0,
      notes: '',
    }
    users.value.unshift(user)
    saveUsers(users.value)
    return user
  }

  function updateUser(id: string, patch: Partial<BetaUser>) {
    const idx = users.value.findIndex(u => u.betaUserId === id)
    if (idx === -1) return null
    users.value[idx] = {
      ...users.value[idx],
      ...patch,
      // Preserve immutable id fields
      betaUserId: users.value[idx].betaUserId,
      joinedAt: users.value[idx].joinedAt,
    }
    saveUsers(users.value)
    return users.value[idx]
  }

  function removeUser(id: string) {
    users.value = users.value.filter(u => u.betaUserId !== id)
    if (selectedUserId.value === id) selectedUserId.value = null
    saveUsers(users.value)
  }

  function setUserStatus(id: string, status: BetaUserStatus) {
    return updateUser(id, { status, lastActiveAt: status === 'active' ? new Date().toISOString() : undefined })
  }

  function setUserCohort(id: string, cohort: BetaUserCohort) {
    return updateUser(id, { cohort })
  }

  function setUserNotes(id: string, notes: string) {
    return updateUser(id, { notes })
  }

  function bindInstance(userId: string, instanceId: string) {
    const user = users.value.find(u => u.betaUserId === userId)
    if (!user) return
    if (!user.boundInstanceIds.includes(instanceId)) {
      user.boundInstanceIds.push(instanceId)
    }
    saveUsers(users.value)
  }

  function unbindInstance(userId: string, instanceId: string) {
    const user = users.value.find(u => u.betaUserId === userId)
    if (!user) return
    user.boundInstanceIds = user.boundInstanceIds.filter(id => id !== instanceId)
    saveUsers(users.value)
  }

  function selectUser(id: string | null) {
    selectedUserId.value = id
  }

  function seedMockUsers() {
    if (users.value.length > 0) return
    const now = new Date().toISOString()
    const mock: BetaUser[] = [
      {
        betaUserId: 'u_mock_001',
        displayName: 'Zhang Wei',
        emailOrAlias: 'zhang@internal',
        role: 'operator',
        cohort: 'internal-core',
        status: 'active',
        joinedAt: '2026-06-15T08:00:00.000Z',
        lastActiveAt: now,
        boundInstanceIds: ['inst_desktop_01', 'inst_laptop_01'],
        currentVersion: '0.1.6',
        feedbackCount: 12,
        notes: 'Core developer, runs LingStack daily',
      },
      {
        betaUserId: 'u_mock_002',
        displayName: 'Li Ming',
        emailOrAlias: 'liming@dev',
        role: 'tester',
        cohort: 'internal-dev',
        status: 'active',
        joinedAt: '2026-06-20T09:00:00.000Z',
        lastActiveAt: '2026-07-03T15:00:00.000Z',
        boundInstanceIds: ['inst_dev_02'],
        currentVersion: '0.1.5',
        feedbackCount: 5,
        notes: 'Frontend dev, tests workspace features',
      },
      {
        betaUserId: 'u_mock_003',
        displayName: 'Wang Fang',
        emailOrAlias: 'wangfang@trusted',
        role: 'tester',
        cohort: 'trusted-beta',
        status: 'active',
        joinedAt: '2026-06-25T10:00:00.000Z',
        lastActiveAt: '2026-07-02T12:00:00.000Z',
        boundInstanceIds: ['inst_trusted_03'],
        currentVersion: '0.1.6',
        feedbackCount: 3,
        notes: 'External trusted tester, focuses on UX flow',
      },
      {
        betaUserId: 'u_mock_004',
        displayName: 'Zhao Yan',
        emailOrAlias: 'zhaoyan@dev',
        role: 'observer',
        cohort: 'internal-dev',
        status: 'paused',
        joinedAt: '2026-06-22T08:00:00.000Z',
        lastActiveAt: '2026-06-28T09:00:00.000Z',
        boundInstanceIds: [],
        currentVersion: '0.1.4',
        feedbackCount: 1,
        notes: 'Paused - on leave until August',
      },
    ]
    users.value = mock
    saveUsers(users.value)
  }

  return {
    users,
    selectedUserId,
    totalUsers,
    activeUsers,
    activeCount,
    usersByCohort,
    usersByStatus,
    addUser,
    updateUser,
    removeUser,
    setUserStatus,
    setUserCohort,
    setUserNotes,
    bindInstance,
    unbindInstance,
    selectUser,
    seedMockUsers,
  }
})
