import type { Socket } from 'socket.io'
import type { IPty } from 'node-pty'

export interface TerminalSession {
  id: string
  pty: IPty
  socket: Socket
  createdAt: Date
}

export interface ResizeData {
  cols: number
  rows: number
}

export interface TerminalInput {
  data: string
}

export interface TerminalOutput {
  data: string
  timestamp?: Date
}

export interface HealthResponse {
  status: 'ok' | 'error'
  message: string
  uptime?: number
  activeSessions?: number
}