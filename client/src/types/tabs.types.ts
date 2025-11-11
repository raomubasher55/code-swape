export interface EditorTab {
  id: string
  filePath: string
  fileName: string
  content: string
  hasChanges: boolean
  isActive: boolean
}
