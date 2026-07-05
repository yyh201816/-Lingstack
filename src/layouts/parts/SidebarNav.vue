<script setup lang="ts">
/**
 * SidebarNav — LingStack 工作台视图切换器
 *
 * 设计目标：不是普通侧边按钮列，而是 AI 工作台稳定的视图切换系统
 * Codex 克制：图标即语义、左侧指示器即当前视图
 * Uiverse 微交互：hover 轻量升浮 + active 弹性指示
 *
 * 上区：对话 / 项目 / 终端 / 服务器 / 技能 / 模型（主工作流入口）
 * 下区：设置
 */
import { useNavigationStore, type NavView } from '@/features/navigation/store/navigation.store'
import {
  MessageSquare, FolderOpen, Terminal, Server, Zap, Box, Settings
} from 'lucide-vue-next'

const nav = useNavigationStore()

interface NavEntry {
  id: NavView
  icon: any
  label: string
}

const workItems: NavEntry[] = [
  { id: 'chat',     icon: MessageSquare, label: '对话' },
  { id: 'project',  icon: FolderOpen,    label: '项目' },
  { id: 'terminal', icon: Terminal,      label: '终端' },
  { id: 'servers',  icon: Server,        label: '服务器' },
  { id: 'skills',   icon: Zap,           label: '技能' },
  { id: 'models',   icon: Box,           label: '模型' },
]

const bottomItem: NavEntry = { id: 'settings', icon: Settings, label: '设置' }
</script>

<template>
  <nav class="nav" role="navigation" aria-label="工作台视图导航">
    <!-- 上区：主工作流入口 -->
    <div class="nav__group">
      <button
        v-for="item in workItems"
        :key="item.id"
        :class="['nav__item', { 'nav__item--active': nav.activeView === item.id }]"
        :title="item.label"
        :aria-current="nav.activeView === item.id ? 'page' : undefined"
        @click="nav.setView(item.id)"
      >
        <component :is="item.icon" :size="20" class="nav__icon" />
        <span class="nav__label">{{ item.label }}</span>
      </button>
    </div>

    <!-- 分隔 + 下区：设置 -->
    <div class="nav__divider" />
    <div class="nav__group">
      <button
        :class="['nav__item', { 'nav__item--active': nav.activeView === bottomItem.id }]"
        :title="bottomItem.label"
        :aria-current="nav.activeView === bottomItem.id ? 'page' : undefined"
        @click="nav.setView(bottomItem.id)"
      >
        <component :is="bottomItem.icon" :size="20" class="nav__icon" />
        <span class="nav__label">{{ bottomItem.label }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.nav {
  display: flex; flex-direction: column; align-items: center;
  width: 60px; height: 100%; padding: 8px 0 10px;
  background: var(--ls-bg-shell);
  border-right: 1px solid var(--ls-border-soft);
  flex-shrink: 0; user-select: none;
}

/* 导航组 */
.nav__group {
  display: flex; flex-direction: column; align-items: center;
  gap: 2px; width: 100%;
}

/* 分隔线 */
.nav__divider {
  width: 24px; height: 1px;
  background: var(--ls-border-soft);
  margin: 8px 0;
}

/* ====== 导航项 ====== */
.nav__item {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px; width: 42px; padding: 7px 4px; border-radius: 7px;
  border: none; background: transparent; color: var(--ls-text-muted);
  cursor: pointer; outline: none;
  transition: background-color .14s ease, color .14s ease, transform .14s ease;
  position: relative;
}

/* base hover */
.nav__item:hover {
  background: var(--ls-bg-panel-hover);
  color: var(--ls-text-secondary);
  transform: translateY(-1px);
}
.nav__item:hover .nav__icon {
  transform: scale(1.08);
}

/* active */
.nav__item:active {
  transform: translateY(0);
}

/* focus-visible: 键盘导航 */
.nav__item:focus-visible {
  box-shadow: var(--ls-focus-ring);
}

/* ====== Active 状态 ====== */
.nav__item--active {
  color: var(--ls-accent);
  background: var(--ls-accent-soft);
}
.nav__item--active .nav__icon {
  /* active 时不缩放 */
  transform: none;
}
.nav__item--active:hover {
  background: var(--ls-accent-soft);
  color: var(--ls-accent);
  transform: translateY(-1px);
}

/* 左侧指示器：带弹性入场动画 */
.nav__item--active::before {
  content: '';
  position: absolute;
  left: -4px;
  top: 6px; bottom: 6px;
  width: 3px;
  background: var(--ls-accent);
  border-radius: 0 2px 2px 0;
  /* 弹性入场：快速弹出，微量 overshoot */
  animation: nav-indicator-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes nav-indicator-in {
  0%   { transform: scaleY(0); opacity: 0; }
  100% { transform: scaleY(1); opacity: 1; }
}

/* 标签 */
.nav__icon {
  transition: transform .14s ease;
}
.nav__label {
  font-size: 9px; font-weight: 500; line-height: 1; opacity: 0.8;
  transition: opacity .14s ease;
}
.nav__item--active .nav__label {
  opacity: 1;
}
</style>
