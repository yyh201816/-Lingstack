/**
 * training-data.store.ts — 训练数据 Pinia Store
 *
 * 管理本地训练数据的 CRUD 与查询状态。
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TrainingSample, TaskType } from './training-data.types'
import { createSample, updateSample, markAccepted, markRejected, markCopied, markRegenerated, getAllSamples, getHighQualitySamples, getStats, clearAll } from './training-data.service'
import { exportHighQuality, downloadJSONL, type ExportFormat } from './sample-export.service'

export const useTrainingDataStore = defineStore('training-data', () => {
  // ---- State ----
  const samples = ref<TrainingSample[]>([])
  const lastSampleId = ref<string | null>(null)

  // ---- Getters ----
  const highQualitySamples = computed(() => samples.value.filter((s) => s.qualityScore >= 5))
  const acceptedSamples = computed(() => samples.value.filter((s) => s.accepted))
  const rejectedSamples = computed(() => samples.value.filter((s) => s.rejected))
  const stats = computed(() => {
    const all = samples.value
    return {
      total: all.length,
      highQuality: all.filter((s) => s.qualityScore >= 5).length,
      accepted: all.filter((s) => s.accepted).length,
      rejected: all.filter((s) => s.rejected).length,
      avgScore: all.length > 0 ? +(all.reduce((sum, s) => sum + s.qualityScore, 0) / all.length).toFixed(1) : 0,
      byTaskType: all.reduce((acc, s) => { acc[s.taskType] = (acc[s.taskType] ?? 0) + 1; return acc }, {} as Record<string, number>),
    }
  })

  // ---- Actions ----
  function loadFromStorage() {
    samples.value = getAllSamples()
  }

  function addSample(input: {
    taskType: TaskType
    sourceModel: string
    userInput: string
    systemPrompt: string
    contextSnapshot?: any
    modelOutput: string
  }) {
    const sample = createSample(input)
    samples.value = getAllSamples()
    lastSampleId.value = sample.id
    return sample
  }

  function patchSample(id: string, patch: any) {
    const result = updateSample(id, patch)
    if (result) {
      loadFromStorage()
    }
    return result
  }

  function acceptSample(id: string) {
    const result = markAccepted(id)
    if (result) loadFromStorage()
    return result
  }

  function rejectSample(id: string) {
    const result = markRejected(id)
    if (result) loadFromStorage()
    return result
  }

  function copySample(id: string) {
    const result = markCopied(id)
    if (result) loadFromStorage()
    return result
  }

  function regenerateSample(id: string, newOutput: string) {
    const result = markRegenerated(id, newOutput)
    if (result) loadFromStorage()
    return result
  }

  function exportHQ(format: ExportFormat = 'sft') {
    const result = exportHighQuality(format)
    downloadJSONL(result)
    return result
  }

  function reset() {
    clearAll()
    samples.value = []
    lastSampleId.value = null
  }

  return {
    // state
    samples, lastSampleId,
    // getters
    highQualitySamples, acceptedSamples, rejectedSamples, stats,
    // actions
    loadFromStorage, addSample, patchSample,
    acceptSample, rejectSample, copySample, regenerateSample,
    exportHQ, reset,
  }
})
