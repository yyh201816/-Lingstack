import { useAutomationStore } from '../store/automation.store'
import { useThreadStore } from '@/features/threads/store/thread.store'
import { useThreadSessionStore } from '@/features/threads/store/thread-session.store'

/**
 * 执行自动化任务的服务。
 * 当前为本地模拟实现，后续可替换为真实后台执行。
 */
export async function runAutomation(automationId: string): Promise<string> {
  const automationStore = useAutomationStore()
  const threadStore = useThreadStore()
  const sessionStore = useThreadSessionStore()

  const automation = automationStore.automations.find((a) => a.id === automationId)
  if (!automation) {
    throw new Error(`Automation ${automationId} not found`)
  }

  // 创建执行线程
  const thread = threadStore.createThread(
    `[Auto] ${automation.name}`,
    automation.projectId || 'default',
    automation.threadMode,
  )

  // 入队并启动
  const run = automationStore.enqueueRun(automationId)
  automationStore.startRun(run.id, thread.id)

  // 记录开始消息
  sessionStore.appendMessage(
    thread.id,
    'system',
    `[Automation] 开始执行: ${automation.name}\n\nPrompt: ${automation.prompt}`,
    'system',
    { automationId, runId: run.id },
  )

  // 模拟执行（2-3 秒）
  const delay = 2000 + Math.random() * 1000

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        // 模拟 90% 成功率
        const success = Math.random() > 0.1

        if (!success) {
          throw new Error('模拟执行失败: 任务超时或模型不可用')
        }

        const summary = `自动化任务 "${automation.name}" 已完成。执行了 ${Math.floor(Math.random() * 5) + 1} 个步骤。`

        // 记录完成消息
        sessionStore.appendMessage(
          thread.id,
          'system',
          `[Automation] 执行完成: ${summary}`,
          'system',
          { automationId, runId: run.id, result: 'success' },
        )

        automationStore.finishRun(run.id, summary)
        resolve(run.id)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)

        // 记录失败消息
        sessionStore.appendMessage(
          thread.id,
          'system',
          `[Automation] 执行失败: ${errorMsg}`,
          'system',
          { automationId, runId: run.id, result: 'failed' },
        )

        automationStore.failRun(run.id, errorMsg)
        reject(err)
      }
    }, delay)
  })
}
