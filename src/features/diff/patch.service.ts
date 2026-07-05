import TauriService from "@/services/ipc/tauri.service"
import { generateFileDiff } from "./diff.service"
import type { PatchApplyRecord, PatchFileChange, PatchProposal, PatchResult } from "./diff.types"

const STORAGE_KEY = "lingstack_patch_proposals"

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/")
}

function joinProjectPath(projectPath: string, filePath: string): string {
  const root = normalizePath(projectPath).replace(/\/+$/, "")
  const relative = normalizePath(filePath).replace(/^\/+/, "")
  return `${root}/${relative}`
}

function generateId(): string {
  return `patch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function readProposals(): Record<string, PatchProposal> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeProposals(proposals: Record<string, PatchProposal>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals))
}

export function getPatchProposal(id?: string): PatchProposal | null {
  if (!id) return null
  return readProposals()[id] ?? null
}

export function savePatchProposal(proposal: PatchProposal): void {
  const proposals = readProposals()
  proposals[proposal.id] = proposal
  writeProposals(proposals)
}

export async function createPatchProposal(input: {
  projectPath: string
  taskId?: string
  files: Array<{ filePath: string; newContent: string }>
}): Promise<PatchProposal> {
  const changes: PatchFileChange[] = []

  for (const file of input.files) {
    const fullPath = joinProjectPath(input.projectPath, file.filePath)
    let oldContent = ""
    let status: PatchFileChange["status"] = "M"

    try {
      oldContent = await TauriService.readFile(fullPath)
    } catch {
      status = "A"
    }

    const diff = generateFileDiff(file.filePath, oldContent, file.newContent)
    changes.push({
      filePath: file.filePath,
      oldContent,
      newContent: file.newContent,
      status,
      diff,
    })
  }

  const proposal: PatchProposal = {
    id: generateId(),
    taskId: input.taskId,
    projectPath: input.projectPath,
    files: changes,
    summary: {
      files: changes.length,
      added: changes.reduce((sum, change) => sum + change.diff.stats.added, 0),
      removed: changes.reduce((sum, change) => sum + change.diff.stats.removed, 0),
    },
    status: "proposed",
    createdAt: new Date().toISOString(),
  }

  savePatchProposal(proposal)
  return proposal
}

export async function applyPatchProposal(proposalId: string): Promise<PatchResult> {
  const proposal = getPatchProposal(proposalId)
  if (!proposal) {
    return { success: false, proposalId, error: "补丁提案不存在" }
  }

  if (proposal.status === "applied") {
    return { success: true, proposalId, error: "补丁已经应用" }
  }

  const appliedFiles: PatchApplyRecord["appliedFiles"] = []

  try {
    for (const file of proposal.files) {
      const fullPath = joinProjectPath(proposal.projectPath, file.filePath)
      const backupPath = `${fullPath}.lingstack-backup`

      try {
        const currentContent = await TauriService.readFile(fullPath)
        await TauriService.writeFile(backupPath, currentContent)
        appliedFiles.push({ filePath: file.filePath, backupPath })
      } catch {
        appliedFiles.push({ filePath: file.filePath })
      }

      await TauriService.writeFile(fullPath, file.newContent)
    }

    const record: PatchApplyRecord = {
      proposalId,
      appliedFiles,
      appliedAt: new Date().toISOString(),
    }

    proposal.status = "applied"
    proposal.appliedAt = record.appliedAt
    proposal.error = undefined
    savePatchProposal(proposal)

    return { success: true, proposalId, record }
  } catch (error) {
    proposal.status = "failed"
    proposal.error = String(error)
    savePatchProposal(proposal)
    return { success: false, proposalId, error: String(error) }
  }
}

export async function rollbackPatchProposal(proposalId: string): Promise<PatchResult> {
  const proposal = getPatchProposal(proposalId)
  if (!proposal) {
    return { success: false, proposalId, error: "补丁提案不存在" }
  }

  try {
    for (const file of proposal.files) {
      const fullPath = joinProjectPath(proposal.projectPath, file.filePath)
      await TauriService.writeFile(fullPath, file.oldContent)
    }

    proposal.status = "rolled_back"
    proposal.rolledBackAt = new Date().toISOString()
    proposal.error = undefined
    savePatchProposal(proposal)

    return { success: true, proposalId }
  } catch (error) {
    proposal.status = "failed"
    proposal.error = String(error)
    savePatchProposal(proposal)
    return { success: false, proposalId, error: String(error) }
  }
}

export async function applyPatch(
  filePath: string,
  content: string,
  projectPath: string,
): Promise<PatchResult> {
  const proposal = await createPatchProposal({
    projectPath,
    files: [{ filePath, newContent: content }],
  })
  return applyPatchProposal(proposal.id)
}

export async function backupFile(filePath: string, projectPath: string): Promise<string | undefined> {
  try {
    const fullPath = joinProjectPath(projectPath, filePath)
    const backupPath = `${fullPath}.lingstack-backup`
    const content = await TauriService.readFile(fullPath)
    await TauriService.writeFile(backupPath, content)
    return backupPath
  } catch {
    return undefined
  }
}

export async function rollbackFile(filePath: string, backupPath: string): Promise<boolean> {
  try {
    const content = await TauriService.readFile(backupPath)
    await TauriService.writeFile(filePath, content)
    return true
  } catch {
    return false
  }
}
