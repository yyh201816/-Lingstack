import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ShortcutBinding } from '../types/shortcut.types'

const defaults: ShortcutBinding[] = [
  { id: 'newThread', category: 'global', label: 'New Thread', keys: 'Ctrl+N', code: 'KeyN', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false },
  { id: 'searchThreads', category: 'global', label: 'Search Threads', keys: 'Ctrl+G', code: 'KeyG', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false },
  { id: 'toggleSidebar', category: 'global', label: 'Toggle Sidebar', keys: 'Ctrl+B', code: 'KeyB', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false },
  { id: 'openSettings', category: 'global', label: 'Open Settings', keys: 'Ctrl+,', code: 'Comma', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false },
  { id: 'openTerminal', category: 'global', label: 'Open Terminal Tab', keys: 'Ctrl+J', code: 'KeyJ', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false },
  { id: 'stopCurrent', category: 'thread', label: 'Stop Current Run', keys: 'Escape', code: 'Escape', ctrlKey: false, shiftKey: false, altKey: false, metaKey: false },
] as ShortcutBinding[]

function loadBindings(): ShortcutBinding[] {
  try {
    const raw = localStorage.getItem('lingstack_shortcuts')
    if (raw) {
      const saved = JSON.parse(raw) as ShortcutBinding[]
      const map = new Map(defaults.map(d => [d.id, d]))
      for (const s of saved) map.set(s.id, s)
      return Array.from(map.values())
    }
  } catch { /* ignore */ }
  return [...defaults]
}

export const useShortcutStore = defineStore('shortcuts', () => {
  const bindings = ref<ShortcutBinding[]>(loadBindings())
  const conflicts = ref<string[]>([])

  function persist() {
    localStorage.setItem('lingstack_shortcuts', JSON.stringify(bindings.value))
  }

  function getBinding(actionId: string): ShortcutBinding | undefined {
    return bindings.value.find(b => b.id === actionId)
  }

  function getBindingsByCategory(cat: string): ShortcutBinding[] {
    return bindings.value.filter(b => b.category === cat)
  }

  function searchBindings(query: string): ShortcutBinding[] {
    const q = query.toLowerCase()
    return bindings.value.filter(b =>
      b.label.toLowerCase().includes(q) || b.keys.toLowerCase().includes(q) || b.id.includes(q)
    )
  }

  function updateBinding(id: string, partial: Partial<ShortcutBinding>) {
    const b = bindings.value.find(b => b.id === id)
    if (b) { Object.assign(b, partial); persist(); checkConflicts() }
  }

  function resetDefaults() {
    bindings.value = [...defaults]
    conflicts.value = []
    persist()
  }

  function checkConflicts() {
    const seen = new Map<string, string>()
    const cids: string[] = []
    for (const b of bindings.value) {
      if (seen.has(b.keys)) { cids.push(b.id, seen.get(b.keys)!) }
      else seen.set(b.keys, b.id)
    }
    conflicts.value = [...new Set(cids)]
  }

  return { bindings, conflicts, getBinding, getBindingsByCategory, searchBindings, updateBinding, resetDefaults, persist, checkConflicts }
})
