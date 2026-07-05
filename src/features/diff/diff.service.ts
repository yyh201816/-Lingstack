import type { DiffHunk, DiffLine, DiffSummary, FileDiff } from "./diff.types"

function splitLines(content: string): string[] {
  return content.length === 0 ? [] : content.replace(/\r\n/g, "\n").split("\n")
}

function longestCommonSubsequence(a: string[], b: string[]): string[] {
  const rows = a.length
  const cols = b.length
  const dp: number[][] = Array.from({ length: rows + 1 }, () => Array(cols + 1).fill(0))

  for (let row = 1; row <= rows; row += 1) {
    for (let col = 1; col <= cols; col += 1) {
      dp[row][col] = a[row - 1] === b[col - 1]
        ? dp[row - 1][col - 1] + 1
        : Math.max(dp[row - 1][col], dp[row][col - 1])
    }
  }

  const result: string[] = []
  let row = rows
  let col = cols

  while (row > 0 && col > 0) {
    if (a[row - 1] === b[col - 1]) {
      result.unshift(a[row - 1])
      row -= 1
      col -= 1
    } else if (dp[row - 1][col] >= dp[row][col - 1]) {
      row -= 1
    } else {
      col -= 1
    }
  }

  return result
}

function computeLineDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const lines: DiffLine[] = []
  const lcs = longestCommonSubsequence(oldLines, newLines)
  let oldIndex = 0
  let newIndex = 0
  let lcsIndex = 0

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    const nextCommon = lcs[lcsIndex]

    if (
      nextCommon !== undefined &&
      oldLines[oldIndex] === nextCommon &&
      newLines[newIndex] === nextCommon
    ) {
      lines.push({
        type: "context",
        content: oldLines[oldIndex],
        oldLineNumber: oldIndex + 1,
        newLineNumber: newIndex + 1,
      })
      oldIndex += 1
      newIndex += 1
      lcsIndex += 1
      continue
    }

    if (newIndex < newLines.length && newLines[newIndex] !== nextCommon) {
      lines.push({
        type: "add",
        content: newLines[newIndex],
        newLineNumber: newIndex + 1,
      })
      newIndex += 1
      continue
    }

    if (oldIndex < oldLines.length) {
      lines.push({
        type: "remove",
        content: oldLines[oldIndex],
        oldLineNumber: oldIndex + 1,
      })
      oldIndex += 1
      continue
    }
  }

  return lines
}

export function generateFileDiff(filePath: string, oldContent: string, newContent: string): FileDiff {
  const oldLines = splitLines(oldContent)
  const newLines = splitLines(newContent)
  const diffLines = computeLineDiff(oldLines, newLines)
  const added = diffLines.filter((line) => line.type === "add").length
  const removed = diffLines.filter((line) => line.type === "remove").length

  const hunk: DiffHunk = {
    header: `@@ -1,${oldLines.length} +1,${newLines.length} @@`,
    oldStart: 1,
    oldCount: oldLines.length,
    newStart: 1,
    newCount: newLines.length,
    lines: diffLines,
  }

  return {
    filePath,
    oldContent,
    newContent,
    hunks: [hunk],
    stats: { added, removed },
  }
}

export function generateUnifiedDiff(filePath: string, oldContent: string, newContent: string): string {
  const diff = generateFileDiff(filePath, oldContent, newContent)
  const output = [`--- a/${filePath}`, `+++ b/${filePath}`]

  for (const hunk of diff.hunks) {
    output.push(hunk.header)
    for (const line of hunk.lines) {
      const prefix = line.type === "add" ? "+" : line.type === "remove" ? "-" : " "
      output.push(`${prefix}${line.content}`)
    }
  }

  return output.join("\n")
}

export function summarizeDiffs(files: FileDiff[]): DiffSummary {
  return {
    files,
    totalAdded: files.reduce((sum, file) => sum + file.stats.added, 0),
    totalRemoved: files.reduce((sum, file) => sum + file.stats.removed, 0),
    totalFiles: files.length,
    generatedAt: new Date().toISOString(),
  }
}
