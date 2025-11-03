import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { spawn } from 'node-pty'
import { IPty } from 'node-pty'

const app = express()
const server = createServer(app)

// Configure CORS for Socket.IO
const allowedOrigins = process.env.CORS_ORIGIN
  ? [process.env.CORS_ORIGIN, "http://localhost:5173"]
  : ["http://localhost:5173"]

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
})

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))

app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'VPS Terminal Server is running' })
})

// Store active terminal sessions
const terminals = new Map<string, IPty>()

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  // Spawn a new PTY session for this client
  const ptyProcess = spawn('/bin/bash', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME || '/root',
    env: process.env,
  })

  // Store the terminal session
  terminals.set(socket.id, ptyProcess)

  // Send initial welcome message
  socket.emit('output', '\r\n🚀 Welcome to Web-Based VPS Terminal\r\n')
  socket.emit('output', 'Type commands and see them execute in real-time!\r\n\r\n')

  // Handle PTY output - send to client
  ptyProcess.onData((data) => {
    socket.emit('output', data)
  })

  // Handle PTY exit
  ptyProcess.onExit(({ exitCode, signal }) => {
    console.log(`PTY process exited with code ${exitCode}, signal ${signal}`)
    socket.emit('output', `\r\n\r\n💀 Terminal session ended (exit code: ${exitCode})\r\n`)
    terminals.delete(socket.id)
  })

  // Handle client input - send to PTY
  socket.on('input', (data: string) => {
    if (terminals.has(socket.id)) {
      ptyProcess.write(data)
    }
  })

  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
    if (terminals.has(socket.id)) {
      const ptyProcess = terminals.get(socket.id)!
      ptyProcess.kill()
      terminals.delete(socket.id)
    }
  })

  // Handle terminal resize
  socket.on('resize', ({ cols, rows }: { cols: number; rows: number }) => {
    if (terminals.has(socket.id)) {
      ptyProcess.resize(cols, rows)
    }
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`🚀 VPS Terminal Server running on port ${PORT}`)
  console.log(`🌐 CORS enabled for http://localhost:5173`)
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`)
})