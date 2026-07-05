<script setup lang="ts">
/**
 * ComputerUsePane.vue  Computer Use Capability Panel
 * Phase 6: First-class Computer Use entry in Codex-style workbench
 */
import { onMounted } from 'vue'
import { useComputerUseStore } from '../store/computer-use.store'
import {
  Monitor, Shield, ShieldOff, ShieldCheck, AlertCircle,
  Power, RefreshCw, Play, Square
} from 'lucide-vue-next'

const store = useComputerUseStore()

onMounted(() => {
  store.checkAvailability()
})

function handleToggleRun() {
  if (store.isRunning) {
    store.setRunning(false)
  } else {
    store.setRunning(true, 'Desktop')
  }
}

const permissionLabel = (perm: string) => {
  switch (perm) {
    case 'granted': return 'Granted'
    case 'denied': return 'Denied'
    case 'unknown': return 'Not Checked'
    default: return perm
  }
}

const permissionClass = (perm: string) => `cu-pane__perm-badge cu-pane__perm-badge--${perm}`
</script>

<template>
  <div class="cu-pane">
    <div class="cu-pane__header">
      <div class="cu-pane__header-left">
        <Monitor :size="15" />
        <h2 class="cu-pane__title">桌面控制</h2>
      </div>
      <span v-if="store.isRunning" class="cu-pane__running-badge">运行中</span>
    </div>

    <!-- Status Card -->
    <div class="cu-pane__status-card">
      <div class="cu-pane__status-row">
        <span class="cu-pane__status-label">可用性</span>
        <span :class="store.isAvailable ? 'cu-pane__status-val--ok' : 'cu-pane__status-val--na'">
          {{ store.isAvailable ? 'Available' : 'Not Available' }}
        </span>
      </div>
      <div class="cu-pane__status-row">
        <span class="cu-pane__status-label">权限</span>
        <div class="cu-pane__status-right">
          <span :class="permissionClass(store.permissionStatus)">
            <ShieldCheck v-if="store.permissionStatus === 'granted'" :size="11" />
            <ShieldOff v-else-if="store.permissionStatus === 'denied'" :size="11" />
            <Shield v-else :size="11" />
            {{ permissionLabel(store.permissionStatus) }}
          </span>
        </div>
      </div>
      <div v-if="store.state.currentTargetApp" class="cu-pane__status-row">
        <span class="cu-pane__status-label">目标</span>
        <span class="cu-pane__status-val">{{ store.state.currentTargetApp }}</span>
      </div>
      <div v-if="store.state.lastActionSummary" class="cu-pane__status-row">
        <span class="cu-pane__status-label">上次操作</span>
        <span class="cu-pane__status-val--ok">{{ store.state.lastActionSummary }}</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="cu-pane__actions">
      <button
        v-if="!store.isAvailable && store.permissionStatus !== 'granted'"
        class="cu-pane__action-btn cu-pane__action-btn--primary"
        :disabled="store.loading"
        @click="store.requestPermission()"
      >
        <ShieldCheck :size="13" />
        {{ store.loading ? '请求中...' : 'Request Permission' }}
      </button>

      <button
        v-if="store.isAvailable"
        :class="['cu-pane__action-btn', store.isRunning ? 'cu-pane__action-btn--stop' : 'cu-pane__action-btn--primary']"
        @click="handleToggleRun"
      >
        <Square v-if="store.isRunning" :size="13" />
        <Play v-else :size="13" />
        {{ store.isRunning ? 'Stop' : 'Start Session' }}
      </button>

      <button
        class="cu-pane__action-btn"
        :disabled="store.loading"
        @click="store.checkAvailability()"
      >
        <RefreshCw :size="13" :class="{ spinning: store.loading }" />
        Recheck
      </button>
    </div>

    <!-- Error State -->
    <div v-if="store.error" class="cu-pane__error">
      <AlertCircle :size="13" /> {{ store.error }}
    </div>

    <!-- Info Card -->
    <div class="cu-pane__info-card">
      <h3 class="cu-pane__info-title">关于桌面控制</h3>
      <p class="cu-pane__info-text">
        桌面控制允许灵栈代表您与桌面应用程序交互。
        这是一个高权限功能，需要明确的用户授权。
      </p>
      <ul class="cu-pane__info-list">
        <li>访问桌面应用程序</li>
        <li>导航 UI 元素</li>
        <li>执行自动化操作</li>
        <li>将结果返回到当前线程</li>
      </ul>
    </div>

    <!-- Empty / Unavailable State -->
    <div v-if="!store.isAvailable && !store.loading" class="cu-pane__unavailable">
      <Monitor :size="32" stroke-width="1.2" class="cu-pane__unavailable-icon" />
      <p class="cu-pane__unavailable-title">桌面控制当前不可用</p>
      <p class="cu-pane__unavailable-desc">
        此功能需要桌面级权限，尚未配置。
        请上方请求权限以启用桌面控制。
      </p>
    </div>
  </div>
</template>

<style scoped>
.cu-pane {
  display: flex; flex-direction: column;
  height: 100%; overflow-y: auto;
  padding: 16px;
  user-select: none;
}
.cu-pane__header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.cu-pane__header-left {
  display: flex; align-items: center; gap: 8px;
  color: var(--ls-accent, #5a93ff);
}
.cu-pane__title {
  font-size: 14px; font-weight: 600;
  color: var(--ls-text-primary, #e9edf6);
  margin: 0;
}
.cu-pane__running-badge {
  font-size: 10px; padding: 2px 8px; border-radius: 999px;
  background: rgba(84,216,140,.12); color: #54d88c;
  font-weight: 500; animation: pulse 1.5s ease infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }

.cu-pane__status-card {
  padding: 14px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,.06);
  background: var(--ls-bg-elevated, #101624);
  margin-bottom: 14px;
}
.cu-pane__status-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 5px 0;
}
.cu-pane__status-row + .cu-pane__status-row { border-top: 1px solid rgba(255,255,255,.04); }
.cu-pane__status-label {
  font-size: 11px; color: var(--ls-text-hint, #5d667a);
}
.cu-pane__status-val,
.cu-pane__status-val--ok,
.cu-pane__status-val--na {
  font-size: 11px; font-weight: 500;
}
.cu-pane__status-val { color: var(--ls-text-secondary, #c3c9d4); }
.cu-pane__status-val--ok { color: #54d88c; }
.cu-pane__status-val--na { color: #ff6b6b; }
.cu-pane__perm-badge {
  display: flex; align-items: center; gap: 4px;
  font-size: 10px; padding: 2px 8px; border-radius: 999px;
}
.cu-pane__perm-badge--granted { background: rgba(84,216,140,.12); color: #54d88c; }
.cu-pane__perm-badge--denied { background: rgba(255,107,107,.12); color: #ff6b6b; }
.cu-pane__perm-badge--unknown { background: rgba(142,150,166,.12); color: #8e96a6; }

.cu-pane__actions { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
.cu-pane__action-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 8px 14px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,.08);
  background: transparent;
  color: var(--ls-text-secondary, #c3c9d4);
  font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all .12s;
}
.cu-pane__action-btn:hover:not(:disabled) { background: rgba(255,255,255,.04); }
.cu-pane__action-btn:disabled { opacity: .4; cursor: not-allowed; }
.cu-pane__action-btn--primary {
  background: var(--ls-accent, #5a93ff); border-color: transparent;
  color: #fff;
}
.cu-pane__action-btn--primary:hover:not(:disabled) { background: #4a83ef; }
.cu-pane__action-btn--stop {
  background: rgba(255,107,107,.1); border-color: rgba(255,107,107,.2);
  color: #ff6b6b;
}
.cu-pane__action-btn--stop:hover { background: rgba(255,107,107,.18); }

.cu-pane__error {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-radius: 6px;
  background: rgba(255,107,107,.08);
  color: #ff6b6b; font-size: 12px; margin-bottom: 14px;
}

.cu-pane__info-card {
  padding: 14px; border-radius: 10px;
  background: rgba(90,147,255,.04);
  border: 1px solid rgba(90,147,255,.08);
  margin-bottom: 14px;
}
.cu-pane__info-title {
  font-size: 12px; font-weight: 600;
  color: var(--ls-text-primary, #e9edf6);
  margin: 0 0 8px;
}
.cu-pane__info-text {
  font-size: 11px; color: var(--ls-text-hint, #5d667a);
  margin: 0 0 10px; line-height: 1.5;
}
.cu-pane__info-list {
  margin: 0; padding-left: 16px;
  font-size: 11px; color: var(--ls-text-secondary, #c3c9d4);
  line-height: 1.7;
}

.cu-pane__unavailable {
  display: flex; flex-direction: column;
  align-items: center; text-align: center;
  padding: 30px 20px;
}
.cu-pane__unavailable-icon { color: var(--ls-text-hint, #5d667a); margin-bottom: 12px; opacity: .4; }
.cu-pane__unavailable-title {
  font-size: 13px; font-weight: 600;
  color: var(--ls-text-secondary, #c3c9d4);
  margin: 0 0 6px;
}
.cu-pane__unavailable-desc {
  font-size: 11px; color: var(--ls-text-hint, #5d667a);
  margin: 0; max-width: 300px; line-height: 1.5;
}
.spinning { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
