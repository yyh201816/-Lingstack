/**
 * R26 — Skill 结果结构化解析器
 *
 * 从 skill 原始输出中提取结构化信息和任务项。
 * 解析策略：基于 Markdown 标题层级 + 关键词匹配。
 * 降级策略：解析失败时保留 rawOutput，返回空 parsed。
 */

import type { SelfHealParsed, SelfHealTaskItem, TaskType, TaskPriority } from '../types/self-heal.types'

/**
 * 从 skill 原始输出中解析结构化信息
 */
export function parseSkillOutput(raw: string, executionId: string): {
  parsed: SelfHealParsed
  tasks: Omit<SelfHealTaskItem, 'executionId' | 'createdAt' | 'updatedAt'>[]
} {
  const parsed = extractSections(raw)
  const tasks = extractTasks(raw, executionId)
  return { parsed, tasks }
}

/**
 * 提取 Markdown 各节内容
 */
function extractSections(raw: string): SelfHealParsed {
  const lines = raw.split('\n')
  const result: SelfHealParsed = {}

  let currentSection: string | null = null
  let currentContent: string[] = []

  const flushSection = () => {
    const content = currentContent.join('\n').trim()
    if (!currentSection || !content) return

    const key = normalizeSectionKey(currentSection)
    if (key) {
      switch (key) {
        case 'currentPhase':
          result.currentPhase = content
          break
        case 'chosenTarget':
          result.chosenTarget = content
          break
        case 'scopeBoundary':
          result.scopeBoundary = extractListItems(content)
          break
        case 'concreteChanges':
          result.concreteChanges = extractListItems(content)
          break
        case 'validation':
          result.validation = extractListItems(content)
          break
        case 'nextStep':
          result.nextStep = content
          break
      }
    }
    currentContent = []
  }

  for (const line of lines) {
    const h2 = line.match(/^##\s+\d+\.\s*(.+)/)
    const h2Plain = line.match(/^##\s+(.+)/)
    const heading = h2?.[1] || h2Plain?.[1]

    if (heading) {
      flushSection()
      currentSection = heading.trim()
      continue
    }

    if (currentSection) {
      currentContent.push(line)
    }
  }
  flushSection()

  return result
}

/**
 * 将 Markdown 标题映射到 SelfHealParsed 字段
 */
function normalizeSectionKey(heading: string): keyof SelfHealParsed | null {
  const h = heading.toLowerCase()
  if (h.includes('当前阶段') || h.includes('current phase')) return 'currentPhase'
  if (h.includes('修复目标') || h.includes('chosen') || h.includes('选择') || h.includes('目标')) return 'chosenTarget'
  if (h.includes('范围') || h.includes('scope') || h.includes('不做') || h.includes('边界')) return 'scopeBoundary'
  if (h.includes('修改') || h.includes('change') || h.includes('具体') || h.includes('concrete')) return 'concreteChanges'
  if (h.includes('验证') || h.includes('valid')) return 'validation'
  if (h.includes('下一步') || h.includes('next') || h.includes('建议')) return 'nextStep'
  return null
}

/**
 * 提取 Markdown 列表项（- 或 * 开头）
 */
function extractListItems(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.replace(/^\s*[-*]\s+/, '').trim())
    .filter(l => l.length > 0)
}

/**
 * 从原始输出中提取任务项
 */
function extractTasks(raw: string, executionId: string): Omit<SelfHealTaskItem, 'executionId' | 'createdAt' | 'updatedAt'>[] {
  const tasks: Omit<SelfHealTaskItem, 'executionId' | 'createdAt' | 'updatedAt'>[] = []
  const changes = extractConcreteChanges(raw)
  const validations = extractValidationSteps(raw)

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i]!
    const taskType = inferTaskType(change)
    const priority = inferPriority(change, i)
    const targetFiles = extractFilePaths(change)

    const taskValidations = validations.length > 0
      ? [validations[i % validations.length]!]
      : []

    tasks.push({
      id: `task_${executionId}_${i}`,
      title: truncate(change, 80),
      description: change,
      type: taskType,
      priority,
      status: 'todo',
      targetFiles,
      validationSteps: taskValidations,
    })
  }

  // 如果没有提取到修改项，创建一个总结性任务
  if (tasks.length === 0 && raw.length > 50) {
    const firstLine = raw.split('\n').find(l => l.trim().length > 10) || '执行 skill 并审查结果'
    tasks.push({
      id: `task_${executionId}_fallback`,
      title: truncate(firstLine, 80),
      description: firstLine,
      type: 'validate',
      priority: 'P2',
      status: 'todo',
      validationSteps: validations.slice(0, 3),
    })
  }

  return tasks
}

/**
 * 提取具体修改项
 */
function extractConcreteChanges(raw: string): string[] {
  const sections = raw.split(/\n##\s+/)
  for (const section of sections) {
    const heading = section.split('\n')[0] || ''
    if (
      heading.includes('修改') ||
      heading.includes('change') ||
      heading.includes('具体') ||
      heading.includes('新建') ||
      heading.includes('新增')
    ) {
      return extractListItems(section)
    }
  }
  const allItems = extractListItems(raw)
  return allItems.filter(item => item.includes('.') || item.includes('/') || item.includes('\\'))
}

/**
 * 提取验证步骤
 */
function extractValidationSteps(raw: string): string[] {
  const sections = raw.split(/\n##\s+/)
  for (const section of sections) {
    const heading = section.split('\n')[0] || ''
    if (heading.includes('验证') || heading.includes('valid')) {
      const items = extractListItems(section)
      return items.filter(item =>
        item.includes('npm') ||
        item.includes('build') ||
        item.includes('检查') ||
        item.includes('验证') ||
        item.includes('测试') ||
        item.includes('run') ||
        item.includes('cargo') ||
        item.match(/^\d+\./)
      )
    }
  }
  return []
}

/**
 * 推断任务类型
 */
function inferTaskType(text: string): TaskType {
  const t = text.toLowerCase()
  if (t.includes('删除') || t.includes('delete') || t.includes('移除') || t.includes('remove')) return 'cleanup'
  if (t.includes('隐藏') || t.includes('hide')) return 'hide'
  if (t.includes('连接') || t.includes('接入') || t.includes('connect') || t.includes('集成')) return 'connect'
  if (t.includes('验证') || t.includes('valid') || t.includes('测试') || t.includes('test')) return 'validate'
  return 'fix'
}

/**
 * 推断优先级
 */
function inferPriority(text: string, index: number): TaskPriority {
  const t = text.toLowerCase()
  if (t.includes('p0') || t.includes('关键') || t.includes('critical') || t.includes('阻塞')) return 'P0'
  if (t.includes('p1') || t.includes('重要') || t.includes('important')) return 'P1'
  return index < 3 ? 'P1' : 'P2'
}

/**
 * 提取文件路径
 */
function extractFilePaths(text: string): string[] {
  const paths = text.match(/[\w./\\-]+\.(ts|vue|js|json|md|css|html|toml|ps1|py)/g)
  return [...new Set(paths || [])]
}

/**
 * 截断文本
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen - 3) + '...'
}
