import { Request, Response, NextFunction } from 'express'
import { AppError } from './AppError.js'
import logger from '../utils/logger.js'

/**
 * Error Handler Middleware
 * Centralized error handling for the entire application
 */
export class ErrorHandler {
  /**
   * Handle file system errors and convert to AppError
   */
  static handleFileSystemError(error: any): AppError {
    if (error.code === 'ENOENT') {
      return new AppError('File or folder not found', 404, 'ENOENT')
    }

    if (error.code === 'ENOTEMPTY' || error.code === 'EEXIST') {
      return new AppError('Folder is not empty. Delete contents first.', 400, 'ENOTEMPTY')
    }

    if (error.code === 'EACCES') {
      return new AppError('Permission denied', 403, 'EACCES')
    }

    return error
  }

  /**
   * Express error handling middleware
   */
  static middleware(err: Error | AppError, req: Request, res: Response, next: NextFunction): void {
    // Log error
    logger.error('Error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
    })

    // Handle AppError
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message,
        code: err.code,
      })
      return
    }

    // Handle file system errors
    const fsError = ErrorHandler.handleFileSystemError(err)
    if (fsError instanceof AppError) {
      res.status(fsError.statusCode).json({
        success: false,
        error: fsError.message,
        code: fsError.code,
      })
      return
    }

    // Handle unexpected errors
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
    })
  }

  /**
   * Wrap async route handlers to catch errors
   */
  static catchAsync(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next)
    }
  }
}
