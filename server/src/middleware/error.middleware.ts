import type { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger.js'

export interface ApiError extends Error {
  statusCode?: number
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  logger.error(`Error: ${message}`, {
    statusCode,
    path: req.path,
    method: req.method,
    stack: err.stack,
  })

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.path} not found`,
  })
}