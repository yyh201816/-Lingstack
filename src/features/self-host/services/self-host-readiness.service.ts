/**
 * Self-Host Readiness Service
 * Scans the current codebase state to determine LingStack's readiness
 * for self-hosted development (using LingStack to develop LingStack).
 * Phase 9: static analysis based on known capabilities from Phases 1-8.
 */

import type { SelfHostCapabilityItem, SelfHostPlanStage } from '../types/self-host.types'

/**
 * Compute the readiness checklist based on current codebase capabilities.
 * Phase 9: hardcoded based on verified Phase 1-8 deliverables.
 * Future: could dynamically scan file system / stores.
 */
export function computeReadiness(): SelfHostCapabilityItem[] {
  return [
    {
      id: 'thread-mainline',
      name: 'Thread Mainline',
      description: 'Thread list, active thread, message timeline, composer, persistence',
      status: 'ready',
      evidence: 'Phase 3: ThreadHeader 9 actions + ThreadComposer streaming + localStorage persistence',
    },
    {
      id: 'review-pane',
      name: 'Review Pane + Diff',
      description: 'Diff viewer, inline comments, stage/revert, review↔thread bridge',
      status: 'ready',
      evidence: 'Phase 4: 6 review components + diff data structure + bidirectional thread↔review communication',
    },
    {
      id: 'terminal',
      name: 'Terminal',
      description: 'Command execution, output streaming, per-thread sessions',
      status: 'partial',
      evidence: 'Phase 5: terminal-runtime.service (bridge/mock). Real Tauri shell execution still pending.',
    },
    {
      id: 'git',
      name: 'Git Integration',
      description: 'Branch bar, changed files, stage/unstage, commit draft',
      status: 'partial',
      evidence: 'Phase 5: GitPane + review↔git bridge. Real git porcelain commands still pending.',
    },
    {
      id: 'skills-runner',
      name: 'Skill Runner',
      description: 'Skill discovery, execution, workspace context injection, knowledge augmentation',
      status: 'ready',
      evidence: 'R17+R25: SkillRunner + KnowledgeSync + WorkspaceContext unified into SkillExecutionPayload.',
    },
    {
      id: 'self-heal',
      name: 'Self-Heal Task Loop',
      description: 'Parse skill output, generate task items, track status, validation records',
      status: 'ready',
      evidence: 'R26: self-heal-parser.service + self-heal.store + TaskBoard + localStorage persistence.',
    },
    {
      id: 'mcp-browser-cu',
      name: 'MCP / Browser / Computer Use',
      description: 'Entry points and store-connected panels for high-level capabilities',
      status: 'partial',
      evidence: 'Phase 6: Types + stores + UI components. Real MCP connections / browser window / desktop automation pending.',
    },
    {
      id: 'agent-orchestration',
      name: 'Agent Orchestration',
      description: 'Thread-local orchestration state, step lifecycle, execution summary',
      status: 'partial',
      evidence: 'Phase 7: Types + store + service + 3 components. Bridge/mock for actual agent execution.',
    },
    {
      id: 'goal-mode',
      name: 'Goal Mode',
      description: 'Sustained goals (active/paused/done/blocked), progress tracking',
      status: 'ready',
      evidence: 'Phase 7: goal.store + goal-progress.service + 3 components + localStorage persistence.',
    },
    {
      id: 'automations',
      name: 'Automations',
      description: 'Background thread runner, run history, import/export',
      status: 'partial',
      evidence: 'Phase 7: automation.store + automation-runner.service (bridge). Real background execution pending.',
    },
    {
      id: 'deep-link',
      name: 'Deep Link Router',
      description: 'lingstack:// URI parsing, navigation dispatch, copy support',
      status: 'ready',
      evidence: 'Phase 8: deeplink-router.service with 4 URI patterns + thread list copy integration.',
    },
    {
      id: 'keyboard-shortcuts',
      name: 'Keyboard Shortcuts',
      description: '6 global shortcuts, command registry, settings UI',
      status: 'ready',
      evidence: 'Phase 8: shortcut.store + shortcut-registry.service + ShortcutSettingsPane.',
    },
    {
      id: 'updater',
      name: 'Online Updater',
      description: 'Tauri updater plugin, check/download/install, server sync',
      status: 'ready',
      evidence: 'R18-R27: updater.service + latest.json + server sync + NSIS installer + ASCII alias.',
    },
    {
      id: 'beta-feedback',
      name: 'Beta Feedback Loop',
      description: 'Feedback dialog, store, export, version info, changelog',
      status: 'ready',
      evidence: 'Phase 9: beta-feedback.store + BetaFeedbackDialog + BetaStatusPane + local export.',
    },
    {
      id: 'workspace-context',
      name: 'Workspace Context Injection',
      description: '11-field payload injected into Chat system prompt',
      status: 'ready',
      evidence: 'R24: buildWorkspaceContextPayload + 11 fields + UI context indicator.',
    },
  ]
}

/**
 * Default three-stage migration plan (A → B → C).
 */
export function getDefaultMigrationPlan(): SelfHostPlanStage[] {
  return [
    {
      id: 'A',
      title: 'Stage A — Observer & Small Fixer',
      objective: 'LingStack handles viewing threads, running terminal, reading git, collecting feedback, making small fixes. Trae handles large structural development.',
      lingstackScope: [
        'View and navigate threads',
        'Read review diffs',
        'Run terminal commands',
        'View git status',
        'Collect beta feedback',
        'Make small code fixes',
      ],
      traeScope: [
        'Large-scale structural development',
        'Major file refactoring',
        'Complex UI assembly',
        'Cross-feature batch operations',
      ],
      status: 'in_progress',
    },
    {
      id: 'B',
      title: 'Stage B — Small Iterator & Bug Fixer',
      objective: 'LingStack handles small iterations, bug fixes, doc changes, feedback triage, version checks, and minor code changes. Trae handles only large refactors.',
      lingstackScope: [
        'Small bug fix iterations',
        'Documentation updates',
        'Feedback triage and closure',
        'Version consistency checks',
        'Small-range code changes',
        'Skill-driven repairs',
      ],
      traeScope: [
        'Large-scale refactoring',
        'Cross-feature batch engineering',
        'Architecture decisions',
      ],
      status: 'todo',
    },
    {
      id: 'C',
      title: 'Stage C — Primary Development Platform',
      objective: 'LingStack becomes the primary development environment. Trae degrades to an auxiliary executor for specialized operations.',
      lingstackScope: [
        'All routine development',
        'Feature implementation',
        'Bug fixing',
        'Testing and validation',
        'Release management',
        'Self-heal driven improvement',
      ],
      traeScope: [
        'Specialized large-scale operations',
        'Emergency interventions',
        'Complex AI-assisted refactoring',
      ],
      status: 'todo',
    },
  ]
}

/**
 * Generate a recommended task description for continuing self-host development.
 * Can be injected into a thread or composer.
 */
export function generateSelfHostTaskPrompt(capability: SelfHostCapabilityItem): string {
  return `Continue improving LingStack self-host capability: "${capability.name}".

Current status: ${capability.status}
Description: ${capability.description}
${capability.evidence ? `Evidence: ${capability.evidence}` : ''}

Please analyze what needs to be done to advance this capability from "${capability.status}" to "ready", and propose concrete changes.`
}
