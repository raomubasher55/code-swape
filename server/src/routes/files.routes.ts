import { Router, Request, Response } from 'express'
import { readdir, stat, readFile, writeFile, mkdir, rename, unlink, rmdir } from 'fs/promises'
import { join, normalize, relative, dirname } from 'path'
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

/**
 * GET /api/files/content
 * Read file content
 */
router.get('/content', async (req: Request, res: Response) => {
  try {
    const requestedPath = (req.query.path as string)

    if (!requestedPath) {
      return res.status(400).json({
        error: 'Path parameter is required'
      })
    }

    logger.info(`File content API: Requested path: ${requestedPath}`)

    // Validate path
    const safePath = validatePath(requestedPath)

    logger.info(`File content API: Safe path: ${safePath}`)

    // Check if path exists and is a file
    const stats = await stat(safePath)

    if (!stats.isFile()) {
      return res.status(400).json({
        error: 'Path is not a file'
      })
    }

    // Read file content
    const content = await readFile(safePath, 'utf-8')

    res.json({
      path: safePath,
      content,
      size: stats.size
    })

  } catch (error: any) {
    logger.error('Error reading file content:', error)

    if (error.code === 'ENOENT') {
      return res.status(404).json({
        error: 'File not found'
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

/**
 * POST /api/files/content
 * Save file content
 */
router.post('/content', async (req: Request, res: Response) => {
  try {
    const { path: requestedPath, content } = req.body

    if (!requestedPath) {
      return res.status(400).json({
        error: 'Path parameter is required'
      })
    }

    if (content === undefined) {
      return res.status(400).json({
        error: 'Content parameter is required'
      })
    }

    logger.info(`Save file API: Requested path: ${requestedPath}`)

    // Validate path
    const safePath = validatePath(requestedPath)

    logger.info(`Save file API: Safe path: ${safePath}`)

    // Check if path exists and is a file
    const stats = await stat(safePath)

    if (!stats.isFile()) {
      return res.status(400).json({
        error: 'Path is not a file'
      })
    }

    // Write file content
    await writeFile(safePath, content, 'utf-8')

    logger.info(`File saved successfully: ${safePath}`)

    res.json({
      success: true,
      path: safePath,
      message: 'File saved successfully'
    })

  } catch (error: any) {
    logger.error('Error saving file:', error)

    if (error.code === 'ENOENT') {
      return res.status(404).json({
        error: 'File not found'
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

/**
 * POST /api/files/create-file
 * Create a new file
 */
router.post('/create-file', async (req: Request, res: Response) => {
  try {
    const { path: requestedPath, name } = req.body

    if (!requestedPath || !name) {
      return res.status(400).json({
        error: 'Path and name parameters are required'
      })
    }

    logger.info(`Create file API: Folder: ${requestedPath}, Name: ${name}`)

    // Validate folder path
    const safeFolderPath = validatePath(requestedPath)

    // Create full file path
    const safeFilePath = join(safeFolderPath, name)

    // Validate the full path is still within BASE_PATH
    const relativeFilePath = relative(BASE_PATH, safeFilePath)
    if (relativeFilePath.startsWith('..')) {
      return res.status(403).json({
        error: 'Access denied: Path outside allowed directory'
      })
    }

    logger.info(`Create file API: Safe path: ${safeFilePath}`)

    // Check if file already exists
    try {
      await stat(safeFilePath)
      return res.status(400).json({
        error: 'File already exists'
      })
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err
      }
      // File doesn't exist, continue
    }

    // Create empty file
    await writeFile(safeFilePath, '', 'utf-8')

    logger.info(`File created successfully: ${safeFilePath}`)

    res.json({
      success: true,
      path: safeFilePath,
      message: 'File created successfully'
    })

  } catch (error: any) {
    logger.error('Error creating file:', error)

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

/**
 * POST /api/files/create-folder
 * Create a new folder
 */
router.post('/create-folder', async (req: Request, res: Response) => {
  try {
    const { path: requestedPath, name } = req.body

    if (!requestedPath || !name) {
      return res.status(400).json({
        error: 'Path and name parameters are required'
      })
    }

    logger.info(`Create folder API: Parent: ${requestedPath}, Name: ${name}`)

    // Validate parent path
    const safeParentPath = validatePath(requestedPath)

    // Create full folder path
    const safeFolderPath = join(safeParentPath, name)

    // Validate the full path is still within BASE_PATH
    const relativeFolderPath = relative(BASE_PATH, safeFolderPath)
    if (relativeFolderPath.startsWith('..')) {
      return res.status(403).json({
        error: 'Access denied: Path outside allowed directory'
      })
    }

    logger.info(`Create folder API: Safe path: ${safeFolderPath}`)

    // Check if folder already exists
    try {
      await stat(safeFolderPath)
      return res.status(400).json({
        error: 'Folder already exists'
      })
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err
      }
      // Folder doesn't exist, continue
    }

    // Create folder
    await mkdir(safeFolderPath)

    logger.info(`Folder created successfully: ${safeFolderPath}`)

    res.json({
      success: true,
      path: safeFolderPath,
      message: 'Folder created successfully'
    })

  } catch (error: any) {
    logger.error('Error creating folder:', error)

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

/**
 * POST /api/files/rename
 * Rename a file or folder
 */
router.post('/rename', async (req: Request, res: Response) => {
  try {
    const { path: requestedPath, newName } = req.body

    if (!requestedPath || !newName) {
      return res.status(400).json({
        error: 'Path and newName parameters are required'
      })
    }

    logger.info(`Rename API: Old path: ${requestedPath}, New name: ${newName}`)

    // Validate old path
    const safeOldPath = validatePath(requestedPath)

    // Get parent directory
    const parentDir = dirname(safeOldPath)

    // Create new path
    const safeNewPath = join(parentDir, newName)

    // Validate the new path is still within BASE_PATH
    const relativeNewPath = relative(BASE_PATH, safeNewPath)
    if (relativeNewPath.startsWith('..')) {
      return res.status(403).json({
        error: 'Access denied: Path outside allowed directory'
      })
    }

    logger.info(`Rename API: Old: ${safeOldPath}, New: ${safeNewPath}`)

    // Check if old path exists
    await stat(safeOldPath)

    // Check if new path already exists
    try {
      await stat(safeNewPath)
      return res.status(400).json({
        error: 'A file or folder with that name already exists'
      })
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err
      }
      // New path doesn't exist, continue
    }

    // Rename
    await rename(safeOldPath, safeNewPath)

    logger.info(`Renamed successfully: ${safeOldPath} -> ${safeNewPath}`)

    res.json({
      success: true,
      oldPath: safeOldPath,
      newPath: safeNewPath,
      message: 'Renamed successfully'
    })

  } catch (error: any) {
    logger.error('Error renaming:', error)

    if (error.code === 'ENOENT') {
      return res.status(404).json({
        error: 'File or folder not found'
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

/**
 * DELETE /api/files
 * Delete a file or folder
 */
router.delete('/', async (req: Request, res: Response) => {
  try {
    const requestedPath = (req.query.path as string)

    if (!requestedPath) {
      return res.status(400).json({
        error: 'Path parameter is required'
      })
    }

    logger.info(`Delete API: Requested path: ${requestedPath}`)

    // Validate path
    const safePath = validatePath(requestedPath)

    logger.info(`Delete API: Safe path: ${safePath}`)

    // Check if path exists
    const stats = await stat(safePath)

    // Delete based on type
    if (stats.isDirectory()) {
      // Delete folder (must be empty)
      await rmdir(safePath)
      logger.info(`Folder deleted: ${safePath}`)
    } else {
      // Delete file
      await unlink(safePath)
      logger.info(`File deleted: ${safePath}`)
    }

    res.json({
      success: true,
      path: safePath,
      message: 'Deleted successfully'
    })

  } catch (error: any) {
    logger.error('Error deleting:', error)

    if (error.code === 'ENOENT') {
      return res.status(404).json({
        error: 'File or folder not found'
      })
    }

    if (error.code === 'ENOTEMPTY' || error.code === 'EEXIST') {
      return res.status(400).json({
        error: 'Folder is not empty. Delete contents first.'
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
