import { spawn, IPty } from 'node-pty'
import type { Socket } from 'socket.io'
import type { TerminalSession, ResizeData } from '../types/terminal.types'
import config from '../config/env'
import logger from '../utils/logger'

class TerminalService {
  private sessions: Map<string, TerminalSession> = new Map()

  /**
   * Create a new terminal session for a socket connection
   */
  createSession(socket: Socket): TerminalSession {
    logger.info(`Creating new terminal session for socket: ${socket.id}`)

    const pty = spawn(config.terminal.shell, [], {
      name: 'xterm-color',
      cols: config.terminal.defaultCols,
      rows: config.terminal.defaultRows,
      cwd: config.terminal.cwd,
      env: process.env as { [key: string]: string },
    })

    const session: TerminalSession = {
      id: socket.id,
      pty,
      socket,
      createdAt: new Date(),
    }

    this.sessions.set(socket.id, session)
    logger.debug(`Active sessions: ${this.sessions.size}`)

    return session
  }

  /**
   * Get a session by socket ID
   */
  getSession(socketId: string): TerminalSession | undefined {
    return this.sessions.get(socketId)
  }

  /**
   * Write input to a terminal session
   */
  writeToTerminal(socketId: string, data: string): boolean {
    const session = this.sessions.get(socketId)
    if (!session) {
      logger.warn(`Session not found for socket: ${socketId}`)
      return false
    }

    try {
      session.pty.write(data)
      return true
    } catch (error) {
      logger.error(`Error writing to terminal: ${error}`)
      return false
    }
  }

  /**
   * Resize a terminal session
   */
  resizeTerminal(socketId: string, { cols, rows }: ResizeData): boolean {
    const session = this.sessions.get(socketId)
    if (!session) {
      logger.warn(`Session not found for resize: ${socketId}`)
      return false
    }

    try {
      session.pty.resize(cols, rows)
      logger.debug(`Terminal resized to ${cols}x${rows}`)
      return true
    } catch (error) {
      logger.error(`Error resizing terminal: ${error}`)
      return false
    }
  }

  /**
   * Close a terminal session
   */
  closeSession(socketId: string): void {
    const session = this.sessions.get(socketId)
    if (!session) {
      logger.warn(`Session not found for closing: ${socketId}`)
      return
    }

    try {
      session.pty.kill()
      this.sessions.delete(socketId)
      logger.info(`Session closed for socket: ${socketId}`)
      logger.debug(`Active sessions: ${this.sessions.size}`)
    } catch (error) {
      logger.error(`Error closing session: ${error}`)
    }
  }

  /**
   * Get the number of active sessions
   */
  getActiveSessionCount(): number {
    return this.sessions.size
  }

  /**
   * Clean up all sessions (for graceful shutdown)
   */
  cleanup(): void {
    logger.info('Cleaning up all terminal sessions...')
    this.sessions.forEach((session) => {
      try {
        session.pty.kill()
      } catch (error) {
        logger.error(`Error during cleanup: ${error}`)
      }
    })
    this.sessions.clear()
    logger.info('All sessions cleaned up')
  }
}

// Export singleton instance
export const terminalService = new TerminalService()
export default terminalService