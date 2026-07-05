<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBetaUserStore } from '../store/beta-user.store'
import { useBetaInstanceStore } from '@/features/beta/store/beta-instance.store'
import { BETA_USER_ROLE_LABELS, BETA_USER_COHORT_LABELS, BETA_USER_STATUS_LABELS } from '../types'
import type { BetaUser, BetaUserRole, BetaUserCohort, BetaUserStatus } from '../types'
import { seedBetaOpsData } from '../services/beta-user-ops.service'
import {
  Users, UserPlus, UserCheck, UserX, ChevronDown, Tag, Laptop,
  MessageCircle, Edit3, Save, X, RefreshCw,
} from 'lucide-vue-next'

const userStore = useBetaUserStore()
const instanceStore = useBetaInstanceStore()
const expandedId = ref<string | null>(null)
const editingId = ref<string | null>(null)
const editForm = ref({ displayName: '', emailOrAlias: '', notes: '' })

const filterCohort = ref<string>('all')
const filterStatus = ref<string>('all')
const showAddForm = ref(false)
const newUser = ref({ displayName: '', emailOrAlias: '', role: 'tester' as BetaUserRole, cohort: 'trusted-beta' as BetaUserCohort })

onMounted(() => {
  seedBetaOpsData()
})

const filteredUsers = computed(() => {
  let list = userStore.users
  if (filterCohort.value !== 'all') list = list.filter(u => u.cohort === filterCohort.value)
  if (filterStatus.value !== 'all') list = list.filter(u => u.status === filterStatus.value)
  return list
})

function getInstanceCount(userId: string): number {
  const user = userStore.users.find(u => u.betaUserId === userId)
  if (!user) return 0
  return user.boundInstanceIds.length
}

function statusClass(s: BetaUserStatus): string {
  switch (s) {
    case 'active': return 'status--active'
    case 'paused': return 'status--paused'
    case 'invited': return 'status--invited'
    case 'disabled': return 'status--disabled'
  }
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function startEdit(user: BetaUser) {
  editingId.value = user.betaUserId
  editForm.value = { displayName: user.displayName, emailOrAlias: user.emailOrAlias, notes: user.notes }
}

function saveEdit(userId: string) {
  userStore.updateUser(userId, editForm.value)
  editingId.value = null
}

function cancelEdit() {
  editingId.value = null
}

function handleAddUser() {
  if (!newUser.value.displayName.trim() || !newUser.value.emailOrAlias.trim()) return
  userStore.addUser(
    newUser.value.displayName.trim(),
    newUser.value.emailOrAlias.trim(),
    newUser.value.role,
    newUser.value.cohort,
  )
  newUser.value = { displayName: '', emailOrAlias: '', role: 'tester', cohort: 'trusted-beta' }
  showAddForm.value = false
}

const cohorts: string[] = ['internal-core', 'internal-dev', 'trusted-beta', 'wider-beta']
</script>

<template>
  <div class="beta-user-panel">
    <div class="panel__header">
      <div class="panel__title">
        <Users :size="15" />
        <span>Beta Users</span>
      </div>
      <div class="panel__header-actions">
        <button class="panel__btn panel__btn--ghost" @click="seedBetaOpsData" title="Reload seed data">
          <RefreshCw :size="12" />
        </button>
        <button class="panel__btn panel__btn--primary" @click="showAddForm = !showAddForm">
          <UserPlus :size="13" />
          <span>Add</span>
        </button>
      </div>
    </div>

    <!-- Summary bar -->
    <div class="panel__summary">
      <span class="panel__summary-item">{{ userStore.activeCount }}/{{ userStore.totalUsers }} active</span>
      <span v-for="(list, cohort) in userStore.usersByCohort" :key="cohort" class="panel__summary-item panel__summary-item--dim">
        {{ BETA_USER_COHORT_LABELS[cohort as BetaUserCohort] }}: {{ list.length }}
      </span>
    </div>

    <!-- Add form -->
    <div v-if="showAddForm" class="panel__add-form">
      <input v-model="newUser.displayName" placeholder="Name" class="panel__input" />
      <input v-model="newUser.emailOrAlias" placeholder="Email or alias" class="panel__input" />
      <select v-model="newUser.role" class="panel__select">
        <option v-for="(label, role) in BETA_USER_ROLE_LABELS" :key="role" :value="role">{{ label }}</option>
      </select>
      <select v-model="newUser.cohort" class="panel__select">
        <option v-for="(label, cohort) in BETA_USER_COHORT_LABELS" :key="cohort" :value="cohort">{{ label }}</option>
      </select>
      <button class="panel__btn panel__btn--primary" @click="handleAddUser">Save</button>
      <button class="panel__btn panel__btn--ghost" @click="showAddForm = false; newUser = { displayName: '', emailOrAlias: '', role: 'tester', cohort: 'trusted-beta' }">Cancel</button>
    </div>

    <!-- Filters -->
    <div class="panel__filters">
      <button
        v-for="f in [{k:'all',l:'All Status'},{k:'active',l:'Active'},{k:'paused',l:'Paused'},{k:'invited',l:'Invited'},{k:'disabled',l:'Disabled'}]"
        :key="f.k"
        class="panel__filter-btn"
        :class="{ 'panel__filter-btn--active': filterStatus === f.k }"
        @click="filterStatus = f.k"
      >
        {{ f.l }}
      </button>
    </div>

    <!-- User list -->
    <div class="panel__list">
      <div
        v-for="user in filteredUsers" :key="user.betaUserId"
        class="panel__user"
        :class="{ 'panel__user--expanded': expandedId === user.betaUserId }"
        @click="toggleExpand(user.betaUserId)"
      >
        <div class="panel__user-top">
          <span class="panel__user-dot" :class="statusClass(user.status)"></span>
          <span class="panel__user-name">{{ user.displayName }}</span>
          <span class="panel__user-cohort">{{ BETA_USER_COHORT_LABELS[user.cohort] }}</span>
          <span class="panel__user-role">{{ BETA_USER_ROLE_LABELS[user.role] }}</span>
          <span class="panel__user-feedback" v-if="user.feedbackCount > 0">
            <MessageCircle :size="10" /> {{ user.feedbackCount }}
          </span>
          <ChevronDown :size="12" class="panel__chevron" :class="{ 'panel__chevron--open': expandedId === user.betaUserId }" />
        </div>

        <!-- Expanded detail -->
        <div v-if="expandedId === user.betaUserId" class="panel__user-detail" @click.stop>
          <template v-if="editingId === user.betaUserId">
            <div class="panel__detail-row">
              <span>Name</span>
              <input v-model="editForm.displayName" class="panel__input panel__input--sm" />
            </div>
            <div class="panel__detail-row">
              <span>Email</span>
              <input v-model="editForm.emailOrAlias" class="panel__input panel__input--sm" />
            </div>
            <div class="panel__detail-row">
              <span>Notes</span>
              <input v-model="editForm.notes" class="panel__input panel__input--sm" placeholder="Operator notes..." />
            </div>
            <div class="panel__detail-actions">
              <button class="panel__btn panel__btn--primary" @click="saveEdit(user.betaUserId)"><Save :size="11" /> Save</button>
              <button class="panel__btn panel__btn--ghost" @click="cancelEdit"><X :size="11" /> Cancel</button>
            </div>
          </template>
          <template v-else>
            <div class="panel__detail-row"><span>Email</span><span>{{ user.emailOrAlias }}</span></div>
            <div class="panel__detail-row"><span>Status</span><span :class="statusClass(user.status)">{{ BETA_USER_STATUS_LABELS[user.status] }}</span></div>
            <div class="panel__detail-row"><span>Version</span><span>{{ user.currentVersion || '—' }}</span></div>
            <div class="panel__detail-row">
              <span>Instances</span>
              <span>{{ user.boundInstanceIds.length }} bound</span>
            </div>
            <div class="panel__detail-row"><span>Joined</span><span>{{ user.joinedAt.slice(0, 10) }}</span></div>
            <div class="panel__detail-row"><span>Last Active</span><span>{{ user.lastActiveAt.slice(0, 16).replace('T', ' ') }}</span></div>
            <div class="panel__detail-row" v-if="user.notes"><span>Notes</span><span class="panel__detail-notes">{{ user.notes }}</span></div>
            <div class="panel__detail-actions">
              <button class="panel__btn panel__btn--ghost" @click="startEdit(user)"><Edit3 :size="11" /> Edit</button>
              <select
                class="panel__select panel__select--sm"
                :value="user.status"
                @change="(e: Event) => userStore.setUserStatus(user.betaUserId, (e.target as HTMLSelectElement).value as BetaUserStatus)"
              >
                <option v-for="(label, s) in BETA_USER_STATUS_LABELS" :key="s" :value="s">{{ label }}</option>
              </select>
              <select
                class="panel__select panel__select--sm"
                :value="user.cohort"
                @change="(e: Event) => userStore.setUserCohort(user.betaUserId, (e.target as HTMLSelectElement).value as BetaUserCohort)"
              >
                <option v-for="(label, c) in BETA_USER_COHORT_LABELS" :key="c" :value="c">{{ label }}</option>
              </select>
            </div>
          </template>
        </div>
      </div>
      <div v-if="filteredUsers.length === 0" class="panel__empty">No users match</div>
    </div>
  </div>
</template>

<style scoped>
.beta-user-panel {
  display: flex; flex-direction: column; height: 100%;
  background: var(--ls-bg-panel, #0b0f18);
  color: var(--ls-text-primary, #c3c9d4);
  overflow-y: auto;
}
.panel__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,.06);
}
.panel__title {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 600; color: var(--ls-accent, #5a93ff);
}
.panel__header-actions { display: flex; gap: 6px; }
.panel__summary {
  display: flex; gap: 12px; padding: 8px 16px; font-size: 11px; color: #8e96a6;
  border-bottom: 1px solid rgba(255,255,255,.04);
  flex-wrap: wrap;
}
.panel__summary-item { white-space: nowrap; }
.panel__summary-item--dim { color: #5d667a; }
.panel__add-form {
  display: flex; gap: 6px; padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,.04);
  flex-wrap: wrap; align-items: center;
}
.panel__filters {
  display: flex; gap: 4px; padding: 8px 16px; border-bottom: 1px solid rgba(255,255,255,.04);
}
.panel__filter-btn {
  font-size: 10px; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,.06);
  background: transparent; color: #8e96a6; cursor: pointer; transition: all .12s;
}
.panel__filter-btn--active, .panel__filter-btn:hover { background: rgba(90,147,255,.1); color: #5a93ff; border-color: rgba(90,147,255,.2); }
.panel__list { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 16px 16px; }
.panel__user {
  border: 1px solid rgba(255,255,255,.05); border-radius: 8px; padding: 8px 10px; margin-bottom: 4px;
  cursor: pointer; transition: background .1s;
}
.panel__user:hover { background: rgba(255,255,255,.02); }
.panel__user-top { display: flex; align-items: center; gap: 8px; }
.panel__user-dot { width: 6px; height: 6px; border-radius: 999px; flex-shrink: 0; }
.status--active { background: #54d88c; }
.status--paused { background: #ff9f43; }
.status--invited { background: rgba(90,147,255,.6); }
.status--disabled { background: #5d667a; }
.panel__user-name { font-size: 12px; font-weight: 500; }
.panel__user-cohort { font-size: 10px; color: #5d667a; background: rgba(255,255,255,.04); padding: 1px 6px; border-radius: 4px; }
.panel__user-role { font-size: 10px; color: #8e96a6; }
.panel__user-feedback { font-size: 10px; color: #8e96a6; display: flex; align-items: center; gap: 2px; margin-left: auto; }
.panel__chevron { color: #5d667a; transition: transform .15s; flex-shrink: 0; }
.panel__chevron--open { transform: rotate(180deg); }
.panel__user-detail {
  margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,.04);
  display: flex; flex-direction: column; gap: 4px;
}
.panel__detail-row { display: flex; justify-content: space-between; font-size: 11px; align-items: center; }
.panel__detail-row span:first-child { color: #5d667a; }
.panel__detail-notes { color: #8e96a6; font-style: italic; }
.panel__detail-actions { display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
.panel__btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; padding: 3px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,.08);
  background: transparent; color: #c3c9d4; cursor: pointer; transition: all .12s;
}
.panel__btn:hover { background: rgba(255,255,255,.04); }
.panel__btn--primary { background: rgba(90,147,255,.12); border-color: rgba(90,147,255,.2); color: #5a93ff; }
.panel__btn--primary:hover { background: rgba(90,147,255,.18); }
.panel__btn--ghost { border-color: transparent; color: #8e96a6; }
.panel__input {
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
  border-radius: 6px; padding: 4px 8px; font-size: 11px; color: #c3c9d4;
  min-width: 0;
}
.panel__input::placeholder { color: #5d667a; }
.panel__input--sm { max-width: 180px; }
.panel__select {
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
  border-radius: 6px; padding: 3px 6px; font-size: 10px; color: #c3c9d4;
}
.panel__select--sm { font-size: 10px; }
.panel__empty { text-align: center; color: #5d667a; padding: 24px; font-size: 12px; }
</style>
