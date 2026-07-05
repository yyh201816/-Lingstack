<script setup lang="ts">
import { APP_NAME, APP_VERSION } from '@/shared/constants/app'

defineEmits<{ (e: 'toggle-left'): void }>()
</script>

<template>
  <div class="titlebar">
    <div class="titlebar__left">
      <button class="titlebar__menu-btn" @click="$emit('toggle-left')" title="Toggle Sidebar">
        <span class="titlebar__menu-icon">☰</span>
      </button>
      <div class="titlebar__brand">
        <span class="titlebar__logo">◆</span>
        <span class="titlebar__name">{{ APP_NAME }}</span>
        <span class="titlebar__version">v{{ APP_VERSION }}</span>
      </div>
    </div>
    <div class="titlebar__center">
      <span class="titlebar__mode-tag">本地</span>
      <span class="titlebar__status-dot titlebar__status-dot--idle"></span>
      <span class="titlebar__status-text">空闲</span>
    </div>
    <div class="titlebar__right">
      <!-- Window controls handled by Tauri native decorations -->
    </div>
  </div>
</template>

<style scoped>
.titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 12px;
  background: var(--ls-bg-app, #070a10);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  user-select: none;
  -webkit-app-region: drag;
}
.titlebar__left, .titlebar__center, .titlebar__right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.titlebar__menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--ls-text-secondary, #8e96a6);
  font-size: 14px;
  cursor: pointer;
  -webkit-app-region: no-drag;
  transition: background 140ms ease, color 140ms ease;
}
.titlebar__menu-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--ls-text-primary, #e9edf6);
}
.titlebar__brand {
  display: flex;
  align-items: center;
  gap: 8px;
}
.titlebar__logo {
  font-size: 16px;
  color: var(--ls-accent, #5a93ff);
}
.titlebar__name {
  font-size: 13px;
  font-weight: 620;
  color: var(--ls-text-primary, #e9edf6);
  letter-spacing: -0.01em;
}
.titlebar__version {
  font-size: 11px;
  color: var(--ls-text-hint, #5d667a);
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
}
.titlebar__mode-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(90, 147, 255, 0.12);
  color: var(--ls-accent, #5a93ff);
  font-weight: 500;
  letter-spacing: 0.02em;
}
.titlebar__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
}
.titlebar__status-dot--idle { background: rgba(84, 216, 140, 0.8); }
.titlebar__status-dot--running { background: var(--ls-accent, #5a93ff); animation: pulse-dot 1.5s ease infinite; }
.titlebar__status-text { font-size: 11px; color: var(--ls-text-hint, #5d667a); }
@keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
