import { Request, Response, NextFunction } from 'express'
import { join, normalize, relative } from 'path'

const BASE_PATH = '/root/projects'

/**
 * Validate and normalize path to prevent directory traversal attacks
 */
export function validatePath(requestedPath: string): string {
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
 * Express middleware to validate path parameter
 */
export function validatePathMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const requestedPath = (req.query.path as string) || (req.body.path as string) || '/'
    req.body.validatedPath = validatePath(requestedPath)
    next()
  } catch (error: any) {
    res.status(403).json({ error: error.message })
  }
}

export { BASE_PATH }
