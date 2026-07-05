import { registerTool } from "../tool-router"
import { applyPatchTool, rollbackPatchTool } from "./apply-patch.tool"
import { generateDiffTool } from "./generate-diff.tool"
import { listDirTool } from "./list-dir.tool"
import { readFileTool } from "./read-file.tool"
import { searchFilesTool } from "./search-files.tool"

export function initBuiltinTools(): void {
  registerTool(readFileTool)
  registerTool(listDirTool)
  registerTool(searchFilesTool)
  registerTool(generateDiffTool)
  registerTool(applyPatchTool)
  registerTool(rollbackPatchTool)
}

export {
  applyPatchTool,
  generateDiffTool,
  listDirTool,
  readFileTool,
  rollbackPatchTool,
  searchFilesTool,
}
