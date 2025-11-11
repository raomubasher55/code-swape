import { useState, useEffect } from 'react'
import { Tree } from 'react-arborist'
import { Folder, FolderOpen, File, FileText, FileCode, FileJson, FilePlus, FolderPlus, Edit, Trash2 } from 'lucide-react'
import { Box, Text, Flex, Dialog, Button, TextField } from '@radix-ui/themes'
import * as ContextMenu from '@radix-ui/react-context-menu'
import type { FileNode, FileTreeData } from '../../types/files.types'

interface FileManagerProps {
  onFileClick?: (file: FileNode) => void
}

export default function FileManager({ onFileClick }: FileManagerProps) {
  const [data, setData] = useState<FileTreeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contextNode, setContextNode] = useState<FileTreeData | null>(null)
  const [showCreateFileDialog, setShowCreateFileDialog] = useState(false)
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [newName, setNewName] = useState('')

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  // Load root folder on mount
  useEffect(() => {
    loadFolderRecursive('/')
  }, [])

  // Load folder and all its children recursively
  const loadFolderRecursive = async (path: string) => {
    try {
      setLoading(true)
      setError(null)

      const url = `${API_URL}/files?path=${encodeURIComponent(path)}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to load files: ${response.statusText}`)
      }

      const result: FileNode = await response.json()

      // Recursively load all subfolders
      const treeData = await convertToTreeDataRecursive(result)

      setData([treeData])
    } catch (err: any) {
      console.error('Error loading files:', err)
      setError(err.message || 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  // Convert FileNode to TreeData and load all children
  const convertToTreeDataRecursive = async (node: FileNode): Promise<FileTreeData> => {
    const treeNode: FileTreeData = {
      id: node.path,
      name: node.name,
      isFolder: node.type === 'folder',
      path: node.path,
    }

    // If it's a folder and has children, convert them recursively
    if (node.type === 'folder' && node.children) {
      const childrenPromises = node.children.map(async (child) => {
        if (child.type === 'folder') {
          // Load this folder's contents from API
          try {
            const relativePath = child.path.replace('/root/projects', '')
            const response = await fetch(`${API_URL}/files?path=${encodeURIComponent(relativePath || '/')}`)
            const folderData: FileNode = await response.json()
            return await convertToTreeDataRecursive(folderData)
          } catch (err) {
            console.error('Error loading subfolder:', err)
            return {
              id: child.path,
              name: child.name,
              isFolder: true,
              path: child.path,
              children: []
            }
          }
        } else {
          // It's a file, just convert it
          return {
            id: child.path,
            name: child.name,
            isFolder: false,
            path: child.path,
          }
        }
      })

      treeNode.children = await Promise.all(childrenPromises)
    }

    return treeNode
  }

  // File operations
  const handleCreateFile = async () => {
    if (!contextNode || !newName.trim()) return

    try {
      const relativePath = contextNode.path.replace('/root/projects', '')
      const response = await fetch(`${API_URL}/files/create-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: relativePath || '/',
          name: newName.trim()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to create file')
        return
      }

      // Reload the tree
      await loadFolderRecursive('/')
      setShowCreateFileDialog(false)
      setNewName('')
    } catch (err) {
      console.error('Error creating file:', err)
      alert('Failed to create file')
    }
  }

  const handleCreateFolder = async () => {
    if (!contextNode || !newName.trim()) return

    try {
      const relativePath = contextNode.path.replace('/root/projects', '')
      const response = await fetch(`${API_URL}/files/create-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: relativePath || '/',
          name: newName.trim()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to create folder')
        return
      }

      // Reload the tree
      await loadFolderRecursive('/')
      setShowCreateFolderDialog(false)
      setNewName('')
    } catch (err) {
      console.error('Error creating folder:', err)
      alert('Failed to create folder')
    }
  }

  const handleRename = async () => {
    if (!contextNode || !newName.trim()) return

    try {
      const relativePath = contextNode.path.replace('/root/projects', '')
      const response = await fetch(`${API_URL}/files/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: relativePath || '/',
          newName: newName.trim()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to rename')
        return
      }

      // Reload the tree
      await loadFolderRecursive('/')
      setShowRenameDialog(false)
      setNewName('')
    } catch (err) {
      console.error('Error renaming:', err)
      alert('Failed to rename')
    }
  }

  const handleDelete = async (node: FileTreeData) => {
    const confirmMsg = node.isFolder
      ? `Delete folder "${node.name}"? This will only work if the folder is empty.`
      : `Delete file "${node.name}"?`

    if (!confirm(confirmMsg)) return

    try {
      const relativePath = node.path.replace('/root/projects', '')
      const response = await fetch(
        `${API_URL}/files?path=${encodeURIComponent(relativePath || '/')}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to delete')
        return
      }

      // Reload the tree
      await loadFolderRecursive('/')
    } catch (err) {
      console.error('Error deleting:', err)
      alert('Failed to delete')
    }
  }

  // Get icon for file/folder
  const getIcon = (node: FileTreeData, isOpen: boolean) => {
    const size = 16

    if (node.isFolder) {
      return isOpen ?
        <FolderOpen size={size} color="#f59e0b" /> :
        <Folder size={size} color="#f59e0b" />
    }

    // File icons based on extension
    const ext = node.name.split('.').pop()?.toLowerCase()

    switch (ext) {
      case 'js':
      case 'jsx':
        return <FileCode size={size} color="#f7df1e" />
      case 'ts':
      case 'tsx':
        return <FileCode size={size} color="#3178c6" />
      case 'json':
        return <FileJson size={size} color="#a855f7" />
      case 'md':
        return <FileText size={size} color="#06b6d4" />
      case 'txt':
        return <FileText size={size} color="#94a3b8" />
      case 'html':
        return <FileCode size={size} color="#e34c26" />
      case 'css':
        return <FileCode size={size} color="#264de4" />
      case 'py':
        return <FileCode size={size} color="#3776ab" />
      default:
        return <File size={size} color="#94a3b8" />
    }
  }

  if (loading && data.length === 0) {
    return (
      <Box p="4">
        <Text size="2" style={{ color: '#9ca3af' }}>Loading files...</Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Box p="4">
        <Text size="2" style={{ color: '#ef4444' }}>{error}</Text>
      </Box>
    )
  }

  if (data.length === 0) {
    return (
      <Box p="4">
        <Text size="2" style={{ color: '#9ca3af' }}>No files found</Text>
      </Box>
    )
  }

  return (
    <Box style={{ height: '100%', width: '100%', padding: '8px' }}>
      <Tree
        data={data}
        openByDefault={false}
        width={300}
        height={500}
        indent={16}
        rowHeight={32}
      >
        {({ node, style, dragHandle }) => (
          <ContextMenu.Root>
            <ContextMenu.Trigger>
              <div
                style={style}
                ref={dragHandle}
                onClick={() => {
                  if (node.isInternal) {
                    node.toggle()
                  } else {
                    // It's a file, trigger the callback
                    onFileClick?.({
                      name: node.data.name,
                      path: node.data.path,
                      type: 'file'
                    })
                  }
                }}
              >
                <Flex
                  gap="2"
                  align="center"
                  style={{
                    paddingLeft: `${node.level * 16}px`,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#262641'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  {getIcon(node.data, node.isOpen)}
                  <Text size="2" style={{ color: '#e0e7ff', fontWeight: 500 }}>
                    {node.data.name}
                  </Text>
                </Flex>
              </div>
            </ContextMenu.Trigger>

            <ContextMenu.Portal>
              <ContextMenu.Content
                style={{
                  minWidth: 200,
                  backgroundColor: '#1e1e2e',
                  border: '1px solid #4c4f69',
                  borderRadius: 8,
                  padding: 6,
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                }}
              >
                {node.data.isFolder && (
                  <>
                    <ContextMenu.Item
                      className="context-menu-item"
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: '#e0e7ff',
                        transition: 'all 0.15s ease',
                      }}
                      onSelect={() => {
                        setContextNode(node.data)
                        setNewName('')
                        setShowCreateFileDialog(true)
                      }}
                    >
                      <FilePlus size={14} color="#a855f7" />
                      New File
                    </ContextMenu.Item>

                    <ContextMenu.Item
                      className="context-menu-item"
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: '#e0e7ff',
                        transition: 'all 0.15s ease',
                      }}
                      onSelect={() => {
                        setContextNode(node.data)
                        setNewName('')
                        setShowCreateFolderDialog(true)
                      }}
                    >
                      <FolderPlus size={14} color="#f59e0b" />
                      New Folder
                    </ContextMenu.Item>

                    <ContextMenu.Separator style={{ height: 1, backgroundColor: '#4c4f69', margin: '6px 0' }} />
                  </>
                )}

                <ContextMenu.Item
                  className="context-menu-item"
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#e0e7ff',
                    transition: 'all 0.15s ease',
                  }}
                  onSelect={() => {
                    setContextNode(node.data)
                    setNewName(node.data.name)
                    setShowRenameDialog(true)
                  }}
                >
                  <Edit size={14} color="#06b6d4" />
                  Rename
                </ContextMenu.Item>

                <ContextMenu.Item
                  className="context-menu-item"
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#ef4444',
                    transition: 'all 0.15s ease',
                  }}
                  onSelect={() => handleDelete(node.data)}
                >
                  <Trash2 size={14} />
                  Delete
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Portal>
          </ContextMenu.Root>
        )}
      </Tree>

      {/* Create File Dialog */}
      <Dialog.Root open={showCreateFileDialog} onOpenChange={setShowCreateFileDialog}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>Create New File</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Enter a name for the new file
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <TextField.Root
              placeholder="filename.txt"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile()
              }}
            />
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={handleCreateFile}>Create</Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Create Folder Dialog */}
      <Dialog.Root open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>Create New Folder</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Enter a name for the new folder
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <TextField.Root
              placeholder="folder-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder()
              }}
            />
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={handleCreateFolder}>Create</Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Rename Dialog */}
      <Dialog.Root open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>Rename</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Enter a new name
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <TextField.Root
              placeholder="new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
              }}
            />
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={handleRename}>Rename</Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  )
}
