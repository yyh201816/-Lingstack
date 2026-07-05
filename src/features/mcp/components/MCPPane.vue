<script setup lang="ts">
/**
 * MCPPane.vue  MCP / Integrations  Panel
 * Phase 6: First-class MCP entry in Codex-style workbench
 */
import { computed } from 'vue'
import { useMcpStore } from '../store/mcp.store'
import { Link, Plug, RefreshCw, Loader, AlertCircle, Check, X, ToggleLeft, ToggleRight } from 'lucide-vue-next'

const store = useMcpStore()

const statusIcon = (status: string) => {
  switch (status) {
    case 'connected': return Check
    case 'disconnected': return X
    case 'error': return AlertCircle
    case 'authorizing': return Loader
    default: return Plug
  }
}

const statusClass = (status: string) => `mcp-pane__status-dot mcp-pane__status-dot--${status}`
const statusLabel = (status: string) => {
  switch (status) {
    case 'connected': return 'Connected'
    case 'disconnected': return 'Disconnected'
    case 'error': return 'Error'
    case 'authorizing': return 'Authorizing'
    default: return status
  }
}
</script>

<template>
  <div class="mcp-pane">
    <div class="mcp-pane__header">
      <div class="mcp-pane__header-left">
        <Link :size="15" />
        <h2 class="mcp-pane__title">集成 / MCP</h2>
      </div>
      <button class="mcp-pane__refresh-btn" :disabled="store.loading" @click="store.checkAllServices()">
        <RefreshCw :size="13" :class="{ spinning: store.loading }" />
      </button>
    </div>

    <!-- Summary -->
    <div class="mcp-pane__summary">
      <span class="mcp-pane__summary-item">
        <Plug :size="11" /> {{ store.connectedCount }}/{{ store.serviceCount }} connected
      </span>
      <span v-if="store.hasErrors" class="mcp-pane__summary-item mcp-pane__summary-item--error">
        <AlertCircle :size="11" /> Error
      </span>
    </div>

    <!-- Error -->
    <div v-if="store.error" class="mcp-pane__error">
      <AlertCircle :size="13" /> {{ store.error }}
    </div>

    <!-- Service List -->
    <div class="mcp-pane__list">
      <div
        v-for="svc in store.services"
        :key="svc.id"
        :class="['mcp-pane__card', { 'mcp-pane__card--error': svc.status === 'error' }]"
      >
        <div class="mcp-pane__card-left">
          <div :class="statusClass(svc.status)"></div>
          <div class="mcp-pane__card-info">
            <h3 class="mcp-pane__card-name">{{ svc.name }}</h3>
            <p v-if="svc.description" class="mcp-pane__card-desc">{{ svc.description }}</p>
            <div class="mcp-pane__card-meta">
              <span :class="`mcp-pane__card-status mcp-pane__card-status--${svc.status}`">
                {{ statusLabel(svc.status) }}
              </span>
              <span class="mcp-pane__card-type">{{ svc.type }}</span>
              <span v-if="svc.lastCheckedAt" class="mcp-pane__card-time">
                上次检查: {{ new Date(svc.lastCheckedAt).toLocaleTimeString() }}
              </span>
            </div>
            <p v-if="svc.errorMessage" class="mcp-pane__card-error-msg">{{ svc.errorMessage }}</p>
          </div>
        </div>
        <button
          class="mcp-pane__toggle-btn"
          @click="store.toggleService(svc.id)"
        >
          <ToggleRight v-if="svc.enabled" :size="20" class="mcp-pane__toggle--on" />
          <ToggleLeft v-else :size="20" />
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="store.services.length === 0 && !store.loading" class="mcp-pane__empty">
      <Plug :size="28" stroke-width="1.2" class="mcp-pane__empty-icon" />
      <p class="mcp-pane__empty-title">暂无外部服务连接</p>
      <p class="mcp-pane__empty-desc">从设置添加集成以扩展灵栈's capabilities.</p>
    </div>
  </div>
</template>

<style scoped>
.mcp-pane {
  display: flex; flex-direction: column;
  height: 100%; overflow-y: auto;
  padding: 16px;
  user-select: none;
}
.mcp-pane__header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.mcp-pane__header-left {
  display: flex; align-items: center; gap: 8px;
  color: var(--ls-accent, #5a93ff);
}
.mcp-pane__title {
  font-size: 14px; font-weight: 600;
  color: var(--ls-text-primary, #e9edf6);
  margin: 0;
}
.mcp-pane__refresh-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px;
  border: 1px solid rgba(255,255,255,.08);
  background: transparent; color: var(--ls-text-hint, #5d667a);
  cursor: pointer; transition: all .12s;
}
.mcp-pane__refresh-btn:hover { background: rgba(255,255,255,.04); color: var(--ls-text-secondary, #c3c9d4); }
.spinning { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.mcp-pane__summary {
  display: flex; gap: 12px; align-items: center;
  padding: 8px 12px; border-radius: 8px;
  background: rgba(255,255,255,.03);
  margin-bottom: 14px; font-size: 11px;
}
.mcp-pane__summary-item {
  display: flex; align-items: center; gap: 5px;
  color: var(--ls-text-secondary, #c3c9d4);
}
.mcp-pane__summary-item--error { color: #ff6b6b; }

.mcp-pane__error {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-radius: 6px;
  background: rgba(255,107,107,.08);
  color: #ff6b6b; font-size: 12px;
  margin-bottom: 14px;
}

.mcp-pane__list { display: flex; flex-direction: column; gap: 6px; }
.mcp-pane__card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,.06);
  background: var(--ls-bg-elevated, #101624);
  transition: border-color .12s;
}
.mcp-pane__card:hover { border-color: rgba(255,255,255,.1); }
.mcp-pane__card--error { border-color: rgba(255,107,107,.15); }
.mcp-pane__card-left { display: flex; gap: 10px; align-items: flex-start; min-width: 0; }
.mcp-pane__card-info { min-width: 0; }
.mcp-pane__card-name {
  font-size: 13px; font-weight: 600;
  color: var(--ls-text-primary, #e9edf6);
  margin: 0 0 2px;
}
.mcp-pane__card-desc {
  font-size: 11px; color: var(--ls-text-hint, #5d667a);
  margin: 0 0 6px; line-height: 1.4;
}
.mcp-pane__card-meta { display: flex; gap: 10px; align-items: center; }
.mcp-pane__card-status {
  font-size: 10px; padding: 1px 7px; border-radius: 999px;
  font-weight: 500;
}
.mcp-pane__card-status--connected { background: rgba(84,216,140,.12); color: #54d88c; }
.mcp-pane__card-status--disconnected { background: rgba(142,150,166,.12); color: #8e96a6; }
.mcp-pane__card-status--error { background: rgba(255,107,107,.12); color: #ff6b6b; }
.mcp-pane__card-status--authorizing { background: rgba(255,212,99,.12); color: #ffd463; }
.mcp-pane__card-type {
  font-size: 10px; color: var(--ls-text-hint, #5d667a);
  text-transform: uppercase;
}
.mcp-pane__card-time { font-size: 10px; color: var(--ls-text-hint, #5d667a); }
.mcp-pane__card-error-msg { font-size: 10px; color: #ff6b6b; margin: 4px 0 0; }

.mcp-pane__status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  margin-top: 4px; flex-shrink: 0;
}
.mcp-pane__status-dot--connected { background: #54d88c; }
.mcp-pane__status-dot--disconnected { background: #8e96a6; }
.mcp-pane__status-dot--error { background: #ff6b6b; }
.mcp-pane__status-dot--authorizing { background: #ffd463; animation: pulse 1s ease infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

.mcp-pane__toggle-btn {
  background: none; border: none; cursor: pointer;
  color: var(--ls-text-hint, #5d667a);
  padding: 4px; border-radius: 6px; transition: all .12s;
}
.mcp-pane__toggle-btn:hover { background: rgba(255,255,255,.04); }
.mcp-pane__toggle--on { color: var(--ls-accent, #5a93ff); }

.mcp-pane__empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 40px 20px; text-align: center;
}
.mcp-pane__empty-icon { color: var(--ls-text-hint, #5d667a); margin-bottom: 12px; opacity: .5; }
.mcp-pane__empty-title { font-size: 13px; font-weight: 600; color: var(--ls-text-secondary, #c3c9d4); margin: 0 0 6px; }
.mcp-pane__empty-desc { font-size: 11px; color: var(--ls-text-hint, #5d667a); margin: 0; max-width: 260px; line-height: 1.5; }
</style>
