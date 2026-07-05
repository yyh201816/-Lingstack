<script setup lang="ts">
/**
 * ProjectPanel — 项目工作区入口面板
 *
 * DOM 结构：
 *   aside.ls-project-panel
 *   ├─ .ls-project-panel__header → 标题 + 副标题
 *   ├─ .ls-project-panel__primary-action → 打开按钮 + 提示
 *   ├─ .ls-project-panel__dropzone → 拖拽导入区
 *   ├─ .ls-project-panel__recent → 最近项目区 (ul/li/button)
 *   └─ .ls-project-panel__footer → 底部轻提示
 *
 * 状态 class：has-project / is-dragover / is-empty / has-recents
 *
 * 打开项目逻辑全部委托给父组件，本组件只负责 UI + 事件触发。
 */
import { ref } from 'vue'
import { FolderOpen, FolderPlus, Clock } from 'lucide-vue-next'
import type { RecentEntryDisplay } from '@/features/workspace/composables/useProjectService'

defineProps<{
  hasProject: boolean
  recentProjects: RecentEntryDisplay[]
}>()

const emit = defineEmits<{
  openProject: [path?: string]
}>()

const isDragOver = ref(false)

/* ====== 拖拽事件 ====== */
function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'link'
  isDragOver.value = true
}
function onDragLeave() {
  isDragOver.value = false
}
function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  const items = e.dataTransfer?.items
  if (!items || items.length === 0) return

  // 读取第一个拖入项
  const item = items[0]
  if (item.kind === 'file') {
    const file = item.getAsFile()
    if (file && file.name) {
      // WebKit 浏览器可能有 path 属性
      const winFile = file as any
      const fullPath = winFile.path || file.name
      emit('openProject', fullPath)
    }
  }
}
</script>

<template>
  <aside
    class="ls-project-panel"
    :class="{ 'has-project': hasProject }"
  >
    <!-- ====== 未打开项目：入口面板 ====== -->
    <div v-if="!hasProject" class="ls-project-panel__main">
      <!-- 1. 顶部标题区 -->
      <div class="ls-project-panel__header">
        <div class="ls-project-panel__title-group">
          <h2 class="ls-project-panel__title">项目工作区</h2>
          <p class="ls-project-panel__subtitle">连接你的本地项目与任务上下文</p>
        </div>
      </div>

      <!-- 2. 主操作区 -->
      <div class="ls-project-panel__primary-action">
        <button class="ls-project-panel__open-btn" @click="emit('openProject')">
          <span class="ls-project-panel__open-btn-icon"><FolderPlus :size="18" /></span>
          <span class="ls-project-panel__open-btn-text">打开文件夹</span>
        </button>
        <p class="ls-project-panel__action-hint">选择一个本地项目作为当前工作区</p>
      </div>

      <!-- 3. 拖拽导入区 -->
      <section
        class="ls-project-panel__dropzone"
        :class="{ 'is-dragover': isDragOver }"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        <div class="ls-project-panel__dropzone-icon">
          <FolderPlus :size="16" />
        </div>
        <p class="ls-project-panel__dropzone-title">将文件夹拖到这里</p>
        <p class="ls-project-panel__dropzone-text">快速载入本地项目、代码目录或资料目录</p>
        <p class="ls-project-panel__dropzone-hint">支持从桌面或资源管理器直接拖入</p>
      </section>

      <!-- 4. 最近项目区 -->
      <section
        class="ls-project-panel__recent"
        :class="{
          'is-empty': recentProjects.length === 0,
          'has-recents': recentProjects.length > 0,
        }"
      >
        <div class="ls-project-panel__section-head">
          <Clock :size="12" />
          <h3 class="ls-project-panel__section-title">最近项目</h3>
        </div>

        <!-- 空状态 -->
        <div v-if="recentProjects.length === 0" class="ls-project-panel__empty">
          <p class="ls-project-panel__empty-title">你还没有最近打开的项目</p>
          <p class="ls-project-panel__empty-text">打开一个本地文件夹后，这里会显示最近工作区记录</p>
        </div>

        <!-- 有列表 -->
        <ul v-else class="ls-project-panel__recent-list">
          <li
            v-for="item in recentProjects" :key="item.path"
            class="ls-project-panel__recent-item"
          >
            <button
              class="ls-project-panel__recent-button"
              @click="emit('openProject', item.path)"
            >
              <div class="ls-project-panel__recent-main">
                <span class="ls-project-panel__recent-name">{{ item.name }}</span>
                <span class="ls-project-panel__recent-path">{{ item.path }}</span>
              </div>
              <span class="ls-project-panel__recent-meta">{{ item.lastOpenedText }}</span>
            </button>
          </li>
        </ul>
      </section>

      <!-- 5. 底部轻提示 -->
      <div class="ls-project-panel__footer">
        <p class="ls-project-panel__footer-hint">工作区决定当前文件、命令与 AI 上下文范围</p>
      </div>
    </div>

    <!-- ====== 已打开项目：预留 ====== -->
    <div v-else class="ls-project-panel__loaded">
      <div class="ls-project-panel__loaded-header">
        <FolderOpen :size="13" /><span>项目文件</span>
      </div>
      <p class="ls-project-panel__loaded-placeholder">文件树由 WorkspaceShell 接管</p>
    </div>
  </aside>
</template>

<style scoped>
/* ====== 1. root ====== */
.ls-project-panel {
  display: flex; flex-direction: column;
  width: 272px; height: 100%;
  background: var(--ls-bg-panel);
  border-right: 1px solid var(--ls-border-soft);
  flex-shrink: 0; overflow: hidden;
  user-select: none; position: relative; z-index: 30;
}

/* ====== 2. major blocks ====== */
.ls-project-panel__main {
  display: flex; flex-direction: column;
  padding: 14px 16px 16px; gap: 18px;
  overflow-y: auto; flex: 1;
}

/* header */
.ls-project-panel__header {
  display: flex; flex-direction: column; gap: 4px;
  padding-bottom: 6px;
}
.ls-project-panel__title-group {
  display: flex; flex-direction: column; gap: 4px;
}

/* primary-action */
.ls-project-panel__primary-action {
  display: flex; flex-direction: column; gap: 2px;
}

/* dropzone */
.ls-project-panel__dropzone {
  min-height: 108px; padding: 16px;
  border-radius: var(--ls-radius-lg);
  border: 1px dashed rgba(79,110,247,0.22);
  background: linear-gradient(180deg, rgba(79,110,247,0.05), rgba(79,110,247,0.02));
  text-align: center;
  transition: all var(--ls-duration-base) ease;
  cursor: default;
}
.ls-project-panel__dropzone:hover {
  border-color: rgba(79,110,247,0.42);
  background: linear-gradient(180deg, rgba(79,110,247,0.07), rgba(79,110,247,0.03));
}
.ls-project-panel__dropzone-icon {
  width: 28px; height: 28px; margin: 0 auto 8px;
  border-radius: 8px; background: rgba(79,110,247,0.08);
  color: var(--ls-accent);
  display: flex; align-items: center; justify-content: center;
}

/* dropzone state */
.ls-project-panel__dropzone.is-dragover {
  border-color: var(--ls-border-accent-strong);
  box-shadow: var(--ls-focus-ring-strong);
  transform: scale(0.995);
}

/* recent */
.ls-project-panel__recent { margin-top: 2px; }

/* footer */
.ls-project-panel__footer { margin-top: auto; padding-top: 8px; }

/* ====== 3. children ====== */
.ls-project-panel__title {
  font-size: var(--ls-font-h2);
  font-weight: var(--ls-weight-title);
  color: var(--ls-text-main);
  line-height: var(--ls-leading-title);
  margin: 0;
}
.ls-project-panel__subtitle {
  font-size: var(--ls-font-caption);
  font-weight: var(--ls-weight-body);
  color: var(--ls-text-weak);
  line-height: var(--ls-leading-caption);
  margin: 0;
}

/* open-btn */
.ls-project-panel__open-btn {
  display: flex; align-items: center; gap: 10px;
  height: 40px; padding: 0 14px;
  border-radius: var(--ls-radius-md);
  border: 1px solid rgba(99,115,129,0.16);
  background: rgba(255,255,255,0.92);
  box-shadow: var(--ls-shadow-xs);
  cursor: pointer;
  transition: all var(--ls-duration-base) ease;
}
.ls-project-panel__open-btn-icon {
  width: 28px; height: 28px; border-radius: 7px;
  background: rgba(79,110,247,0.08); color: var(--ls-accent);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.ls-project-panel__open-btn-text {
  font-size: var(--ls-font-body);
  font-weight: var(--ls-weight-subtitle);
  color: var(--ls-text-main);
}
.ls-project-panel__action-hint {
  font-size: var(--ls-font-caption);
  color: var(--ls-text-weak);
  margin: 6px 0 0; padding-left: 2px;
}

/* dropzone text */
.ls-project-panel__dropzone-title {
  font-size: var(--ls-font-body);
  font-weight: var(--ls-weight-subtitle);
  color: var(--ls-text-main);
  margin: 0 0 4px;
}
.ls-project-panel__dropzone-text {
  font-size: var(--ls-font-caption);
  color: var(--ls-text-weak);
  margin: 0 0 4px;
}
.ls-project-panel__dropzone-hint {
  font-size: var(--ls-font-micro);
  color: var(--ls-text-hint);
  margin: 0;
}

/* section-head */
.ls-project-panel__section-head {
  display: flex; align-items: center; gap: 5px;
  margin-bottom: 10px;
}
.ls-project-panel__section-title {
  font-size: var(--ls-font-body-sm);
  font-weight: var(--ls-weight-title);
  color: var(--ls-text-main);
  margin: 0;
}

/* recent-list */
.ls-project-panel__recent-list {
  display: flex; flex-direction: column; gap: 4px;
  list-style: none; padding: 0; margin: 0;
}
.ls-project-panel__recent-item {
  list-style: none; padding: 0; margin: 0;
}
.ls-project-panel__recent-button {
  display: flex; align-items: flex-start; gap: 8px;
  width: 100%; padding: 10px 12px;
  border-radius: var(--ls-radius-md);
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer; text-align: left;
  transition: all var(--ls-duration-fast) ease;
}
.ls-project-panel__recent-main {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 2px;
}
.ls-project-panel__recent-name {
  font-size: var(--ls-font-body-sm);
  font-weight: var(--ls-weight-subtitle);
  color: var(--ls-text-main);
  line-height: 1.2;
}
.ls-project-panel__recent-path {
  font-size: var(--ls-font-micro);
  color: var(--ls-text-hint);
}
.ls-project-panel__recent-meta {
  font-size: var(--ls-font-micro);
  color: var(--ls-text-hint);
  flex-shrink: 0; white-space: nowrap;
}

/* empty state */
.ls-project-panel__empty { padding: 8px 2px; }
.ls-project-panel__empty-title {
  font-size: var(--ls-font-body-sm);
  color: var(--ls-text-body);
  margin: 0 0 4px;
}
.ls-project-panel__empty-text {
  font-size: var(--ls-font-caption);
  color: var(--ls-text-weak);
  margin: 0;
}

/* footer-hint */
.ls-project-panel__footer-hint {
  font-size: var(--ls-font-micro);
  color: var(--ls-text-hint);
  line-height: var(--ls-leading-caption);
  margin: 0;
}

/* loaded (has-project) */
.ls-project-panel__loaded {
  display: flex; flex-direction: column; height: 100%;
}
.ls-project-panel__loaded-header {
  display: flex; align-items: center; gap: 6px; height: 44px;
  padding: 0 16px; font-size: 12px; font-weight: 600;
  color: var(--ls-text-secondary);
  border-bottom: 1px solid var(--ls-border-soft);
}
.ls-project-panel__loaded-placeholder {
  flex: 1; display: flex; align-items: center; justify-content: center;
  font-size: 11px; color: var(--ls-text-subtle);
}

/* ====== 4. states ====== */
.ls-project-panel__open-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(79,110,247,0.32);
  box-shadow: var(--ls-shadow-sm);
  background: rgba(255,255,255,0.98);
}
.ls-project-panel__open-btn:active {
  transform: translateY(0) scale(0.99);
  box-shadow: var(--ls-shadow-xs);
}
.ls-project-panel__open-btn:focus-visible {
  outline: none;
  box-shadow: var(--ls-focus-ring);
  border-color: var(--ls-border-accent-strong);
}

.ls-project-panel__recent-button:hover {
  background: rgba(255,255,255,0.78);
  border-color: rgba(99,115,129,0.1);
  transform: translateY(-1px);
}
.ls-project-panel__recent-button:active {
  background: rgba(79,110,247,0.06);
  border-color: rgba(79,110,247,0.22);
  transform: translateY(0);
}
.ls-project-panel__recent-button:focus-visible {
  outline: none;
  box-shadow: var(--ls-focus-ring);
  border-color: var(--ls-border-accent-strong);
}

.ls-project-panel__recent.is-empty .ls-project-panel__recent-list {
  display: none;
}
</style>
