import type { Server, Socket } from 'socket.io'
import terminalService from './terminal.service.js'
import type { ResizeData } from '../types/terminal.types.js'
import logger from '../utils/logger.js'

class WebSocketService {
  /**
   * Initialize WebSocket handlers
   */
  initialize(io: Server): void {
    io.on('connection', (socket: Socket) => {
      this.handleConnection(socket)
    })

    logger.info('WebSocket service initialized')
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: Socket): void {
    logger.info(`Client connected: ${socket.id}`)

    // Create terminal session
    const session = terminalService.createSession(socket)

    // Send welcome message
    this.sendWelcomeMessage(socket)

    // Setup PTY output listener
    session.pty.onData((data) => {
      socket.emit('output', data)
    })

    // Setup PTY exit listener
    session.pty.onExit(({ exitCode, signal }) => {
      logger.info(`PTY exited - Code: ${exitCode}, Signal: ${signal}`)
      socket.emit('output', `\r\n\r\n💀 Terminal session ended (exit code: ${exitCode})\r\n`)
      terminalService.closeSession(socket.id)
    })

    // Handle client events
    this.setupEventHandlers(socket)
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(socket: Socket): void {
    // Handle input from client
    socket.on('input', (data: string) => {
      terminalService.writeToTerminal(socket.id, data)
    })

    // Handle terminal resize
    socket.on('resize', (data: ResizeData) => {
      const { cols, rows } = data
      if (cols && rows) {
        terminalService.resizeTerminal(socket.id, { cols, rows })
      }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`)
      terminalService.closeSession(socket.id)
    })

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error)
    })
  }

  /**
   * Send welcome message to client
   */
  private sendWelcomeMessage(socket: Socket): void {
    socket.emit('output', '\r\n🚀 Welcome to Web-Based VPS Terminal\r\n')
    socket.emit('output', 'Type commands and see them execute in real-time!\r\n\r\n')
  }
}

// Export singleton instance
export const websocketService = new WebSocketService()
export default websocketService