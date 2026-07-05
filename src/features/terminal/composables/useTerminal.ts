/**
 * useTerminal — xterm.js 终端管理
 *
 * 职责：创建/销毁 xterm 实例、尺寸适配、输入事件、
 *       与 store 联动（isOpen、active terminal）
 *
 * 当前浏览器模式仅做容器展示，Tauri 环境可接 shell plugin。
 */
import { ref } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'
import type { ITerminalOptions } from '@xterm/xterm'

/** 终端主题配置 */
export const TerminalTheme = {
  light: {
    background: '#f5f7fb',
    foreground: '#111827',
    cursor: '#4f6ef7',
    selectionBackground: 'rgba(79,110,247,0.15)',
    black: '#f1f5f9', red: '#ef4444', green: '#10b981', yellow: '#f59e0b',
    blue: '#4f6ef7', magenta: '#a855f7', cyan: '#0ea5e9', white: '#334155',
    brightBlack: '#94a3b8', brightRed: '#f87171', brightGreen: '#34d399',
    brightYellow: '#fbbf24', brightBlue: '#6b8cf8', brightMagenta: '#c084fc',
    brightCyan: '#38bdf8', brightWhite: '#e8edf4',
  },
  dark: {
    background: '#0f1117',
    foreground: '#e8edf4',
    cursor: '#5b7cf7',
    selectionBackground: 'rgba(91,124,247,0.18)',
    black: '#1a1c24', red: '#f87171', green: '#34d399', yellow: '#fbbf24',
    blue: '#5b7cf7', magenta: '#a78bfa', cyan: '#38bdf8', white: '#a1a9bb',
    brightBlack: '#4b5563', brightRed: '#fca5a5', brightGreen: '#6ee7b7',
    brightYellow: '#fde68a', brightBlue: '#93aefb', brightMagenta: '#c4b5fd',
    brightCyan: '#67e8f9', brightWhite: '#e8edf4',
  },
} as const

export type TerminalThemeKey = keyof typeof TerminalTheme

export function useTerminal() {
  const term = ref<Terminal | null>(null)
  const fitAddon = new FitAddon()
  let currentTheme: TerminalThemeKey = 'light'

  /** 在目标容器中创建终端 */
  function createTerminal(container: HTMLElement, theme?: TerminalThemeKey): Terminal {
    if (theme) currentTheme = theme
    dispose()

    const t = new Terminal({
      fontSize: 13,
      fontFamily: "var(--ls-font-mono, 'JetBrains Mono', 'Cascadia Code', Consolas, monospace)",
      cursorBlink: true,
      cursorStyle: 'bar',
      allowProposedApi: true,
      scrollback: 5000,
      theme: TerminalTheme[currentTheme],
    })

    t.loadAddon(fitAddon)
    try { t.loadAddon(new WebglAddon()) } catch { /* fallback */ }

    t.open(container)
    fitAddon.fit()

    t.writeln('  LingStack-nexT Terminal')
    t.writeln('  ──────────────────────')
    t.writeln('')

    term.value = t
    return t
  }

  /** 切换终端主题 */
  function setTheme(theme: TerminalThemeKey) {
    currentTheme = theme
    if (term.value) {
      term.value.options.theme = TerminalTheme[theme]
    }
  }

  /** 写入终端 */
  function write(text: string) {
    term.value?.write(text)
  }

  /** 写入行 */
  function writeln(text: string) {
    term.value?.writeln(text)
  }

  /** 调整尺寸 */
  function fit() {
    try { fitAddon.fit() } catch { /* ignore */ }
  }

  /** 销毁 */
  function dispose() {
    term.value?.dispose()
    term.value = null
  }

  return { term, createTerminal, setTheme, write, writeln, fit, dispose }
}
