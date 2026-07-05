<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '@/features/projects/store/project.store'
import { useThreadStore } from '@/features/threads/store/thread.store'
import { useGoalStore } from '@/features/goals/store/goal.store'
import { useAutomationStore } from '@/features/automations/store/automation.store'
import { useMcpStore } from '@/features/mcp/store/mcp.store'
import { useBrowserStore } from '@/features/browser/store/browser.store'
import { useComputerUseStore } from '@/features/computer-use/store/computer-use.store'
import { useSkillsStore } from '@/features/skills/store/skills.store'
import { useBetaInstanceStore } from '@/features/beta/store/beta-instance.store'
import { useModelConfigsStore } from '@/features/settings/store/model-configs.store'

const projectStore = useProjectStore()
const threadStore = useThreadStore()
const goalStore = useGoalStore()
const automationStore = useAutomationStore()
const mcpStore = useMcpStore()
const browserStore = useBrowserStore()
const cuStore = useComputerUseStore()
const skillsStore = useSkillsStore()
const instanceStore = useBetaInstanceStore()
const modelConfigsStore = useModelConfigsStore()

const projectPath = computed(() => projectStore.currentProjectPath)
const threadTitle = computed(() => threadStore.activeThread?.title ?? null)
const taskType = computed(() => threadStore.activeThread?.taskType ?? null)
const taskTypeLabel = computed(() => {
  switch (taskType.value) {
    case 'self_repair': return '自修复'
    case 'code_review': return '代码审查'
    default: return null
  }
})
const modelName = computed(() => modelConfigsStore.activeConfig?.displayName || '—')

const agentStatus = computed(() => {
  const tid = threadStore.activeThreadId
  if (!tid) return '就绪'
  const t = threadStore.activeThread
  if (t?.status === 'running') return '运行中'
  if (t?.status === 'failed') return '失败'
  if (t?.status === 'done') return '完成'
  if (t?.status === 'waiting_input') return '等待中'
  if (t?.status === 'paused') return '暂停'
  return 'Ready'
})

const activeGoalSummary = computed(() => {
  const tid = threadStore.activeThreadId
  if (!tid) return null
  const goal = goalStore.activeGoal(tid)
  if (!goal) return null
  return `${goal.title} (${goal.progressPercent}%)`
})

const automationRunningCount = computed(() => automationStore.runningCount)

const mcpSummary = computed(() => {
  if (mcpStore.connectedCount > 0) return `${mcpStore.connectedCount}/${mcpStore.serviceCount} MCP`
  if (mcpStore.hasErrors) return 'MCP异常'
  return null
})
const browserSummary = computed(() => browserStore.isOpen ? '浏览器开启' : null)
const cuSummary = computed(() => cuStore.isAvailable ? '桌面可用' : null)
const skillsCount = computed(() => {
  const n = skillsStore.skills.filter(s => s.enabled !== false).length
  return n > 0 ? `${n} skills` : null
})

const instanceHealthSummary = computed(() => {
  if (instanceStore.totalInstances === 0) return null
  return `${instanceStore.onlineCount} 在线 / ${instanceStore.totalInstances} inst`
})
const avgHealth = computed(() => instanceStore.totalInstances > 0 ? instanceStore.avgHealthScore : 0)
</script>

<template>
  <div class="top-statusbar">
    <div class="top-statusbar__left">
      <div class="top-statusbar__item" title="Project">
        <span class="top-statusbar__label">项目</span>
        <span class="top-statusbar__value top-statusbar__value--path">
          {{ projectPath || '无项目' }}
        </span>
      </div>
      <div class="top-statusbar__sep"></div>
      <div class="top-statusbar__item" title="Thread">
        <span class="top-statusbar__label">线程</span>
        <span class="top-statusbar__value">{{ threadTitle || '无线程' }}</span>
        <span v-if="taskTypeLabel" class="top-statusbar__task-badge">{{ taskTypeLabel }}</span>
      </div>
    </div>
    <div class="top-statusbar__right">
      <div class="top-statusbar__item">
        <span class="top-statusbar__label">模型</span>
        <span class="top-statusbar__value top-statusbar__value--accent">
          {{ modelName }}
        </span>
      </div>
      <div class="top-statusbar__sep"></div>
      <div class="top-statusbar__item">
        <span class="top-statusbar__label">智能体</span>
        <span class="top-statusbar__value top-statusbar__value--status">
          <span class="top-statusbar__dot" :class="agentStatus === '运行中' ? 'top-statusbar__dot--active' : ''"></span>
          {{ agentStatus }}
        </span>
      </div>
      <template v-if="activeGoalSummary || automationRunningCount > 0">
        <div class="top-statusbar__sep"></div>
        <div v-if="activeGoalSummary" class="top-statusbar__item">
          <span class="top-statusbar__label">目标</span>
          <span class="top-statusbar__value top-statusbar__value--accent">{{ activeGoalSummary }}</span>
        </div>
        <div v-if="automationRunningCount > 0" class="top-statusbar__item">
          <span class="top-statusbar__label">自动</span>
          <span class="top-statusbar__value top-statusbar__value--accent">{{ automationRunningCount }} running</span>
        </div>
      </template>
      <div class="top-statusbar__sep"></div>
      <div v-if="mcpSummary" class="top-statusbar__item" title="MCP Integrations">
        <span class="top-statusbar__value top-statusbar__value--cap">{{ mcpSummary }}</span>
      </div>
      <div v-if="browserSummary" class="top-statusbar__item" title="Browser">
        <span class="top-statusbar__value top-statusbar__value--cap top-statusbar__value--cap-active">{{ browserSummary }}</span>
      </div>
      <div v-if="cuSummary" class="top-statusbar__item" title="Computer Use">
        <span class="top-statusbar__value top-statusbar__value--cap">{{ cuSummary }}</span>
      </div>
      <div v-if="skillsCount" class="top-statusbar__item" title="Skills">
        <span class="top-statusbar__value top-statusbar__value--cap">{{ skillsCount }}</span>
      </div>
      <div v-if="instanceHealthSummary" class="top-statusbar__item" title="Beta Instances">
        <span class="top-statusbar__value top-statusbar__value--cap"
          :class="avgHealth >= 80 ? 'top-statusbar__value--cap-active' : avgHealth < 60 ? 'top-statusbar__value--cap-err' : ''">
          {{ instanceHealthSummary }} · {{ avgHealth }}%
        </span>
      </div>
      <div class="top-statusbar__sep"></div>
      <div class="top-statusbar__item">
        <span class="top-statusbar__label">运行时</span>
        <span class="top-statusbar__value">Online</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 14px;
  background: var(--ls-bg-elevated, #101624);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  user-select: none;
}
.top-statusbar__left, .top-statusbar__right {
  display: flex;
  align-items: center;
  gap: 0;
}
.top-statusbar__item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
}
.top-statusbar__label {
  font-size: 10px;
  color: var(--ls-text-hint, #5d667a);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
}
.top-statusbar__value {
  font-size: 11px;
  color: var(--ls-text-secondary, #c3c9d4);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.top-statusbar__value--path {
  max-width: 280px;
  color: var(--ls-text-hint, #5d667a);
  font-family: monospace;
  font-size: 10px;
}
.top-statusbar__value--accent {
  color: var(--ls-accent, #5a93ff);
  font-weight: 500;
}
.top-statusbar__value--status {
  display: flex;
  align-items: center;
  gap: 5px;
}
.top-statusbar__dot {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: rgba(84, 216, 140, 0.7);
}
.top-statusbar__dot--active {
  background: var(--ls-accent, #5a93ff);
  animation: pulse-dot 1.5s ease infinite;
}
.top-statusbar__value--cap {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(142, 150, 166, .1);
  color: #8e96a6;
  font-weight: 500;
  font-family: monospace;
}
.top-statusbar__value--cap-active {
  background: rgba(84, 216, 140, .1);
  color: #54d88c;
}
.top-statusbar__value--cap-err {
  background: rgba(255, 107, 107, .1);
  color: #ff6b6b;
}
.top-statusbar__task-badge {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(255, 159, 67, 0.12);
  color: #ff9f43;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-left: 6px;
}
.top-statusbar__sep {
  width: 1px;
  height: 14px;
  background: rgba(255, 255, 255, 0.08);
}
@keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
