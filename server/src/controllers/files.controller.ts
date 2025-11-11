import { Request, Response } from 'express'
import * as filesService from '../services/files.service.js'
import logger from '../utils/logger.js'

/**
 * List files and folders in a directory
 */
export async function listFilesHandler(req: Request, res: Response) {
  try {
    const requestedPath = (req.query.path as string) || '/'
    const result = await filesService.listFiles(requestedPath)
    res.json(result)
  } catch (error: any) {
    handleError(error, res, 'listing files')
  }
}

/**
 * Read file content
 */
export async function readFileHandler(req: Request, res: Response) {
  try {
    const requestedPath = req.query.path as string

    if (!requestedPath) {
      return res.status(400).json({ error: 'Path parameter is required' })
    }

    const result = await filesService.readFileContent(requestedPath)
    res.json(result)
  } catch (error: any) {
    handleError(error, res, 'reading file')
  }
}

/**
 * Save file content
 */
export async function saveFileHandler(req: Request, res: Response) {
  try {
    const { path: requestedPath, content } = req.body

    if (!requestedPath) {
      return res.status(400).json({ error: 'Path parameter is required' })
    }

    if (content === undefined) {
      return res.status(400).json({ error: 'Content parameter is required' })
    }

    const result = await filesService.saveFileContent(requestedPath, content)
    res.json(result)
  } catch (error: any) {
    handleError(error, res, 'saving file')
  }
}

/**
 * Create a new file
 */
export async function createFileHandler(req: Request, res: Response) {
  try {
    const { path: folderPath, name: fileName } = req.body

    if (!folderPath || !fileName) {
      return res.status(400).json({ error: 'Path and name parameters are required' })
    }

    const result = await filesService.createFile(folderPath, fileName)
    res.json(result)
  } catch (error: any) {
    handleError(error, res, 'creating file')
  }
}

/**
 * Create a new folder
 */
export async function createFolderHandler(req: Request, res: Response) {
  try {
    const { path: parentPath, name: folderName } = req.body

    if (!parentPath || !folderName) {
      return res.status(400).json({ error: 'Path and name parameters are required' })
    }

    const result = await filesService.createFolder(parentPath, folderName)
    res.json(result)
  } catch (error: any) {
    handleError(error, res, 'creating folder')
  }
}

/**
 * Rename a file or folder
 */
export async function renameHandler(req: Request, res: Response) {
  try {
    const { path: oldPath, newName } = req.body

    if (!oldPath || !newName) {
      return res.status(400).json({ error: 'Path and newName parameters are required' })
    }

    const result = await filesService.renameItem(oldPath, newName)
    res.json(result)
  } catch (error: any) {
    handleError(error, res, 'renaming')
  }
}

/**
 * Delete a file or folder
 */
export async function deleteHandler(req: Request, res: Response) {
  try {
    const requestedPath = req.query.path as string

    if (!requestedPath) {
      return res.status(400).json({ error: 'Path parameter is required' })
    }

    const result = await filesService.deleteItem(requestedPath)
    res.json(result)
  } catch (error: any) {
    handleError(error, res, 'deleting')
  }
}

/**
 * Handle errors consistently
 */
function handleError(error: any, res: Response, operation: string) {
  logger.error(`Error ${operation}:`, error)

  if (error.code === 'ENOENT') {
    return res.status(404).json({ error: 'File or folder not found' })
  }

  if (error.code === 'ENOTEMPTY' || error.code === 'EEXIST') {
    return res.status(400).json({ error: 'Folder is not empty. Delete contents first.' })
  }

  if (error.code === 'EACCES') {
    return res.status(403).json({ error: 'Permission denied' })
  }

  if (error.message.includes('Access denied') || error.message.includes('not a file') || error.message.includes('not a directory') || error.message.includes('already exists')) {
    return res.status(400).json({ error: error.message })
  }

  res.status(500).json({ error: 'Internal server error' })
}
