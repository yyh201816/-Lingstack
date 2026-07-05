<!-- Legacy shell part: superseded by src/layouts/codex-shell/parts/WorkbenchTopBar.vue. -->
<script setup lang="ts">
/**
 * TopBar — 桌面工具状态栏，48px
 *
 * 左：产品名 + 版本号
 * 中：当前项目 / 工作区状态
 * 右：Model / Agent / Runtime 状态 + 设置入口
 *
 * Codex 风格：轻量、克制、有桌面工具状态栏气质
 */
import { computed } from 'vue'
import { useAppStore } from '@/stores/app.store'
import { useNavigationStore } from '@/features/navigation/store/navigation.store'
import { chatModelLabel, chatConfigured } from '@/services/chat/chat.service'
import { Settings } from 'lucide-vue-next'
import StatusBadge from './StatusBadge.vue'
import logoIcon from '@/assets/logo-32x32.png'

const app = useAppStore()
const nav = useNavigationStore()

const modelLabel = chatModelLabel
const modelStatus = computed(() => chatConfigured.value ? 'ready' as const : 'offline' as const)
</script>

<template>
  <header class="topbar" data-tauri-drag-region>
    <!-- 左：品牌 -->
    <div class="topbar__section topbar__section--left">
      <img class="topbar__logo" :src="logoIcon" alt="灵栈" width="16" height="16" />
      <span class="topbar__name">灵栈 LingStack</span>
      <span class="topbar__version">v{{ app.appVersion }}</span>
    </div>

    <!-- 中：当前项目状态 -->
    <div class="topbar__section topbar__section--center">
      <StatusBadge variant="idle">
        当前项目：{{ nav.hasOpenProject ? '已打开' : '未打开' }}
      </StatusBadge>
    </div>

    <!-- 右：系统状态 + 设置 -->
    <div class="topbar__section topbar__section--right">
      <StatusBadge :variant="modelStatus">Model: {{ modelLabel }}</StatusBadge>
      <StatusBadge variant="ready">Agent: Ready</StatusBadge>
      <StatusBadge variant="online">Runtime: Online</StatusBadge>
      <button
        class="topbar__settings"
        :class="{ 'topbar__settings--active': nav.activeView === 'settings' }"
        title="打开设置"
        @click="nav.setView('settings')"
      >
        <Settings :size="13" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  height: 48px; padding: 0 14px;
  background: var(--ls-bg-shell);
  border-bottom: 1px solid var(--ls-border-soft);
  position: relative; z-index: 50;
  user-select: none; -webkit-app-region: drag;
}

/* 三段式布局 */
.topbar__section {
  display: flex; align-items: center; gap: 7px;
}
.topbar__section--left  { min-width: 200px; }
.topbar__section--center { flex: 1; justify-content: center; }
.topbar__section--right { flex-shrink: 0; }

/* 品牌 logo 图标 — 工具身份标识，克制不抢眼 */
.topbar__logo {
  width: 16px; height: 16px;
  display: block; flex-shrink: 0;
  image-rendering: auto;
  opacity: 0.85;
}
.topbar__name {
  font-size: 12px; font-weight: 600; color: var(--ls-text-primary);
  letter-spacing: -0.01em;
}
.topbar__version {
  font-size: 9px; color: var(--ls-text-subtle); font-weight: 500;
  background: var(--ls-accent-softer); padding: 1px 5px; border-radius: 3px;
}

/* 设置按钮 */
.topbar__settings {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 5px; border: none;
  background: transparent; color: var(--ls-text-subtle); cursor: pointer;
  transition: background-color .12s ease, color .12s ease, transform .12s ease;
  -webkit-app-region: no-drag;
}
.topbar__settings:hover {
  background: var(--ls-bg-panel-hover); color: var(--ls-text-secondary);
  transform: translateY(-1px);
}
.topbar__settings:active { transform: translateY(0); }
.topbar__settings--active {
  background: var(--ls-accent-soft); color: var(--ls-accent);
}
</style>
