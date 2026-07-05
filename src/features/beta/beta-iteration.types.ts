export type ReleaseGateStatus = 'todo' | 'partial' | 'pass' | 'fail'
export type IterationStatus = 'planning' | 'building' | 'testing' | 'ready_to_release' | 'released' | 'rollback'
export type ReleaseConclusion = 'ready' | 'partial' | 'blocked'
export type BetaChannel = 'alpha' | 'beta' | 'rc'

export interface BetaGateItem {
  id: string
  label: string
  status: ReleaseGateStatus
  detail?: string
}
export interface BetaIterationItem {
  id: string
  version: string
  title: string
  objective: string
  status: IterationStatus
  channel: BetaChannel
  includedTaskIds: string[]
  changelog: string
  buildStatus: 'pending' | 'building' | 'success' | 'failed'
  releaseStatus: 'pending' | 'preparing' | 'uploading' | 'published' | 'failed'
  updaterStatus: 'pending' | 'generating' | 'uploaded' | 'verified' | 'failed'
  createdAt: string
  updatedAt: string
}
export interface RegressionCheckItem {
  id: string
  label: string
  area: 'thread' | 'review' | 'terminal' | 'git' | 'skills' | 'feedback' | 'settings' | 'shortcuts' | 'build' | 'other'
  status: ReleaseGateStatus
  note?: string
  checkedAt?: string
}

export function defaultGateItems(): BetaGateItem[] { return [
  { id:'g1',label:'Thread main chain normal',status:'todo' },
  { id:'g2',label:'Review pane normal',status:'todo' },
  { id:'g3',label:'Terminal normal',status:'todo' },
  { id:'g4',label:'Git pane normal',status:'todo' },
  { id:'g5',label:'Skills/MCP/Browser/Desktop entries not crash',status:'todo' },
  { id:'g6',label:'Goal/Automation basics available',status:'todo' },
  { id:'g7',label:'Deep link normal',status:'todo' },
  { id:'g8',label:'Shortcuts critical path normal',status:'todo' },
  { id:'g9',label:'Build passes',status:'todo' },
  { id:'g10',label:'Tauri build/pkg passes (if possible)',status:'todo' },
  { id:'g11',label:'Updater metadata consistent',status:'todo' },
  { id:'g12',label:'State restore normal',status:'todo' },
  { id:'g13',label:'Key fixes verified this round',status:'todo' },
]}

export function defaultRegressionItems(): RegressionCheckItem[] { return [
  { id:'r01',label:'Open project',area:'thread',status:'todo' },
  { id:'r02',label:'New thread',area:'thread',status:'todo' },
  { id:'r03',label:'Switch thread',area:'thread',status:'todo' },
  { id:'r04',label:'Thread restore',area:'thread',status:'todo' },
  { id:'r05',label:'Composer draft restore',area:'thread',status:'todo' },
  { id:'r06',label:'Review diff open',area:'review',status:'todo' },
  { id:'r07',label:'Comment flows back to thread',area:'review',status:'todo' },
  { id:'r08',label:'Terminal execute command',area:'terminal',status:'todo' },
  { id:'r09',label:'Git changed files/stage/revert',area:'git',status:'todo' },
  { id:'r10',label:'Settings open',area:'settings',status:'todo' },
  { id:'r11',label:'Shortcuts work',area:'shortcuts',status:'todo' },
  { id:'r12',label:'Beta feedback submit',area:'feedback',status:'todo' },
  { id:'r13',label:'Self-host readiness visible',area:'other',status:'todo' },
  { id:'r14',label:'Build check',area:'build',status:'todo' },
]}
