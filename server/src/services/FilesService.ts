import { readdir, stat, readFile, writeFile, mkdir, rename, unlink, rmdir } from 'fs/promises'
import { join, dirname } from 'path'
import { getExtension, sortFileNodes } from '../utils/fileHelpers.js'
import { validatePath, BASE_PATH } from '../middleware/pathValidation.js'
import logger from '../utils/logger.js'

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  size?: number
  extension?: string
  children?: FileNode[]
}

/**
 * Files Service - Handles all file operations business logic
 */
export class FilesService {
  /**
   * Read directory and return structured data
   */
  private async readDirectory(dirPath: string): Promise<FileNode[]> {
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
          node.children = []
        }

        nodes.push(node)
      }

      return sortFileNodes(nodes)
    } catch (error) {
      logger.error('Error reading directory:', error)
      throw error
    }
  }

  /**
   * List files and folders in a directory
   */
  async listFiles(requestedPath: string): Promise<FileNode> {
    const safePath = validatePath(requestedPath)
    logger.info(`FilesService: Listing files at ${safePath}`)

    const stats = await stat(safePath)
    if (!stats.isDirectory()) {
      throw new Error('Path is not a directory')
    }

    const children = await this.readDirectory(safePath)

    return {
      name: requestedPath === '/' ? 'projects' : requestedPath.split('/').pop() || 'projects',
      path: safePath,
      type: 'folder',
      children,
    }
  }

  /**
   * Read file content
   */
  async readFileContent(requestedPath: string): Promise<{ path: string; content: string; size: number }> {
    const safePath = validatePath(requestedPath)
    logger.info(`FilesService: Reading file ${safePath}`)

    const stats = await stat(safePath)
    if (!stats.isFile()) {
      throw new Error('Path is not a file')
    }

    const content = await readFile(safePath, 'utf-8')

    return {
      path: safePath,
      content,
      size: stats.size,
    }
  }

  /**
   * Save file content
   */
  async saveFileContent(requestedPath: string, content: string): Promise<{ success: boolean; path: string; message: string }> {
    const safePath = validatePath(requestedPath)
    logger.info(`FilesService: Saving file ${safePath}`)

    const stats = await stat(safePath)
    if (!stats.isFile()) {
      throw new Error('Path is not a file')
    }

    await writeFile(safePath, content, 'utf-8')
    logger.info(`File saved successfully: ${safePath}`)

    return {
      success: true,
      path: safePath,
      message: 'File saved successfully',
    }
  }

  /**
   * Create a new file
   */
  async createFile(folderPath: string, fileName: string): Promise<{ success: boolean; path: string; message: string }> {
    const safeFolderPath = validatePath(folderPath)
    const safeFilePath = join(safeFolderPath, fileName)

    // Validate the full path is still within BASE_PATH
    const relativePath = safeFilePath.replace(BASE_PATH, '')
    validatePath(relativePath)

    logger.info(`FilesService: Creating file ${safeFilePath}`)

    // Check if file already exists
    try {
      await stat(safeFilePath)
      throw new Error('File already exists')
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }

    await writeFile(safeFilePath, '', 'utf-8')
    logger.info(`File created successfully: ${safeFilePath}`)

    return {
      success: true,
      path: safeFilePath,
      message: 'File created successfully',
    }
  }

  /**
   * Create a new folder
   */
  async createFolder(parentPath: string, folderName: string): Promise<{ success: boolean; path: string; message: string }> {
    const safeParentPath = validatePath(parentPath)
    const safeFolderPath = join(safeParentPath, folderName)

    // Validate the full path is still within BASE_PATH
    const relativePath = safeFolderPath.replace(BASE_PATH, '')
    validatePath(relativePath)

    logger.info(`FilesService: Creating folder ${safeFolderPath}`)

    // Check if folder already exists
    try {
      await stat(safeFolderPath)
      throw new Error('Folder already exists')
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }

    await mkdir(safeFolderPath)
    logger.info(`Folder created successfully: ${safeFolderPath}`)

    return {
      success: true,
      path: safeFolderPath,
      message: 'Folder created successfully',
    }
  }

  /**
   * Rename a file or folder
   */
  async renameItem(oldPath: string, newName: string): Promise<{ success: boolean; oldPath: string; newPath: string; message: string }> {
    const safeOldPath = validatePath(oldPath)
    const parentDir = dirname(safeOldPath)
    const safeNewPath = join(parentDir, newName)

    // Validate the new path is still within BASE_PATH
    const relativePath = safeNewPath.replace(BASE_PATH, '')
    validatePath(relativePath)

    logger.info(`FilesService: Renaming ${safeOldPath} to ${safeNewPath}`)

    // Check if old path exists
    await stat(safeOldPath)

    // Check if new path already exists
    try {
      await stat(safeNewPath)
      throw new Error('A file or folder with that name already exists')
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }

    await rename(safeOldPath, safeNewPath)
    logger.info(`Renamed successfully: ${safeOldPath} -> ${safeNewPath}`)

    return {
      success: true,
      oldPath: safeOldPath,
      newPath: safeNewPath,
      message: 'Renamed successfully',
    }
  }

  /**
   * Delete a file or folder
   */
  async deleteItem(itemPath: string): Promise<{ success: boolean; path: string; message: string }> {
    const safePath = validatePath(itemPath)
    logger.info(`FilesService: Deleting ${safePath}`)

    const stats = await stat(safePath)

    if (stats.isDirectory()) {
      await rmdir(safePath)
      logger.info(`Folder deleted: ${safePath}`)
    } else {
      await unlink(safePath)
      logger.info(`File deleted: ${safePath}`)
    }

    return {
      success: true,
      path: safePath,
      message: 'Deleted successfully',
    }
  }
}
