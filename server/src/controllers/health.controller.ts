import type { Request, Response } from 'express'
import type { HealthResponse } from '../types/terminal.types.js'
import terminalService from '../services/terminal.service.js'

class HealthController {
  /**
   * Health check endpoint
   */
  check(req: Request, res: Response<HealthResponse>): void {
    const uptime = Math.floor(process.uptime())
    const activeSessions = terminalService.getActiveSessionCount()

    res.json({
      status: 'ok',
      message: 'VPS Terminal Server is running',
      uptime,
      activeSessions,
    })
  }

  /**
   * Detailed status endpoint
   */
  status(req: Request, res: Response): void {
    res.json({
      status: 'ok',
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        pid: process.pid,
        nodeVersion: process.version,
      },
      terminal: {
        activeSessions: terminalService.getActiveSessionCount(),
      },
    })
  }
}

export const healthController = new HealthController()
export default healthController