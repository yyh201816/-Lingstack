export interface WorkspaceTab { id: string; filePath: string; fileName: string; language: string; isDirty: boolean; content: string; }
export interface FileTreeNode { name: string; path: string; isDirectory: boolean; children?: FileTreeNode[]; expanded?: boolean; }
