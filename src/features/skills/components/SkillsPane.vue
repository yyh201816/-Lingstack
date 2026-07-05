<script setup lang="ts">
/**
 * SkillsPane.vue  Skills Capability Panel
 * Phase 6: Codex-style Skills entry integrating with thread main chain
 */
import { computed } from 'vue'
import { useSkillsStore } from '../store/skills.store'
import { useThreadStore } from '@/features/threads/store/thread.store'
import { useComposerStore } from '@/features/chat/store/composer.store'
import {
  Zap, Loader, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight,
  Send, Sparkles, Folder, Workflow, Palette, Code, Link
} from 'lucide-vue-next'

const store = useSkillsStore()
const threadStore = useThreadStore()

const enabledSkills = computed(() => store.skills.filter(s => s.enabled !== false))
const isLoaded = computed(() => store.isLoaded !== false)

const categoryIcon = (cat: string) => {
  switch (cat) {
    case 'project': return Folder
    case 'workflow': return Workflow
    case 'ui': return Palette
    case 'coding': return Code
    case 'integration': return Link
    default: return Zap
  }
}

const categoryLabel = (cat: string) => {
  switch (cat) {
    case 'project': return 'Project'
    case 'workflow': return 'Workflow'
    case 'ui': return 'UI'
    case 'coding': return 'Coding'
    case 'integration': return 'Integration'
    default: return cat
  }
}

function injectSkill(skillId: string) {
  // Injects skill into current thread/composer input
  // Bridge: in a full implementation, this would add the skill
  // as a structured message/context to the active thread
  const thread = threadStore.activeThread
  if (thread) {
    console.log(`[SkillsPane] Inject skill "${skillId}" into thread "${thread.id}"`)
    // Future: dispatch skill injection via thread.addMessage or composer.setContext
  }
}

function toggleSkill(id: string) {
  const skill = store.skills.find(s => s.id === id)
  if (skill) {
    skill.enabled = !skill.enabled
  }
}
</script>

<template>
  <div class="skills-pane">
    <div class="skills-pane__header">
      <div class="skills-pane__header-left">
        <Zap :size="15" />
        <h2 class="skills-pane__title">技能库</h2>
      </div>
      <span v-if="isLoaded" class="skills-pane__count">{{ enabledSkills.length }} 已激活</span>
      <Loader v-else :size="13" class="skills-pane__loading" />
    </div>

    <!-- Summary -->
    <div v-if="isLoaded" class="skills-pane__summary">
      <Sparkles :size="11" />
      <span>技能扩展灵栈的功能's capabilities 提供可复用的工作流和项目专属行为。</span>
    </div>

    <!-- Skill List -->
    <div v-if="isLoaded && store.skills.length > 0" class="skills-pane__list">
      <div
        v-for="skill in store.skills"
        :key="skill.id"
        :class="['skills-pane__card', { 'skills-pane__card--disabled': !skill.enabled }]"
      >
        <div class="skills-pane__card-header">
          <div class="skills-pane__card-icon" :class="`skills-pane__card-icon--${skill.category || 'coding'}`">
            <component :is="categoryIcon(skill.category || 'coding')" :size="14" />
          </div>
          <div class="skills-pane__card-info">
            <h3 class="skills-pane__card-name">{{ skill.name }}</h3>
            <p v-if="skill.description" class="skills-pane__card-desc">{{ skill.description }}</p>
          </div>
          <div class="skills-pane__card-actions">
            <button
              class="skills-pane__inject-btn"
              :disabled="!skill.enabled || !threadStore.activeThreadId"
              :title="threadStore.activeThreadId ? '注入到当前线程' : '暂无活跃线程'"
              @click="injectSkill(skill.id)"
            >
              <Send :size="10" />
            </button>
            <button
              class="skills-pane__toggle-btn"
              @click="toggleSkill(skill.id)"
            >
              <ToggleRight v-if="skill.enabled" :size="18" class="skills-pane__toggle--on" />
              <ToggleLeft v-else :size="18" />
            </button>
          </div>
        </div>
        <div class="skills-pane__card-meta">
          <span class="skills-pane__card-category">
            {{ categoryLabel(skill.category || 'coding') }}
          </span>
          <span class="skills-pane__card-来源">{{ skill.source || '内置' }}</span>
          <span v-if="skill.path" class="skills-pane__card-path">{{ skill.path }}</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="isLoaded && store.skills.length === 0" class="skills-pane__empty">
      <Zap :size="28" stroke-width="1.2" class="skills-pane__empty-icon" />
      <p class="skills-pane__empty-title">暂无额外技能加载</p>
      <p class="skills-pane__empty-desc">
        内置项目技能（如 lingstack-self-heal）已可用。
        从项目添加自定义技能以扩展灵栈。
      </p>
    </div>

    <!-- Error State -->
    <div v-if="!isLoaded" class="skills-pane__error">
      <AlertCircle :size="13" /> 加载技能中...
    </div>
  </div>
</template>

<style scoped>
.skills-pane {
  display: flex; flex-direction: column;
  height: 100%; overflow-y: auto;
  padding: 16px;
  user-select: none;
}
.skills-pane__header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.skills-pane__header-left {
  display: flex; align-items: center; gap: 8px;
  color: var(--ls-accent, #5a93ff);
}
.skills-pane__title {
  font-size: 14px; font-weight: 600;
  color: var(--ls-text-primary, #e9edf6);
  margin: 0;
}
.skills-pane__count {
  font-size: 10px; padding: 2px 8px; border-radius: 999px;
  background: rgba(84,216,140,.12); color: #54d88c;
  font-weight: 500;
}
.skills-pane__loading { color: var(--ls-text-hint, #5d667a); animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.skills-pane__summary {
  display: flex; gap: 8px; align-items: flex-start;
  padding: 8px 12px; border-radius: 8px;
  background: rgba(90,147,255,.04);
  margin-bottom: 14px; font-size: 11px; line-height: 1.5;
  color: var(--ls-text-secondary, #c3c9d4);
}

.skills-pane__list { display: flex; flex-direction: column; gap: 6px; }
.skills-pane__card {
  padding: 12px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,.06);
  background: var(--ls-bg-elevated, #101624);
  transition: border-color .12s;
}
.skills-pane__card:hover { border-color: rgba(255,255,255,.1); }
.skills-pane__card--disabled { opacity: .55; }
.skills-pane__card-header {
  display: flex; align-items: flex-start; gap: 10px;
}
.skills-pane__card-icon {
  width: 28px; height: 28px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.skills-pane__card-icon--project { background: rgba(90,147,255,.12); color: #5a93ff; }
.skills-pane__card-icon--workflow { background: rgba(84,216,140,.12); color: #54d88c; }
.skills-pane__card-icon--ui { background: rgba(255,212,99,.12); color: #ffd463; }
.skills-pane__card-icon--coding { background: rgba(90,147,255,.12); color: #5a93ff; }
.skills-pane__card-icon--integration { background: rgba(161,122,255,.12); color: #a17aff; }
.skills-pane__card-info { flex: 1; min-width: 0; }
.skills-pane__card-name {
  font-size: 13px; font-weight: 600;
  color: var(--ls-text-primary, #e9edf6);
  margin: 0 0 2px;
}
.skills-pane__card-desc {
  font-size: 11px; color: var(--ls-text-hint, #5d667a);
  margin: 0; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.skills-pane__card-actions { display: flex; gap: 4px; flex-shrink: 0; }
.skills-pane__inject-btn,
.skills-pane__toggle-btn {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 6px;
  border: none; background: transparent;
  cursor: pointer; transition: all .12s;
  color: var(--ls-text-hint, #5d667a);
}
.skills-pane__inject-btn:hover:not(:disabled) { background: rgba(90,147,255,.1); color: var(--ls-accent, #5a93ff); }
.skills-pane__inject-btn:disabled { opacity: .3; cursor: not-allowed; }
.skills-pane__toggle-btn:hover { background: rgba(255,255,255,.04); }
.skills-pane__toggle--on { color: var(--ls-accent, #5a93ff); }

.skills-pane__card-meta {
  display: flex; gap: 8px; align-items: center;
  margin-top: 8px; padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,.04);
}
.skills-pane__card-category {
  font-size: 10px; padding: 1px 7px; border-radius: 4px;
  background: rgba(90,147,255,.08); color: #5a93ff;
  font-weight: 500;
}
.skills-pane__card-source {
  font-size: 10px; color: var(--ls-text-hint, #5d667a);
  text-transform: capitalize;
}
.skills-pane__card-path {
  font-size: 10px; font-family: monospace;
  color: var(--ls-text-hint, #5d667a);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.skills-pane__empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 40px 20px; text-align: center;
}
.skills-pane__empty-icon { color: var(--ls-text-hint, #5d667a); margin-bottom: 12px; opacity: .5; }
.skills-pane__empty-title { font-size: 13px; font-weight: 600; color: var(--ls-text-secondary, #c3c9d4); margin: 0 0 6px; }
.skills-pane__empty-desc { font-size: 11px; color: var(--ls-text-hint, #5d667a); margin: 0; max-width: 280px; line-height: 1.5; }
.skills-pane__error {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
  color: #ff6b6b; font-size: 12px;
}
</style>
