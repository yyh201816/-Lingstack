/**
 * computer-use.types.ts  Computer Use Capability Types
 */

export interface ComputerUseState {
  available: boolean
  permission: "unknown" | "granted" | "denied"
  isRunning: boolean
  currentTargetApp?: string
  lastActionSummary?: string
}

export function createDefaultComputerUseState(): ComputerUseState {
  return {
    available: false,
    permission: "unknown",
    isRunning: false,
  }
}
