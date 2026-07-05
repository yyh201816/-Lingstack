import { useBetaIterationStore } from '../store/beta-iteration.store'
import { useBootstrapStore } from '@/features/bootstrap/store/bootstrap.store'

export function quickReleaseCheck(): {
  canRelease: boolean
  quickSummary: string
} {
  const bi = useBetaIterationStore()
  const bootstrap = useBootstrapStore()

  const issues: string[] = []
  if (bi.gateFailCount > 0) issues.push(`${bi.gateFailCount} gates fail`)
  if (bootstrap.p0Items.length > 0) issues.push(`${bootstrap.p0Items.length} P0 tasks`)

  const pendingGate = bi.gateItems.length - bi.gatePassCount
  const pendingRegr = bi.regressionItems.length - bi.regrPassCount

  let quickSummary = ''
  if (issues.length > 0) {
    quickSummary = `Blocked: ${issues.join(', ')}`
  } else if (pendingGate + pendingRegr > 0) {
    quickSummary = `${pendingGate + pendingRegr} checks remain`
  } else {
    quickSummary = 'Ready to release'
  }

  return { canRelease: issues.length === 0, quickSummary }
}
