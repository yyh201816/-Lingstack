import { ref, computed } from "vue"
import { useOrchestrationStore } from "@/features/agent/store/orchestration.store"
import {
  runOrchestrationStep,
  completeOrchestrationStep,
  failOrchestrationStep,
  recordOrchestrationEvent,
} from "@/features/agent/services/orchestration.service"
import { useThreadStore } from "@/features/threads/store/thread.store"
import type { OrchestrationStatus } from "@/features/agent/types/orchestration.types"

export type AgentPhase =
  | "idle"
  | "planning"
  | "executing"
  | "reviewing"
  | "done"
  | "failed"

const phaseLabels: Record<AgentPhase, string> = {
  idle: "等待任务",
  planning: "计划中",
  executing: "执行中",
  reviewing: "待审查",
  done: "已完成",
  failed: "失败",
}

export function useAgentStateMachine(threadId: string) {
  const orchStore = useOrchestrationStore()
  const threadStore = useThreadStore()

  const currentPhase = ref<AgentPhase>("idle")
  const isRunning = computed(() =>
    ["planning", "executing"].includes(currentPhase.value)
  )

  function getOrch() {
    return orchStore.getCurrentOrchestration(threadId)
  }

  /** Start a new task pipeline */
  async function startPipeline(goal: string, scope?: string) {
    orchStore.ensureOrchestration(threadId)
    currentPhase.value = "planning"
    threadStore.updateThreadStatus(threadId, "running")

    // Phase 1: Planning
    const planStepId = runOrchestrationStep(threadId, "plan", "生成执行计划", goal)
    recordOrchestrationEvent(threadId, "任务目标", goal)
    if (scope) {
      recordOrchestrationEvent(threadId, "作用范围", scope)
    }
    await delay(600)
    completeOrchestrationStep(threadId, planStepId, "计划已生成")

    // Phase 2: Context gathering
    currentPhase.value = "executing"
    const ctxStepId = runOrchestrationStep(threadId, "context", "读取项目上下文", "扫描文件结构")
    await delay(800)
    completeOrchestrationStep(threadId, ctxStepId, "已读取项目文件树")

    // Phase 3: Tool execution
    const toolStepId = runOrchestrationStep(threadId, "tool", "分析代码", "检测问题并生成修复方案")
    await delay(1000)
    completeOrchestrationStep(threadId, toolStepId, "已分析并生成 Diff")

    // Phase 4: Review
    currentPhase.value = "reviewing"
    runOrchestrationStep(threadId, "review", "等待审查", "请确认 Diff 后应用")
    threadStore.updateThreadStatus(threadId, "waiting_approval")
    recordOrchestrationEvent(threadId, "待审查", "已生成变更，请在右侧审查后确认")

    return { planStepId, ctxStepId, toolStepId }
  }

  /** User approves - apply changes */
  async function applyChanges() {
    currentPhase.value = "executing"
    const applyId = runOrchestrationStep(threadId, "tool", "应用变更", "写入文件")
    await delay(500)
    completeOrchestrationStep(threadId, applyId, "变更已应用")

    currentPhase.value = "done"
    threadStore.updateThreadStatus(threadId, "done")
    recordOrchestrationEvent(threadId, "完成", "任务已完成")
    orchStore.setStatus(threadId, "done")
  }

  /** User rejects */
  function rejectChanges() {
    currentPhase.value = "failed"
    threadStore.updateThreadStatus(threadId, "failed")
    recordOrchestrationEvent(threadId, "已拒绝", "用户拒绝了变更")
    orchStore.setStatus(threadId, "failed")
  }

  function getPhaseLabel(): string {
    return phaseLabels[currentPhase.value] || currentPhase.value
  }

  return {
    currentPhase,
    isRunning,
    startPipeline,
    applyChanges,
    rejectChanges,
    getPhaseLabel,
    getOrch,
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
