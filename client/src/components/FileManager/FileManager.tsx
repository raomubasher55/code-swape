import { useState, useEffect } from 'react'
import { Tree } from 'react-arborist'
import { Folder, FolderOpen, File, FileText, FileCode, FileJson } from 'lucide-react'
import { Box, Text, Flex } from '@radix-ui/themes'
import type { FileNode, FileTreeData } from '../../types/files.types'

interface FileManagerProps {
  onFileClick?: (file: FileNode) => void
}

export default function FileManager({ onFileClick }: FileManagerProps) {
  const [data, setData] = useState<FileTreeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  // Load root folder on mount
  useEffect(() => {
    loadFolder('/')
  }, [])

  // Load folder contents from API
  const loadFolder = async (path: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_URL}/files?path=${encodeURIComponent(path)}`)

      if (!response.ok) {
        throw new Error(`Failed to load files: ${response.statusText}`)
      }

      const result: FileNode = await response.json()

      // Convert to tree format
      const treeData: FileTreeData[] = convertToTreeData([result])
      setData(treeData)
    } catch (err: any) {
      console.error('Error loading files:', err)
      setError(err.message || 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  // Convert FileNode to TreeData format for react-arborist
  const convertToTreeData = (nodes: FileNode[]): FileTreeData[] => {
    return nodes.map(node => ({
      id: node.path,
      name: node.name,
      isFolder: node.type === 'folder',
      path: node.path,
      children: node.children ? convertToTreeData(node.children) : undefined
    }))
  }

  // Get icon for file/folder
  const getIcon = (node: FileTreeData, isOpen: boolean) => {
    const size = 16
    const color = 'currentColor'

    if (node.isFolder) {
      return isOpen ?
        <FolderOpen size={size} color="#fbbf24" /> :
        <Folder size={size} color="#fbbf24" />
    }

    // File icons based on extension
    const ext = node.name.split('.').pop()?.toLowerCase()

    switch (ext) {
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return <FileCode size={size} color="#3b82f6" />
      case 'json':
        return <FileJson size={size} color="#10b981" />
      case 'md':
      case 'txt':
        return <FileText size={size} color="#6b7280" />
      default:
        return <File size={size} color={color} />
    }
  }

  // Handle node click
  const handleClick = async (node: any) => {
    const treeNode: FileTreeData = node.data

    if (treeNode.isFolder) {
      // Lazy load children if not loaded yet
      if (!node.children || node.children.length === 0) {
        try {
          const relativePath = treeNode.path.replace('/root/projects', '')
          const response = await fetch(`${API_URL}/files?path=${encodeURIComponent(relativePath || '/')}`)
          const result: FileNode = await response.json()

          if (result.children) {
            // Update the node's children
            const children = convertToTreeData(result.children)
            node.data.children = children
          }
        } catch (err) {
          console.error('Error loading folder:', err)
        }
      }
    } else {
      // File clicked - callback for future editor integration
      if (onFileClick) {
        const fileNode: FileNode = {
          name: treeNode.name,
          path: treeNode.path,
          type: 'file'
        }
        onFileClick(fileNode)
      }
    }
  }

  if (loading && data.length === 0) {
    return (
      <Box p="4">
        <Text size="2" color="gray">Loading files...</Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Box p="4">
        <Text size="2" color="red">{error}</Text>
      </Box>
    )
  }

  if (data.length === 0) {
    return (
      <Box p="4">
        <Text size="2" color="gray">No files found</Text>
      </Box>
    )
  }

  return (
    <Box style={{ height: '100%', width: '100%' }}>
      <Tree
        data={data}
        openByDefault={false}
        width={'100%' as any}
        height={'100%' as any}
        indent={16}
        rowHeight={28}
        overscanCount={100}
        onClick={handleClick}
      >
        {({ node, style, dragHandle }) => (
          <div style={style} ref={dragHandle}>
            <Flex gap="2" align="center" style={{ paddingLeft: `${node.level * 16}px` }}>
              {getIcon(node.data, node.isOpen)}
              <Text size="2" style={{ cursor: 'pointer' }}>
                {node.data.name}
              </Text>
            </Flex>
          </div>
        )}
      </Tree>
    </Box>
  )
}
