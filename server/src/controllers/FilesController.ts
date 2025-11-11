import { Request, Response } from 'express'
import { FilesService } from '../services/FilesService.js'
import logger from '../utils/logger.js'

/**
 * Files Controller - Handles HTTP requests for file operations
 */
export class FilesController {
  private filesService: FilesService

  constructor() {
    this.filesService = new FilesService()
  }

  /**
   * List files and folders in a directory
   */
  listFiles = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestedPath = (req.query.path as string) || '/'
      const result = await this.filesService.listFiles(requestedPath)
      res.json(result)
    } catch (error: any) {
      this.handleError(error, res, 'listing files')
    }
  }

  /**
   * Read file content
   */
  readFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestedPath = req.query.path as string

      if (!requestedPath) {
        res.status(400).json({ error: 'Path parameter is required' })
        return
      }

      const result = await this.filesService.readFileContent(requestedPath)
      res.json(result)
    } catch (error: any) {
      this.handleError(error, res, 'reading file')
    }
  }

  /**
   * Save file content
   */
  saveFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { path: requestedPath, content } = req.body

      if (!requestedPath) {
        res.status(400).json({ error: 'Path parameter is required' })
        return
      }

      if (content === undefined) {
        res.status(400).json({ error: 'Content parameter is required' })
        return
      }

      const result = await this.filesService.saveFileContent(requestedPath, content)
      res.json(result)
    } catch (error: any) {
      this.handleError(error, res, 'saving file')
    }
  }

  /**
   * Create a new file
   */
  createFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { path: folderPath, name: fileName } = req.body

      if (!folderPath || !fileName) {
        res.status(400).json({ error: 'Path and name parameters are required' })
        return
      }

      const result = await this.filesService.createFile(folderPath, fileName)
      res.json(result)
    } catch (error: any) {
      this.handleError(error, res, 'creating file')
    }
  }

  /**
   * Create a new folder
   */
  createFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { path: parentPath, name: folderName } = req.body

      if (!parentPath || !folderName) {
        res.status(400).json({ error: 'Path and name parameters are required' })
        return
      }

      const result = await this.filesService.createFolder(parentPath, folderName)
      res.json(result)
    } catch (error: any) {
      this.handleError(error, res, 'creating folder')
    }
  }

  /**
   * Rename a file or folder
   */
  rename = async (req: Request, res: Response): Promise<void> => {
    try {
      const { path: oldPath, newName } = req.body

      if (!oldPath || !newName) {
        res.status(400).json({ error: 'Path and newName parameters are required' })
        return
      }

      const result = await this.filesService.renameItem(oldPath, newName)
      res.json(result)
    } catch (error: any) {
      this.handleError(error, res, 'renaming')
    }
  }

  /**
   * Delete a file or folder
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestedPath = req.query.path as string

      if (!requestedPath) {
        res.status(400).json({ error: 'Path parameter is required' })
        return
      }

      const result = await this.filesService.deleteItem(requestedPath)
      res.json(result)
    } catch (error: any) {
      this.handleError(error, res, 'deleting')
    }
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: any, res: Response, operation: string): void {
    logger.error(`Error ${operation}:`, error)

    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File or folder not found' })
      return
    }

    if (error.code === 'ENOTEMPTY' || error.code === 'EEXIST') {
      res.status(400).json({ error: 'Folder is not empty. Delete contents first.' })
      return
    }

    if (error.code === 'EACCES') {
      res.status(403).json({ error: 'Permission denied' })
      return
    }

    if (
      error.message.includes('Access denied') ||
      error.message.includes('not a file') ||
      error.message.includes('not a directory') ||
      error.message.includes('already exists')
    ) {
      res.status(400).json({ error: error.message })
      return
    }

    res.status(500).json({ error: 'Internal server error' })
  }
}
