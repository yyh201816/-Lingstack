export interface CommandItem { id: string; label: string; description?: string; category: 'view'|'command'|'skill'|'file'; action: () => void; shortcut?: string; }
