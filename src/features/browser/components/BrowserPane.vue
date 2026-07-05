<script setup lang="ts">
/**
 * BrowserPane.vue  Browser Capability Panel
 * Phase 6: First-class Browser entry in Codex-style workbench
 */
import { ref } from 'vue'
import { useBrowserStore } from '../store/browser.store'
import { useThreadStore } from '@/features/threads/store/thread.store'
import { Globe, ExternalLink, X, History, Monitor, FileText } from 'lucide-vue-next'

const store = useBrowserStore()
const threadStore = useThreadStore()
const urlInput = ref('')

function handleOpenUrl() {
  const url = urlInput.value.trim()
  if (!url) return
  store.openUrl(url)
  urlInput.value = ''
}

function handleQuickOpen(url: string) {
  store.openUrl(url)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') handleOpenUrl()
}

const quickUrls = [
  { label: 'localhost:5173', url: 'http://localhost:5173' },
  { label: 'localhost:3000', url: 'http://localhost:3000' },
  { label: 'localhost:8080', url: 'http://localhost:8080' },
]
</script>

<template>
  <div class="browser-pane">
    <div class="browser-pane__header">
      <div class="browser-pane__header-left">
        <Globe :size="15" />
        <h2 class="browser-pane__title">浏览器</h2>
      </div>
      <span v-if="store.isOpen" class="browser-pane__status-badge">已开启</span>
    </div>

    <!-- URL Input -->
    <div class="browser-pane__input-row">
      <div class="browser-pane__input-wrapper">
        <Globe :size="12" class="browser-pane__input-icon" />
        <input
          v-model="urlInput"
          class="browser-pane__url-input"
          placeholder="输入地址 (localhost, file://, https://)..."
          @keydown="handleKeydown"
        />
      </div>
      <button class="browser-pane__go-btn" :disabled="!urlInput.trim()" @click="handleOpenUrl">
        <ExternalLink :size="13" /> Go
      </button>
    </div>

    <!-- 当前会话 -->
    <div v-if="store.hasUrl" class="browser-pane__current">
      <div class="browser-pane__current-header">
        <Monitor :size="12" />
        <span class="browser-pane__current-label">Current Session</span>
      </div>
      <div class="browser-pane__current-url" :title="store.currentUrl">
        {{ store.currentUrl }}
      </div>
      <div class="browser-pane__current-meta">
        <span v-if="store.boundThreadId" class="browser-pane__thread-badge">
          Thread: {{ threadStore.activeThread?.title || store.boundThreadId }}
        </span>
        <span class="browser-pane__open-state">
          {{ store.isOpen ? '面板已打开' : '面板已关闭' }}
        </span>
      </div>
    </div>

    <!-- 快速访问 -->
    <div class="browser-pane__section">
      <div class="browser-pane__section-header">
        <FileText :size="12" />
        <span>Quick Access</span>
      </div>
      <div class="browser-pane__quick-grid">
        <button
          v-for="q in quickUrls"
          :key="q.url"
          class="browser-pane__quick-btn"
          @click="handleQuickOpen(q.url)"
        >
          <span class="browser-pane__quick-url">{{ q.label }}</span>
        </button>
      </div>
    </div>

    <!-- Recent URLs -->
    <div v-if="store.recentUrls.length > 0" class="browser-pane__section">
      <div class="browser-pane__section-header">
        <History :size="12" />
        <span>最近</span>
      </div>
      <div class="browser-pane__recent-list">
        <button
          v-for="(url, i) in store.recentUrls.slice(0, 10)"
          :key="i"
          class="browser-pane__recent-item"
          @click="handleQuickOpen(url)"
        >
          <span class="browser-pane__recent-url">{{ url }}</span>
          <ExternalLink :size="10" class="browser-pane__recent-icon" />
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!store.hasUrl && store.recentUrls.length === 0" class="browser-pane__empty">
      <Globe :size="28" stroke-width="1.2" class="browser-pane__empty-icon" />
      <p class="browser-pane__empty-title">尚未打开地址</p>
      <p class="browser-pane__empty-desc">输入本地地址、文件路径或公开网址开始浏览。</p>
    </div>
  </div>
</template>

<style scoped>
.browser-pane {
  display: flex; flex-direction: column;
  height: 100%; overflow-y: auto;
  padding: 16px;
  user-select: none;
}
.browser-pane__header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.browser-pane__header-left {
  display: flex; align-items: center; gap: 8px;
  color: var(--ls-accent, #5a93ff);
}
.browser-pane__title {
  font-size: 14px; font-weight: 600;
  color: var(--ls-text-primary, #e9edf6);
  margin: 0;
}
.browser-pane__status-badge {
  font-size: 10px; padding: 2px 8px; border-radius: 999px;
  background: rgba(84,216,140,.12); color: #54d88c;
  font-weight: 500;
}
.browser-pane__input-row { display: flex; gap: 8px; margin-bottom: 16px; }
.browser-pane__input-wrapper {
  flex: 1; display: flex; align-items: center; gap: 8px;
  padding: 0 10px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,.08);
  background: var(--ls-bg-elevated, #101624);
}
.browser-pane__input-icon { color: var(--ls-text-hint, #5d667a); flex-shrink: 0; }
.browser-pane__url-input {
  flex: 1; height: 34px; background: none; border: none;
  color: var(--ls-text-primary, #e9edf6);
  font-size: 12px; font-family: monospace;
  outline: none;
}
.browser-pane__url-input::placeholder { color: var(--ls-text-hint, #5d667a); }
.browser-pane__go-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 0 14px; border-radius: 8px;
  border: none; background: var(--ls-accent, #5a93ff);
  color: #fff; font-size: 12px; font-weight: 500;
  cursor: pointer; transition: background .12s;
  white-space: nowrap;
}
.browser-pane__go-btn:hover:not(:disabled) { background: #4a83ef; }
.browser-pane__go-btn:disabled { opacity: .4; cursor: not-allowed; }

.browser-pane__current {
  padding: 12px; border-radius: 10px;
  border: 1px solid rgba(84,216,140,.15);
  background: rgba(84,216,140,.04);
  margin-bottom: 16px;
}
.browser-pane__current-header {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 6px;
}
.browser-pane__current-label {
  font-size: 10px; color: #54d88c;
  text-transform: uppercase; letter-spacing: .04em;
  font-weight: 500;
}
.browser-pane__current-url {
  font-size: 12px; font-family: monospace;
  color: var(--ls-text-secondary, #c3c9d4);
  word-break: break-all; margin-bottom: 8px;
}
.browser-pane__current-meta { display: flex; gap: 10px; align-items: center; }
.browser-pane__thread-badge {
  font-size: 10px; padding: 2px 7px; border-radius: 4px;
  background: rgba(90,147,255,.1); color: var(--ls-accent, #5a93ff);
}
.browser-pane__open-state { font-size: 10px; color: var(--ls-text-hint, #5d667a); }

.browser-pane__section { margin-bottom: 16px; }
.browser-pane__section-header {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 8px;
  font-size: 11px; font-weight: 500;
  color: var(--ls-text-hint, #5d667a);
  text-transform: uppercase; letter-spacing: .04em;
}
.browser-pane__quick-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.browser-pane__quick-btn {
  padding: 6px 12px; border-radius: 6px;
  border: 1px solid rgba(255,255,255,.06);
  background: transparent; color: var(--ls-text-secondary, #c3c9d4);
  font-size: 11px; font-family: monospace;
  cursor: pointer; transition: all .12s;
}
.browser-pane__quick-btn:hover {
  border-color: rgba(90,147,255,.3);
  background: rgba(90,147,255,.06);
}

.browser-pane__recent-list { display: flex; flex-direction: column; gap: 2px; }
.browser-pane__recent-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 10px; border-radius: 6px;
  border: none; background: transparent;
  color: var(--ls-text-secondary, #c3c9d4);
  font-size: 11px; font-family: monospace;
  cursor: pointer; transition: background .12s;
  text-align: left; width: 100%;
}
.browser-pane__recent-item:hover { background: rgba(255,255,255,.03); }
.browser-pane__recent-url {
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.browser-pane__recent-icon { opacity: 0; transition: opacity .12s; color: var(--ls-text-hint, #5d667a); }
.browser-pane__recent-item:hover .browser-pane__recent-icon { opacity: 1; }

.browser-pane__empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 40px 20px; text-align: center;
}
.browser-pane__empty-icon { color: var(--ls-text-hint, #5d667a); margin-bottom: 12px; opacity: .5; }
.browser-pane__empty-title { font-size: 13px; font-weight: 600; color: var(--ls-text-secondary, #c3c9d4); margin: 0 0 6px; }
.browser-pane__empty-desc { font-size: 11px; color: var(--ls-text-hint, #5d667a); margin: 0; max-width: 260px; line-height: 1.5; }
</style>
