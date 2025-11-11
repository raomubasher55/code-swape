import { Request, Response, NextFunction } from 'express'
import { FilesService } from '../services/files.service.js'
import { BadRequestError } from '../errors/AppError.js'
import { ErrorHandler } from '../errors/ErrorHandler.js'

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
  listFiles = ErrorHandler.catchAsync(async (req: Request, res: Response): Promise<void> => {
    const requestedPath = (req.query.path as string) || '/'
    const result = await this.filesService.listFiles(requestedPath)
    res.json(result)
  })

  /**
   * Read file content
   */
  readFile = ErrorHandler.catchAsync(async (req: Request, res: Response): Promise<void> => {
    const requestedPath = req.query.path as string
    if (!requestedPath) {
      throw new BadRequestError('Path parameter is required')
    }

    const result = await this.filesService.readFileContent(requestedPath)
    res.json(result)
  })

  /**
   * Save file content
   */
  saveFile = ErrorHandler.catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { path: requestedPath, content } = req.body

    if (!requestedPath) {
      throw new BadRequestError('Path parameter is required')
    }
    if (content === undefined) {
      throw new BadRequestError('Content parameter is required')
    }

    const result = await this.filesService.saveFileContent(requestedPath, content)
    res.json(result)
  })

  /**
   * Create a new file
   */
  createFile = ErrorHandler.catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { path: folderPath, name: fileName } = req.body

    if (!folderPath || !fileName) {
      throw new BadRequestError('Path and name parameters are required')
    }

    const result = await this.filesService.createFile(folderPath, fileName)
    res.json(result)
  })

  /**
   * Create a new folder
   */
  createFolder = ErrorHandler.catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { path: parentPath, name: folderName } = req.body

    if (!parentPath || !folderName) {
      throw new BadRequestError('Path and name parameters are required')
    }

    const result = await this.filesService.createFolder(parentPath, folderName)
    res.json(result)
  })

  /**
   * Rename a file or folder
   */
  rename = ErrorHandler.catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { path: oldPath, newName } = req.body

    if (!oldPath || !newName) {
      throw new BadRequestError('Path and newName parameters are required')
    }

    const result = await this.filesService.renameItem(oldPath, newName)
    res.json(result)
  })

  /**
   * Delete a file or folder
   */
  delete = ErrorHandler.catchAsync(async (req: Request, res: Response): Promise<void> => {
    const requestedPath = req.query.path as string

    if (!requestedPath) {
      throw new BadRequestError('Path parameter is required')
    }

    const result = await this.filesService.deleteItem(requestedPath)
    res.json(result)
  })
}
