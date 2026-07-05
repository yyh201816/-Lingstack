import { useBootstrapStore } from '../store/bootstrap.store'

export function calcReadiness(): 'ready' | 'partial' | 'blocked' {
  const store = useBootstrapStore()
  if (store.p0Items.length > 0) return 'blocked'
  if (store.inProgress.length > 0 || store.todoCount > 0) return 'partial'
  return 'ready'
}

export function readinessSummary(): string {
  const store = useBootstrapStore()
  const p0 = store.p0Items.length
  const active = store.inProgress.length
  const pending = store.todoCount
  if (p0 > 0) return `${p0} P0 tasks block release`
  if (active > 0) return `${active} tasks in progress`
  if (pending > 0) return `${pending} tasks pending`
  return 'All tasks complete'
}
