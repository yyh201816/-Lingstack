import { useAutomationStore } from '../store/automation.store'
import type { AutomationItem } from '../types/automation.types'

/**
 * 导出所有自动化配置为 JSON 字符串
 */
export function exportAutomations(): string {
  const store = useAutomationStore()
  return JSON.stringify(store.automations, null, 2)
}

/**
 * 从 JSON 字符串导入自动化配置，与现有数据合并（按 id 去重）
 */
export function importAutomations(json: string): number {
  const store = useAutomationStore()
  let parsed: unknown

  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('无效的 JSON 格式')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('导入数据必须是数组')
  }

  const existingIds = new Set(store.automations.map((a) => a.id))
  let imported = 0

  for (const item of parsed as AutomationItem[]) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string') continue
    if (!existingIds.has(item.id)) {
      store.automations.push(item)
      existingIds.add(item.id)
      imported++
    }
  }

  return imported
}

/**
 * 清除所有运行历史
 */
export function clearAllRuns(): void {
  const store = useAutomationStore()
  store.runHistory.splice(0, store.runHistory.length)
}
