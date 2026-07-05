/** LingStack vNext — 公共类型定义 */

export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  isFile: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface FileTab {
  path: string
  name: string
  dirty: boolean
}
