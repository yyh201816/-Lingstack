/**
 * skills.store.ts — Skill 状态管理
 *
 * R25: 升级为支持三链合流的 SkillExecutionPayload
 *
 * 职责：
 *   1. 持有已加载的 skill 列表
 *   2. 追踪当前选中 skill
 *   3. 管理运行状态与结果（统一 SkillExecutionPayload）
 *   4. 管理 UI 状态（loading / error / phase）
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SkillMeta } from '@/services/skills/skill-loader.service'
import { loadAllSkills } from '@/services/skills/skill-loader.service'
import { runSkill, RunPhase } from '@/services/skills/skill-runner.service'
import type { SkillExecutionPayload, PayloadInjectionSummary } from '@/services/skills/skill-execution.types'
import { buildInjectionSummary } from '@/services/skills/skill-runner.service'
import { useSelfHealStore } from '@/features/self-heal/store/self-heal.store'

export const useSkillsStore = defineStore('skills', () => {
  // ========== State ==========
  const skills = ref<SkillMeta[]>([])
  const loading = ref(false)
  const loadError = ref<string | null>(null)
  const selectedId = ref<string | null>(null)
  const runPhase = ref<RunPhase>(RunPhase.Idle)
  const lastResult = ref<SkillExecutionPayload | null>(null)
  const lastRunError = ref<string | null>(null)
  /** R25: 注入摘要 */
  const lastInjectionSummary = ref<PayloadInjectionSummary | null>(null)
  /** R26: 是否已生成自修复任务 */
  const hasSelfHealTasks = ref(false)

  // ========== Getters ==========
  const selectedSkill = computed(() => skills.value.find(s => s.id === selectedId.value) ?? null)
  const hasLoadedAny = computed(() => skills.value.length > 0)
  const isRunning = computed(() =>
    runPhase.value === RunPhase.Collecting ||
    runPhase.value === RunPhase.KnowledgeSync ||
    runPhase.value === RunPhase.Assembling,
  )
  const hasResult = computed(() => runPhase.value === RunPhase.Done && lastResult.value !== null)

  /** R25: 运行阶段的中文描述 */
  const phaseLabel = computed(() => {
    switch (runPhase.value) {
      case RunPhase.Collecting: return '收集工作区上下文...'
      case RunPhase.KnowledgeSync: return '同步远程知识增强...'
      case RunPhase.Assembling: return '组装执行 Payload...'
      default: return '运行技能'
    }
  })

  // ========== Actions ==========

  /** 加载所有 skill */
  async function fetchSkills() {
    loading.value = true
    loadError.value = null
    try {
      skills.value = await loadAllSkills()
      if (skills.value.length > 0 && !selectedId.value) {
        selectedId.value = skills.value[0]!.id
      }
    } catch (e: any) {
      loadError.value = e.message ?? '加载技能列表失败'
    } finally {
      loading.value = false
    }
  }

  /** 选择 skill */
  function selectSkill(id: string) {
    selectedId.value = id
    // 清除上一次运行结果
    runPhase.value = RunPhase.Idle
    lastResult.value = null
    lastRunError.value = null
    lastInjectionSummary.value = null
    hasSelfHealTasks.value = false
  }

  /** 运行当前选中 skill — R25 三链合流 */
  async function executeSelected() {
    const skill = selectedSkill.value
    if (!skill || !skill.loaded) return

    runPhase.value = RunPhase.Collecting
    lastResult.value = null
    lastRunError.value = null
    lastInjectionSummary.value = null

    // 给 UI 一点时间显示 collecting 状态
    await new Promise(r => setTimeout(r, 80))

    const result = await runSkill(skill, (phase) => {
      runPhase.value = phase
    })

    runPhase.value = result.phase
    if (result.phase === RunPhase.Done && result.payload) {
      lastResult.value = result.payload
      lastInjectionSummary.value = buildInjectionSummary(result.payload)

      // R26: 将 skill 结果传入自修复任务系统
      hasSelfHealTasks.value = false
      try {
        const shStore = useSelfHealStore()
        shStore.processSkillResult(skill.id, result.payload.promptText)
        hasSelfHealTasks.value = true
      } catch {
        // 解析失败不阻断流程
      }
    } else {
      lastRunError.value = result.error
    }
  }

  /** 重置运行状态 */
  function resetRun() {
    runPhase.value = RunPhase.Idle
    lastResult.value = null
    lastRunError.value = null
    lastInjectionSummary.value = null
  }

  return {
    // state
    skills, loading, loadError, selectedId, runPhase, lastResult, lastRunError, lastInjectionSummary, hasSelfHealTasks,
    // getters
    selectedSkill, hasLoadedAny, isLoaded: hasLoadedAny, isRunning, hasResult, phaseLabel,
    // actions
    fetchSkills, selectSkill, executeSelected, resetRun,
  }
})
