export interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  size?: number
  extension?: string
  children?: FileNode[]
}

export interface FileTreeData {
  id: string
  name: string
  children?: FileTreeData[]
  isFolder: boolean
  path: string
}
