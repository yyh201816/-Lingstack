export function basename(path: string): string { return path.split(/[/\\]/).pop() ?? path }
export function extname(path: string): string { const base = basename(path); const idx = base.lastIndexOf('.'); return idx > 0 ? base.slice(idx) : '' }
export function dirname(path: string): string { const idx = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')); return idx > 0 ? path.slice(0, idx) : '' }
export function joinPath(...parts: string[]): string { return parts.join('/').replace(/\/+/g, '/') }
