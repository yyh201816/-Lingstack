export interface ShortcutBinding {
  id: string
  category: 'global' | 'thread' | 'composer' | 'review' | 'terminal' | 'git' | 'navigation'
  label: string
  keys: string
  code: string
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  metaKey: boolean
}
