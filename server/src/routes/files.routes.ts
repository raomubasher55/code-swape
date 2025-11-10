import { Router, Request, Response } from 'express'
import { readdir, stat } from 'fs/promises'
import { join, normalize, relative } from 'path'
import logger from '../utils/logger.js'

const router = Router()

// Base path for file operations - SECURITY: Only allow access within this folder
const BASE_PATH = '/root/projects'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  size?: number
  extension?: string
  children?: FileNode[]
}

/**
 * Validate and normalize path to prevent directory traversal attacks
 */
function validatePath(requestedPath: string): string {
  // Normalize the path to remove .. and .
  const normalizedPath = normalize(requestedPath)

  // Get absolute path
  const absolutePath = join(BASE_PATH, normalizedPath)

  // Check if the path is within BASE_PATH
  const relativePath = relative(BASE_PATH, absolutePath)

  if (relativePath.startsWith('..') || absolutePath === BASE_PATH.slice(0, -1)) {
    throw new Error('Access denied: Path outside allowed directory')
  }

  return absolutePath
}

/**
 * Get file extension
 */
function getExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : ''
}

/**
 * Read directory and return structured data
 */
async function readDirectory(dirPath: string): Promise<FileNode[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true })

    const nodes: FileNode[] = []

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      const stats = await stat(fullPath)

      const node: FileNode = {
        name: entry.name,
        path: fullPath,
        type: entry.isDirectory() ? 'folder' : 'file',
      }

      if (entry.isFile()) {
        node.size = stats.size
        node.extension = getExtension(entry.name)
      }

      if (entry.isDirectory()) {
        node.children = [] // Empty array for lazy loading
      }

      nodes.push(node)
    }

    // Sort: folders first, then files, alphabetically
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

    return nodes
  } catch (error) {
    logger.error('Error reading directory:', error)
    throw error
  }
}

/**
 * GET /api/files
 * List files and folders in a directory
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const requestedPath = (req.query.path as string) || '/'

    logger.info(`Files API: Requested path: ${requestedPath}`)

    // Validate path
    const safePath = validatePath(requestedPath)

    logger.info(`Files API: Safe path: ${safePath}`)

    // Check if path exists
    const stats = await stat(safePath)

    if (!stats.isDirectory()) {
      return res.status(400).json({
        error: 'Path is not a directory'
      })
    }

    // Read directory contents
    const children = await readDirectory(safePath)

    // Build response
    const response: FileNode = {
      name: requestedPath === '/' ? 'projects' : requestedPath.split('/').pop() || 'projects',
      path: safePath,
      type: 'folder',
      children
    }

    res.json(response)

  } catch (error: any) {
    logger.error('Error in files API:', error)

    if (error.code === 'ENOENT') {
      return res.status(404).json({
        error: 'Path not found'
      })
    }

    if (error.code === 'EACCES') {
      return res.status(403).json({
        error: 'Permission denied'
      })
    }

    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        error: error.message
      })
    }

    res.status(500).json({
      error: 'Internal server error'
    })
  }
})

export default router
