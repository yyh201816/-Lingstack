<!--
  SkillsPanel — LingStack Skill Runner 面板
  
  功能：
  - 展示已加载的 skill 列表（当前仅 lingstack-self-heal）
  - 显示 skill 详情（名称、描述、指令摘要、引用文件）
  - 「运行技能」按钮 → 收集上下文 → 组装 payload → 展示结果
  - 结果区支持「复制」和「发送到 Chat」
  
  交互规范：整体 Codex 工具感 + 局部 Uiverse 轻反馈
-->
<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useSkillsStore } from '../store/skills.store'
import { useNavigationStore } from '@/features/navigation/store/navigation.store'
import { RunPhase } from '@/services/skills/skill-runner.service'
import TaskBoard from '@/features/self-heal/components/TaskBoard.vue'
import { Zap, Play, Copy, MessageSquare, Loader, AlertCircle, Check, FileText, BookOpen, ChevronRight, RefreshCw, ListTodo, Globe, Folder, FileCode } from 'lucide-vue-next'

const store = useSkillsStore()
const nav = useNavigationStore()
const copied = ref(false)
const instructionExpanded = ref(false)

onMounted(() => {
  store.fetchSkills()
})

const runLabel = computed(() => store.phaseLabel)

async function handleRun() {
  await store.executeSelected()
}

function handleCopy() {
  if (!store.lastResult?.promptText) return
  navigator.clipboard.writeText(store.lastResult.promptText)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

/** R25: 发送完整 SkillExecutionPayload 到 Chat */
function handleSendToChat() {
  if (!store.lastResult?.promptText) return
  // 切换到 Chat 视图
  nav.setView('chat')
  // R25: 传递完整 SkillExecutionPayload（ChatPanel 会消费 skill + workspace + knowledge + model）
  window.dispatchEvent(new CustomEvent('skill-prompt', { detail: store.lastResult }))
}

/** 指令第一段的简略版本 */
const instructionSummary = computed(() => {
  if (!store.selectedSkill?.instructions) return ''
  const firstParagraph = store.selectedSkill.instructions.split('\n\n')[0] ?? ''
  return firstParagraph.slice(0, 200) + (firstParagraph.length > 200 ? '...' : '')
})
</script>

<template>
  <div class="skills-panel">
    <!-- ====== Header ====== -->
    <div class="skills-panel__header">
      <div class="skills-panel__header-top">
        <Zap :size="17" stroke-width="1.8" />
        <h1 class="skills-panel__title">技能中心</h1>
      </div>
      <p class="skills-panel__subtitle">运行项目级技能，让 AI 基于当前工作区上下文生成分析方案。</p>
    </div>

    <!-- ====== Loading ====== -->
    <div v-if="store.loading" class="skills-panel__state">
      <Loader :size="18" class="skills-panel__state-icon--spin" />
      <p>正在加载技能...</p>
    </div>

    <!-- ====== Error ====== -->
    <div v-else-if="store.loadError" class="skills-panel__state skills-panel__state--error">
      <AlertCircle :size="18" />
      <p>{{ store.loadError }}</p>
      <button class="skills-panel__retry-btn" @click="store.fetchSkills()">
        <RefreshCw :size="13" />重试
      </button>
    </div>

    <!-- ====== 内容 ====== -->
    <template v-else-if="store.skills.length > 0">
      <!-- Skill 列表 + 选中项详情 -->
      <div class="skills-panel__list">
        <div
          v-for="skill in store.skills"
          :key="skill.id"
          :class="['skills-panel__card', { 'skills-panel__card--selected': store.selectedId === skill.id }]"
          @click="store.selectSkill(skill.id)"
        >
          <div class="skills-panel__card-left">
            <div class="skills-panel__card-icon">
              <Zap :size="16" stroke-width="1.6" />
            </div>
            <div class="skills-panel__card-body">
              <h3 class="skills-panel__card-title">{{ skill.name }}</h3>
              <p class="skills-panel__card-desc">{{ skill.description || '暂无描述' }}</p>
            </div>
          </div>
          <ChevronRight :size="14" class="skills-panel__card-arrow" />
        </div>
      </div>

      <!-- ====== 选中 skill 详情 ====== -->
      <div v-if="store.selectedSkill" class="skills-panel__detail">
        <!-- 描述 -->
        <div class="skills-panel__detail-header">
          <h2 class="skills-panel__detail-name">{{ store.selectedSkill.name }}</h2>
          <p class="skills-panel__detail-meta">
            来源: {{ store.selectedSkill.sourcePath }}
            <span v-if="store.selectedSkill.references.length > 0">
              · {{ store.selectedSkill.references.length }} 个引用文件
            </span>
          </p>
        </div>

        <!-- 指令摘要 -->
        <div class="skills-panel__instructions">
          <div class="skills-panel__instructions-header" @click="instructionExpanded = !instructionExpanded">
            <BookOpen :size="13" />
            <span>执行指令</span>
            <button class="skills-panel__expand-btn">{{ instructionExpanded ? '收起' : '展开' }}</button>
          </div>
          <p v-if="!instructionExpanded" class="skills-panel__instructions-summary">{{ instructionSummary }}</p>
          <pre v-else class="skills-panel__instructions-full">{{ store.selectedSkill.instructions }}</pre>
        </div>

        <!-- 引用文件 -->
        <div v-if="store.selectedSkill.references.length > 0" class="skills-panel__refs">
          <FileText :size="12" />
          <span class="skills-panel__refs-label">引用文件：</span>
          <span v-for="ref in store.selectedSkill.references" :key="ref" class="skills-panel__refs-item">{{ ref }}</span>
        </div>

        <!-- 运行按钮 -->
        <div class="skills-panel__actions">
          <button
            :class="['skills-panel__run-btn', { 'skills-panel__run-btn--running': store.isRunning }]"
            :disabled="store.isRunning || !store.selectedSkill.loaded"
            @click="handleRun"
          >
            <Loader v-if="store.isRunning" :size="14" class="skills-panel__state-icon--spin" />
            <Play v-else :size="14" />
            {{ runLabel }}
          </button>
        </div>
      </div>

      <!-- ====== 运行结果 ====== -->
      <!-- R25: 运行中（分阶段显示） -->
      <div v-if="store.isRunning" class="skills-panel__result skills-panel__result--running">
        <Loader :size="16" class="skills-panel__state-icon--spin" />
        <span>{{ store.phaseLabel }}</span>
      </div>

      <!-- 错误 -->
      <div v-else-if="store.runPhase === RunPhase.Error" class="skills-panel__result skills-panel__result--error">
        <AlertCircle :size="15" />
        <div>
          <p class="skills-panel__result-error-title">运行失败</p>
          <p class="skills-panel__result-error-desc">{{ store.lastRunError }}</p>
        </div>
      </div>

      <!-- 成功 -->
      <div v-else-if="store.hasResult && store.lastResult" class="skills-panel__result">
        <div class="skills-panel__result-header">
          <Check :size="14" class="skills-panel__result-check" />
          <span>Skill Prompt 已生成</span>
          <span class="skills-panel__result-time">{{ new Date(store.lastResult.generatedAt).toLocaleTimeString() }}</span>
        </div>

        <!-- R25: 三链合流注入摘要 -->
        <div class="skills-panel__result-inject">
          <div class="skills-panel__inject-title">注入摘要</div>
          <div class="skills-panel__inject-grid">
            <!-- 工作区上下文 -->
            <div class="skills-panel__inject-item">
              <Folder :size="11" />
              <span class="skills-panel__inject-label">工作区</span>
              <span class="skills-panel__inject-val">{{ store.lastResult.workspace.projectName ?? store.lastResult.workspace.projectPath ?? '未打开' }}</span>
            </div>
            <!-- 当前文件 -->
            <div class="skills-panel__inject-item">
              <FileCode :size="11" />
              <span class="skills-panel__inject-label">当前文件</span>
              <span class="skills-panel__inject-val">{{ store.lastResult.workspace.activeFileName ?? '无' }}</span>
            </div>
            <!-- 远程知识增强 -->
            <div class="skills-panel__inject-item">
              <Globe :size="11" />
              <span class="skills-panel__inject-label">远程知识</span>
              <span class="skills-panel__inject-val">
                <template v-if="store.lastResult.knowledge.totalMatched > 0">
                  {{ store.lastResult.knowledge.matchedRules.length }} 规则 · {{ store.lastResult.knowledge.matchedPrompts.length }} 提示 · {{ store.lastResult.knowledge.matchedGuidance.length }} 指导
                </template>
                <template v-else>无匹配</template>
              </span>
            </div>
            <!-- 当前模型 -->
            <div class="skills-panel__inject-item">
              <Zap :size="11" />
              <span class="skills-panel__inject-label">模型</span>
              <span class="skills-panel__inject-val">{{ store.lastResult.model.displayName ?? '未配置' }}</span>
            </div>
          </div>
        </div>

        <!-- Prompt 预览 -->
        <div class="skills-panel__result-prompt">
          <pre class="skills-panel__result-prompt-text">{{ store.lastResult.promptText }}</pre>
        </div>

        <!-- 操作按钮 -->
        <div class="skills-panel__result-actions">
          <button :class="['skills-panel__result-btn', { 'skills-panel__result-btn--copied': copied }]" @click="handleCopy">
            <Check v-if="copied" :size="12" />
            <Copy v-else :size="12" />
            {{ copied ? '已复制' : '复制 Prompt' }}
          </button>
          <button class="skills-panel__result-btn skills-panel__result-btn--primary" @click="handleSendToChat">
            <MessageSquare :size="12" />
            发送到 Chat
          </button>
        </div>
      </div>

      <!-- ====== R26: 自修复任务面板 ====== -->
      <div v-if="store.hasSelfHealTasks" class="skills-panel__tasks-section">
        <div class="skills-panel__tasks-header">
          <ListTodo :size="15" />
          <span class="skills-panel__tasks-title">自修复任务</span>
          <span class="skills-panel__tasks-hint">从 skill 输出中提取的可跟踪任务项</span>
        </div>
        <TaskBoard />
      </div>
    </template>

    <!-- ====== 空状态 ====== -->
    <div v-else class="skills-panel__state">
      <Zap :size="24" stroke-width="1.2" class="skills-panel__state-icon" />
      <p>没有找到可用技能</p>
      <p class="skills-panel__state-hint">请确认 skills/ 目录中存在合法的 SKILL.md 文件</p>
    </div>
  </div>
</template>

<style scoped>
/* ====== 容器 ====== */
.skills-panel {
  flex: 1; overflow-y: auto;
  padding: var(--ls-space-8) var(--ls-space-9);
  max-width: 900px; margin: 0 auto;
  display: flex; flex-direction: column; gap: var(--ls-space-6);
}

/* ====== Header ====== */
.skills-panel__header { margin-bottom: 4px; }
.skills-panel__header-top {
  display: flex; align-items: center; gap: 8px;
  color: var(--ls-accent); margin-bottom: 6px;
}
.skills-panel__title {
  font-size: var(--ls-font-h1);
  font-weight: var(--ls-weight-display);
  color: var(--ls-text-strong);
  letter-spacing: -0.02em; margin: 0;
}
.skills-panel__subtitle {
  font-size: var(--ls-font-body);
  color: var(--ls-text-weak);
  margin: 0 0 0 25px;
}

/* ====== 状态占位 ====== */
.skills-panel__state {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 8px;
  padding: var(--ls-space-9);
  color: var(--ls-text-weak);
  font-size: var(--ls-font-body);
}
.skills-panel__state--error { color: var(--ls-danger); }
.skills-panel__state-icon { color: var(--ls-text-hint); }
.skills-panel__state-hint { font-size: var(--ls-font-caption); color: var(--ls-text-hint); }
.skills-panel__state-icon--spin { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg) } }
.skills-panel__retry-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 12px; border-radius: var(--ls-radius-sm);
  border: 1px solid var(--ls-border-subtle);
  background: var(--ls-bg-surface);
  font-size: var(--ls-font-caption);
  color: var(--ls-text-body);
  cursor: pointer; transition: all var(--ls-duration-fast);
}
.skills-panel__retry-btn:hover {
  border-color: var(--ls-border-accent);
  color: var(--ls-accent);
}

/* ====== Skill 列表卡片 ====== */
.skills-panel__list {
  display: flex; flex-direction: column; gap: 6px;
}
.skills-panel__card {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--ls-space-4);
  border-radius: var(--ls-radius-md);
  border: 1px solid var(--ls-border-subtle);
  background: var(--ls-bg-surface);
  cursor: pointer;
  transition: all var(--ls-duration-base) var(--ls-ease-standard);
}
.skills-panel__card:hover {
  border-color: var(--ls-border-accent);
  transform: translateY(-1px);
  box-shadow: var(--ls-shadow-sm);
}
.skills-panel__card--selected {
  border-color: var(--ls-border-accent);
  background: rgba(79,110,247,0.03);
}
.skills-panel__card-left {
  display: flex; align-items: center; gap: 12px;
}
.skills-panel__card-icon {
  width: 36px; height: 36px; border-radius: 8px;
  background: rgba(79,110,247,0.06);
  color: var(--ls-accent);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.skills-panel__card-body { min-width: 0; }
.skills-panel__card-title {
  font-size: var(--ls-font-body);
  font-weight: var(--ls-weight-title);
  color: var(--ls-text-main);
  margin: 0 0 2px;
}
.skills-panel__card-desc {
  font-size: var(--ls-font-caption);
  color: var(--ls-text-weak);
  margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.skills-panel__card-arrow {
  color: var(--ls-text-hint);
  flex-shrink: 0; transition: transform .14s;
}
.skills-panel__card:hover .skills-panel__card-arrow {
  transform: translateX(2px);
  color: var(--ls-accent);
}

/* ====== 详情区 ====== */
.skills-panel__detail {
  padding: var(--ls-space-5);
  border-radius: var(--ls-radius-lg);
  border: 1px solid var(--ls-border-subtle);
  background: var(--ls-bg-surface);
  display: flex; flex-direction: column; gap: var(--ls-space-4);
}
.skills-panel__detail-name {
  font-size: var(--ls-font-h2);
  font-weight: var(--ls-weight-title);
  color: var(--ls-text-main);
  margin: 0 0 4px;
}
.skills-panel__detail-meta {
  font-size: var(--ls-font-micro);
  color: var(--ls-text-hint);
  margin: 0;
}

/* 指令区 */
.skills-panel__instructions {
  border: 1px solid var(--ls-border-subtle);
  border-radius: var(--ls-radius-sm);
  padding: var(--ls-space-3);
  background: var(--ls-bg-muted);
}
.skills-panel__instructions-header {
  display: flex; align-items: center; gap: 6px;
  font-size: var(--ls-font-caption);
  font-weight: var(--ls-weight-subtitle);
  color: var(--ls-text-body);
  margin-bottom: 6px; cursor: pointer;
}
.skills-panel__expand-btn {
  margin-left: auto; border: none; background: none;
  font-size: var(--ls-font-micro); color: var(--ls-accent);
  cursor: pointer; padding: 2px 6px;
}
.skills-panel__instructions-summary {
  font-size: var(--ls-font-caption);
  color: var(--ls-text-weak);
  line-height: var(--ls-leading-caption);
  margin: 0;
}
.skills-panel__instructions-full {
  font-size: var(--ls-font-caption);
  color: var(--ls-text-body);
  line-height: var(--ls-leading-caption);
  white-space: pre-wrap; word-break: break-word;
  margin: 0; max-height: 240px; overflow-y: auto;
}

/* 引用文件 */
.skills-panel__refs {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  font-size: var(--ls-font-micro); color: var(--ls-text-hint);
}
.skills-panel__refs-label { font-weight: var(--ls-weight-subtitle); }
.skills-panel__refs-item {
  background: var(--ls-bg-muted); padding: 2px 7px;
  border-radius: 4px; font-family: var(--ls-font-mono, monospace);
  font-size: 10px;
}

/* 运行按钮 */
.skills-panel__actions { margin-top: 4px; }
.skills-panel__run-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 20px;
  border-radius: var(--ls-radius-sm);
  border: none;
  background: linear-gradient(135deg, var(--ls-accent), #5d7cff);
  color: #fff;
  font-size: var(--ls-font-body);
  font-weight: var(--ls-weight-subtitle);
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(79,110,247,0.22);
  transition: all var(--ls-duration-base) var(--ls-ease-soft);
}
.skills-panel__run-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(79,110,247,0.28);
}
.skills-panel__run-btn:active:not(:disabled) {
  transform: scale(0.98);
}
.skills-panel__run-btn:disabled {
  opacity: .5; cursor: not-allowed;
}

/* ====== 运行结果区 ====== */
.skills-panel__result {
  padding: var(--ls-space-5);
  border-radius: var(--ls-radius-lg);
  border: 1px solid var(--ls-border-subtle);
  background: var(--ls-bg-surface);
  display: flex; flex-direction: column; gap: var(--ls-space-4);
}
.skills-panel__result--running {
  flex-direction: row; align-items: center; gap: 10px;
  color: var(--ls-accent); font-size: var(--ls-font-body);
}
.skills-panel__result--error {
  flex-direction: row; align-items: flex-start; gap: 10px;
  border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.02);
}
.skills-panel__result-error-title {
  font-size: var(--ls-font-body);
  font-weight: var(--ls-weight-title);
  color: var(--ls-danger); margin: 0;
}
.skills-panel__result-error-desc {
  font-size: var(--ls-font-caption);
  color: var(--ls-text-body); margin: 2px 0 0;
}
.skills-panel__result-header {
  display: flex; align-items: center; gap: 7px;
  font-size: var(--ls-font-body);
  font-weight: var(--ls-weight-title);
  color: var(--ls-text-main);
}
.skills-panel__result-check { color: var(--ls-success); }
.skills-panel__result-time {
  margin-left: auto; font-size: var(--ls-font-micro);
  color: var(--ls-text-hint); font-weight: 400;
}

/* R25: 三链合流注入摘要 */
.skills-panel__result-inject {
  padding: var(--ls-space-3);
  border-radius: var(--ls-radius-sm);
  background: var(--ls-bg-muted);
}
.skills-panel__inject-title {
  font-size: var(--ls-font-micro);
  font-weight: var(--ls-weight-subtitle);
  color: var(--ls-text-hint);
  text-transform: uppercase; letter-spacing: .04em;
  margin-bottom: 8px;
}
.skills-panel__inject-grid {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}
.skills-panel__inject-item {
  display: flex; align-items: center; gap: 6px;
}
.skills-panel__inject-item svg {
  color: var(--ls-accent); flex-shrink: 0;
}
.skills-panel__inject-label {
  font-size: var(--ls-font-micro);
  font-weight: var(--ls-weight-subtitle);
  color: var(--ls-text-hint);
  white-space: nowrap;
}
.skills-panel__inject-val {
  font-size: var(--ls-font-caption);
  color: var(--ls-text-main);
  word-break: break-all;
  min-width: 0;
}

/* Prompt 文本 */
.skills-panel__result-prompt {
  border: 1px solid var(--ls-border-subtle);
  border-radius: var(--ls-radius-sm);
  background: var(--ls-bg-muted);
  max-height: 320px; overflow-y: auto;
}
.skills-panel__result-prompt-text {
  padding: var(--ls-space-4);
  font-size: var(--ls-font-caption);
  color: var(--ls-text-body);
  line-height: var(--ls-leading-caption);
  white-space: pre-wrap; word-break: break-word;
  margin: 0; font-family: var(--ls-font-mono, monospace);
}

/* 操作按钮 */
.skills-panel__result-actions {
  display: flex; gap: 8px;
}
.skills-panel__result-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  border-radius: var(--ls-radius-sm);
  border: 1px solid var(--ls-border-subtle);
  background: var(--ls-bg-surface);
  font-size: var(--ls-font-caption);
  font-weight: var(--ls-weight-subtitle);
  color: var(--ls-text-body);
  cursor: pointer;
  transition: all var(--ls-duration-fast) var(--ls-ease-standard);
}
.skills-panel__result-btn:hover {
  border-color: var(--ls-border-accent);
  color: var(--ls-accent);
}
.skills-panel__result-btn--copied {
  border-color: var(--ls-success);
  color: var(--ls-success);
}
.skills-panel__result-btn--primary {
  background: linear-gradient(135deg, var(--ls-accent), #5d7cff);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(79,110,247,0.18);
}
.skills-panel__result-btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(79,110,247,0.25);
}

/* ====== R26: 自修复任务区 ====== */
.skills-panel__tasks-section {
  display: flex; flex-direction: column; gap: 12px;
}
.skills-panel__tasks-header {
  display: flex; align-items: center; gap: 8px;
  color: var(--ls-accent);
}
.skills-panel__tasks-title {
  font-size: var(--ls-font-body);
  font-weight: var(--ls-weight-title);
  color: var(--ls-text-main);
}
.skills-panel__tasks-hint {
  font-size: var(--ls-font-micro);
  color: var(--ls-text-hint);
  margin-left: auto;
}
</style>
