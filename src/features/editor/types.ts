export interface EditorState { filePath: string; language: string; content: string; isDirty: boolean; cursorPosition: { line: number; column: number }; }
