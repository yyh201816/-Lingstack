<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBetaInstanceStore } from '../store/beta-instance.store'
import { useBetaUserStore } from '@/features/beta-users/store/beta-user.store'
import { useCloudSyncStore } from '@/features/cloud-sync/store/cloud-sync.store'
import { seedBetaOpsData } from '@/features/beta-users/services/beta-user-ops.service'
import { RUNTIME_STATUS_LABELS, UPDATER_STATUS_LABELS } from '../types'
import type { BetaInstance } from '../types'
import BetaUserPanel from '@/features/beta-users/components/BetaUserPanel.vue'
import ReleaseStrategyPanel from '@/features/release-strategy/components/ReleaseStrategyPanel.vue'
import CloudSyncPanel from '@/features/cloud-sync/components/CloudSyncPanel.vue'
import {
  Monitor, Users, Rocket, Cloud, Wifi, WifiOff, AlertTriangle,
  RotateCcw, ChevronDown, RefreshCw, Layers,
} from 'lucide-vue-next'

const instanceStore = useBetaInstanceStore()
const userStore = useBetaUserStore()
const syncStore = useCloudSyncStore()

// Tab state: instances | users | strategy | sync
type DashboardTab = 'instances' | 'users' | 'strategy' | 'sync'
const activeTab = ref<DashboardTab>('instances')

const expandedInstance = ref<string | null>(null)
const filterStatus = ref<string>('all')

onMounted(() => {
  seedBetaOpsData()
})

import { computed } from 'vue'

const filteredInstances = computed(() => {
  if (filterStatus.value === 'all') return instanceStore.instances
  if (filterStatus.value === 'problem') return instanceStore.recentProblemInstances
  if (filterStatus.value === 'outdated') return instanceStore.outdatedInstances
  return instanceStore.instances.filter(i => i.runtimeStatus === filterStatus.value)
})

function statusClass(s: string): string {
  switch (s) {
    case 'online': return 'status--ok'
    case 'offline': return 'status--off'
    case 'stale': return 'status--warn'
    case 'crash-recovered': return 'status--err'
    default: return ''
  }
}

function healthColor(s: number): string {
  if (s >= 85) return '#54d88c'
  if (s >= 70) return '#ff9f43'
  return '#ff6b6b'
}

function toggleExpand(id: string) {
  expandedInstance.value = expandedInstance.value === id ? null : id
}

// Compute overview stats
const totalInstances = computed(() => instanceStore.totalInstances)
const totalUsers = computed(() => userStore.totalUsers)
const activeUsers = computed(() => userStore.activeCount)
const syncPending = computed(() => syncStore.summary.pendingCount)
</script>

<template>
  <div class="ops-dashboard-v2">
    <div class="dash__header">
      <div class="dash__title">
        <Monitor :size="16" />
        <span>Beta Ops Dashboard</span>
      </div>
      <div class="dash__header-actions">
        <button class="dash__btn dash__btn--ghost" @click="seedBetaOpsData" title="Reload seed data">
          <RefreshCw :size="12" />
        </button>
      </div>
    </div>

    <!-- Overview cards -->
    <div class="dash__overview">
      <div class="dash__ov-card">
        <Monitor :size="12" />
        <div class="dash__ov-value">{{ totalInstances }}</div>
        <div class="dash__ov-label">Instances</div>
      </div>
      <div class="dash__ov-card">
        <Users :size="12" />
        <div class="dash__ov-value">{{ activeUsers }}/{{ totalUsers }}</div>
        <div class="dash__ov-label">Users</div>
      </div>
      <div class="dash__ov-card">
        <Cloud :size="12" />
        <div class="dash__ov-value">{{ syncPending }}</div>
        <div class="dash__ov-label">Sync Pending</div>
      </div>
      <div class="dash__ov-card">
        <Layers :size="12" />
        <div class="dash__ov-value">{{ instanceStore.avgHealthScore }}</div>
        <div class="dash__ov-label">Avg Health</div>
      </div>
    </div>

    <!-- Tab bar -->
    <div class="dash__tabs">
      <button
        v-for="tab in [
          { id: 'instances' as DashboardTab, icon: Monitor, label: 'Instances' },
          { id: 'users' as DashboardTab, icon: Users, label: 'Users' },
          { id: 'strategy' as DashboardTab, icon: Rocket, label: 'Strategy' },
          { id: 'sync' as DashboardTab, icon: Cloud, label: 'Sync' },
        ]"
        :key="tab.id"
        class="dash__tab"
        :class="{ 'dash__tab--active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <component :is="tab.icon" :size="13" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- Tab content -->
    <div class="dash__content">
      <!-- Instances tab -->
      <template v-if="activeTab === 'instances'">
        <div class="dash__inst-cards">
          <div class="dash__inst-card">
            <div class="dash__inst-card-value">{{ instanceStore.totalInstances }}</div>
            <div class="dash__inst-card-label">Instances</div>
          </div>
          <div class="dash__inst-card dash__inst-card--ok">
            <div class="dash__inst-card-value">{{ instanceStore.onlineCount }}</div>
            <div class="dash__inst-card-label"><Wifi :size="10" /> Online</div>
          </div>
          <div class="dash__inst-card dash__inst-card--warn">
            <div class="dash__inst-card-value">{{ instanceStore.offlineCount + instanceStore.staleCount }}</div>
            <div class="dash__inst-card-label"><WifiOff :size="10" /> Off/Stale</div>
          </div>
          <div class="dash__inst-card dash__inst-card--err">
            <div class="dash__inst-card-value">{{ instanceStore.crashRecoveredCount }}</div>
            <div class="dash__inst-card-label"><AlertTriangle :size="10" /> Crash</div>
          </div>
        </div>

        <div class="dash__health-bar">
          <span class="dash__health-label">Avg Health</span>
          <div class="dash__health-track">
            <div class="dash__health-fill" :style="{ width: instanceStore.avgHealthScore + '%', background: healthColor(instanceStore.avgHealthScore) }"></div>
          </div>
          <span class="dash__health-value" :style="{ color: healthColor(instanceStore.avgHealthScore) }">{{ instanceStore.avgHealthScore }}</span>
        </div>

        <div class="dash__filters">
          <button v-for="f in [{k:'all',l:'All'},{k:'online',l:'Online'},{k:'offline',l:'Offline'},{k:'problem',l:'Problems'},{k:'outdated',l:'Outdated'}]" :key="f.k"
            class="dash__filter-btn" :class="{ 'dash__filter-btn--active': filterStatus === f.k }"
            @click="filterStatus = f.k">
            {{ f.l }}
          </button>
        </div>

        <div class="dash__inst-list">
          <div v-for="inst in filteredInstances" :key="inst.instanceId" class="dash__inst-item" @click="toggleExpand(inst.instanceId)">
            <div class="dash__inst-top">
              <span class="dash__inst-dot" :class="statusClass(inst.runtimeStatus)"></span>
              <span class="dash__inst-name">{{ inst.deviceName }}</span>
              <span class="dash__inst-alias">{{ inst.userAlias }}</span>
              <span class="dash__inst-score" :style="{ color: healthColor(inst.healthScore) }">{{ inst.healthScore }}</span>
              <ChevronDown :size="12" class="dash__chevron" :class="{ 'dash__chevron--open': expandedInstance === inst.instanceId }" />
            </div>
            <div v-if="expandedInstance === inst.instanceId" class="dash__inst-detail">
              <div class="dash__detail-row"><span>OS</span><span>{{ inst.osVersion }}</span></div>
              <div class="dash__detail-row"><span>Version</span><span>{{ inst.appVersion }} <span v-if="inst.updaterStatus === 'update-available'" class="dash__tag dash__tag--warn">Update avail</span></span></div>
              <div class="dash__detail-row"><span>Runtime</span><span :class="statusClass(inst.runtimeStatus)">{{ RUNTIME_STATUS_LABELS[inst.runtimeStatus] }}</span></div>
              <div class="dash__detail-row"><span>Updater</span><span>{{ UPDATER_STATUS_LABELS[inst.updaterStatus] }}</span></div>
              <div class="dash__detail-row"><span>Channel</span><span>{{ inst.channel }}</span></div>
              <div class="dash__detail-row"><span>Last Seen</span><span>{{ inst.lastSeenAt.slice(0, 16).replace('T', ' ') }}</span></div>
              <div class="dash__detail-row"><span>Project</span><span>{{ inst.currentProjectHint || '' }}</span></div>
            </div>
          </div>
          <div v-if="filteredInstances.length === 0" class="dash__empty">No instances match the filter</div>
        </div>
      </template>

      <!-- Users tab -->
      <BetaUserPanel v-if="activeTab === 'users'" />

      <!-- Strategy tab -->
      <ReleaseStrategyPanel v-if="activeTab === 'strategy'" />

      <!-- Sync tab -->
      <CloudSyncPanel v-if="activeTab === 'sync'" />
    </div>
  </div>
</template>

<style scoped>
.ops-dashboard-v2 {
  display: flex; flex-direction: column; height: 100%;
  background: var(--ls-bg-panel, #0b0f18);
  overflow: hidden;
}
.dash__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,.06);
}
.dash__title {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 600; color: var(--ls-accent, #5a93ff);
}
.dash__header-actions { display: flex; gap: 6px; }
.dash__overview {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
  padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,.04);
}
.dash__ov-card {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  font-size: 11px; color: #8e96a6;
}
.dash__ov-value { font-size: 14px; font-weight: 700; color: #c3c9d4; }
.dash__ov-label { font-size: 9px; color: #5d667a; text-transform: uppercase; }
.dash__tabs {
  display: flex; gap: 2px; padding: 6px 16px; border-bottom: 1px solid rgba(255,255,255,.06);
  background: rgba(255,255,255,.01);
}
.dash__tab {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; padding: 5px 12px; border-radius: 6px; border: none;
  background: transparent; color: #8e96a6; cursor: pointer; transition: all .12s;
}
.dash__tab:hover { background: rgba(255,255,255,.04); color: #c3c9d4; }
.dash__tab--active { background: rgba(90,147,255,.1); color: #5a93ff; }
.dash__content { flex: 1; min-height: 0; overflow: hidden; }
/* Instance tab sub-styles */
.dash__inst-cards {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 10px 16px;
}
.dash__inst-card {
  background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.05);
  border-radius: 10px; padding: 10px 12px; text-align: center;
}
.dash__inst-card--ok { border-color: rgba(84,216,140,.15); }
.dash__inst-card--warn { border-color: rgba(255,159,67,.15); }
.dash__inst-card--err { border-color: rgba(255,107,107,.15); }
.dash__inst-card-value { font-size: 20px; font-weight: 700; color: #c3c9d4; }
.dash__inst-card-label { font-size: 10px; color: #5d667a; text-transform: uppercase; margin-top: 2px; display: flex; align-items: center; gap: 3px; justify-content: center; }
.dash__health-bar { display: flex; align-items: center; gap: 10px; padding: 0 16px 8px; }
.dash__health-label { font-size: 10px; color: #5d667a; text-transform: uppercase; min-width: 60px; }
.dash__health-track { flex: 1; height: 6px; background: rgba(255,255,255,.06); border-radius: 3px; overflow: hidden; }
.dash__health-fill { height: 100%; border-radius: 3px; transition: width .4s ease; }
.dash__health-value { font-size: 12px; font-weight: 600; min-width: 28px; text-align: right; }
.dash__filters { display: flex; gap: 4px; padding: 0 16px 6px; }
.dash__filter-btn {
  font-size: 10px; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,.06);
  background: transparent; color: #8e96a6; cursor: pointer; transition: all .12s;
}
.dash__filter-btn--active, .dash__filter-btn:hover { background: rgba(90,147,255,.1); color: #5a93ff; border-color: rgba(90,147,255,.2); }
.dash__inst-list { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 16px 16px; }
.dash__inst-item {
  border: 1px solid rgba(255,255,255,.05); border-radius: 8px; padding: 8px 10px; margin-bottom: 4px;
  cursor: pointer; transition: background .1s;
}
.dash__inst-item:hover { background: rgba(255,255,255,.02); }
.dash__inst-top { display: flex; align-items: center; gap: 8px; }
.dash__inst-dot { width: 6px; height: 6px; border-radius: 999px; flex-shrink: 0; }
.status--ok { background: #54d88c; }
.status--off { background: #5d667a; }
.status--warn { background: #ff9f43; }
.status--err { background: #ff6b6b; }
.dash__inst-name { font-size: 12px; font-weight: 500; color: #c3c9d4; }
.dash__inst-alias { font-size: 10px; color: #8e96a6; }
.dash__inst-score { font-size: 12px; font-weight: 700; margin-left: auto; }
.dash__chevron { color: #5d667a; transition: transform .15s; }
.dash__chevron--open { transform: rotate(180deg); }
.dash__inst-detail { margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,.04); display: flex; flex-direction: column; gap: 4px; }
.dash__detail-row { display: flex; justify-content: space-between; font-size: 11px; }
.dash__detail-row span:first-child { color: #5d667a; }
.dash__tag { font-size: 9px; padding: 1px 5px; border-radius: 4px; font-weight: 600; }
.dash__tag--warn { background: rgba(255,159,67,.12); color: #ff9f43; }
.dash__empty { text-align: center; color: #5d667a; padding: 20px; font-size: 12px; }
.dash__btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; padding: 3px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,.08);
  background: transparent; color: #c3c9d4; cursor: pointer; transition: all .12s;
}
.dash__btn:hover { background: rgba(255,255,255,.04); }
.dash__btn--ghost { border-color: transparent; color: #8e96a6; }
</style>
