import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

// Configuration
import config from './config/env'
import corsOptions from './config/cors'

// Routes
import routes from './routes'

// Services
import websocketService from './services/websocket.service'
import terminalService from './services/terminal.service'

// Middleware
import { errorHandler, notFoundHandler } from './middleware/error.middleware'

// Utils
import logger from './utils/logger'

// Initialize Express app
const app = express()
const server = createServer(app)

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// Middleware
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/', routes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// Initialize WebSocket service
websocketService.initialize(io)

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing server...')

  server.close(() => {
    logger.info('HTTP server closed')
    terminalService.cleanup()
    process.exit(0)
  })

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

// Start server
server.listen(config.port, () => {
  logger.info(`🚀 VPS Terminal Server running on port ${config.port}`)
  logger.info(`🌐 CORS enabled for ${config.cors.origin}`)
  logger.info(`📡 WebSocket endpoint: ws://localhost:${config.port}`)
  logger.info(`🔧 Environment: ${config.nodeEnv}`)
})

export { app, server, io }