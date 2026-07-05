import { useBetaIterationStore } from '../store/beta-iteration.store'
import { useBootstrapStore } from '@/features/bootstrap/store/bootstrap.store'
import { calcReadiness } from '@/features/bootstrap/services/bootstrap-readiness.service'
import type { ReleaseConclusion } from '../beta-iteration.types'

export function computeReleaseDecision(): {
  conclusion: ReleaseConclusion
  reasons: string[]
  blockedBy: string[]
} {
  const bi = useBetaIterationStore()
  const bootstrap = useBootstrapStore()
  const reasons: string[] = []
  const blockedBy: string[] = []

  if (bi.gateFailCount > 0) {
    blockedBy.push(`${bi.gateFailCount} release gate(s) failed`)
  }
  const pendingGates = bi.gateItems.filter(g => g.status !== 'pass')
  if (pendingGates.length > 0) {
    reasons.push(`${pendingGates.length} gate(s) not yet passed`)
  }

  const pendingRegr = bi.regressionItems.filter(r => r.status !== 'pass')
  if (pendingRegr.length > 0) {
    reasons.push(`${pendingRegr.length} regression check(s) pending`)
  }

  const bootstrapReadiness = calcReadiness()
  if (bootstrapReadiness === 'blocked') {
    blockedBy.push('Bootstrap P0 tasks blocking release')
  } else if (bootstrapReadiness === 'partial') {
    reasons.push('Bootstrap tasks in progress')
  }

  return {
    conclusion: bi.releaseConclusion,
    reasons,
    blockedBy: blockedBy.length > 0 ? blockedBy : [],
  }
}
