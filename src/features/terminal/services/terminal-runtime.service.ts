/**
 * terminal-runtime.service.ts — 命令执行服务
 *
 * 当前为 bridge/mock 实现，模拟命令执行与流式输出。
 * Tauri 环境可接真实 shell command。
 */

import { useTerminalStore } from '../store/terminal.store'
import type { TerminalEntry } from '../types'

let mockIdx = 0

/** 回流的 thread callback，由调用方注入 */
type TerminalCallback = (entry: TerminalEntry) => void

let onEntryComplete: TerminalCallback | null = null

export function setTerminalCallback(cb: TerminalCallback) {
  onEntryComplete = cb
}

export function runCommand(
  threadId: string,
  command: string,
  cwd: string,
  source: TerminalEntry['source'] = 'user',
): TerminalEntry {
  const store = useTerminalStore()
  const entry = store.createEntry(threadId, command, cwd, source)

  const idx = ++mockIdx
  const delay = 400 + Math.random() * 800
  const lines = generateMockOutput(command)

  // Simulate streaming output
  let lineIdx = 0
  const interval = setInterval(() => {
    if (lineIdx < lines.length) {
      store.appendOutput(threadId, entry.id, lines[lineIdx] + '\n')
      lineIdx++
    } else {
      clearInterval(interval)
      const exitCode = command.trim().startsWith('bad') ? 1 : 0
      store.finishEntry(threadId, entry.id, exitCode)
      // Notify thread callback
      if (onEntryComplete) {
        onEntryComplete(entry)
      }
    }
  }, Math.max(30, delay / Math.max(lines.length, 1)))

  // Store the interval for kill support
  ;(entry as any).__mockInterval = interval
  return entry
}

export function stopCommand(threadId: string, entryId: string) {
  const store = useTerminalStore()
  const entries = store.getEntries(threadId)
  const entry = entries.find((e) => e.id === entryId)
  if (entry && (entry as any).__mockInterval) {
    clearInterval((entry as any).__mockInterval)
    ;(entry as any).__mockInterval = null
  }
  store.killEntry(threadId, entryId)
  if (onEntryComplete && entry) {
    onEntryComplete(entry)
  }
}

function generateMockOutput(command: string): string[] {
  const cmd = command.trim()
  if (cmd.startsWith('echo')) {
    return [cmd.slice(4).trim()]
  }
  if (cmd.startsWith('dir') || cmd.startsWith('ls')) {
    return [
      ' Volume in drive G is Data',
      ' Directory of G:\\projects',
      '',
      '06/30/2026  11:15 AM    <DIR>          .',
      '06/30/2026  11:15 AM    <DIR>          ..',
      '07/04/2026  09:22 AM    <DIR>          LingStack-nexT',
      '07/01/2026  03:45 PM            12,480 README.md',
      '07/03/2026  10:30 AM    <DIR>          assets',
      '               1 File(s)         12,480 bytes',
      '               4 Dir(s)  125,888,000,000 bytes free',
    ]
  }
  if (cmd.startsWith('pwd') || cmd.startsWith('cd')) {
    return ['G:\\LingStack-nexT']
  }
  if (cmd.startsWith('git')) {
    return [
      'On branch main',
      'Your branch is up to date with \'origin/main\'.',
      '',
      'nothing to commit, working tree clean',
    ]
  }
  if (cmd.startsWith('npm') || cmd.startsWith('node')) {
    return ['v18.17.0', 'npm v9.6.7']
  }
  // Default mock
  return [`[mock] command executed: ${cmd}`, 'exit code: 0']
}
