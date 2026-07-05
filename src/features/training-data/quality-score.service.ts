/**
 * quality-score.service.ts — 质量评分引擎
 *
 * 第一版：规则评分，不依赖 AI 判断。
 * 后续可升级为模型评分。
 */

import type { TrainingSample } from './training-data.types'

/** 评分规则：每个事件对应一个分值 */
const SCORE_RULES: { field: keyof TrainingSample; condition: (v: any) => boolean; score: number; label: string }[] = [
  { field: 'accepted', condition: (v) => v === true, score: +3, label: '用户采纳' },
  { field: 'success', condition: (v) => v === true, score: +1, label: '任务成功' },
  { field: 'regenerated', condition: (v) => v === true, score: -1, label: '重新生成（首次不满意）' },
  { field: 'editedByUser', condition: (v) => typeof v === 'string' && v.length > 50, score: -2, label: '用户手动大幅修改' },
  { field: 'rejected', condition: (v) => v === true, score: -5, label: '用户否决' },
  // R30: copied 字段已废弃（Chat 不可复制），不再作为评分信号
]

const CODE_SCORE_RULES: { field: string; condition: (v: any) => boolean; score: number; label: string }[] = [
  { field: 'applied', condition: (v) => v === true, score: +3, label: '代码已应用' },
  { field: 'buildPassed', condition: (v) => v === true, score: +5, label: '构建通过' },
  { field: 'rollback', condition: (v) => v === true, score: -3, label: '用户回滚' },
]

/**
 * 计算单条样本的质量分
 * 基础分 0，通过规则加减
 */
export function computeQualityScore(sample: TrainingSample): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // 通用规则
  for (const rule of SCORE_RULES) {
    const val = sample[rule.field as keyof TrainingSample]
    if (rule.condition(val)) {
      score += rule.score
      reasons.push(`${rule.label} (${rule.score >= 0 ? '+' : ''}${rule.score})`)
    }
  }

  // 代码任务规则
  if (sample.codeTask) {
    for (const rule of CODE_SCORE_RULES) {
      const val = sample.codeTask[rule.field as keyof typeof sample.codeTask]
      if (rule.condition(val)) {
        score += rule.score
        reasons.push(`${rule.label} (${rule.score >= 0 ? '+' : ''}${rule.score})`)
      }
    }
  }

  return { score, reasons }
}

/**
 * 批量计算质量分
 */
export function batchScore(samples: TrainingSample[]): TrainingSample[] {
  return samples.map((s) => {
    const { score, reasons: _ } = computeQualityScore(s)
    return { ...s, qualityScore: score }
  })
}

/**
 * 判断是否为高质量样本
 */
export function isHighQuality(sample: TrainingSample): boolean {
  return sample.qualityScore >= 5
}
