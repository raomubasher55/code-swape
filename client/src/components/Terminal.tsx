import { useEffect, useRef } from 'react'
import { Terminal as XTerminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { setConnected, addOutput } from '../store/terminalSlice'
import { io, Socket } from 'socket.io-client'

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerminal | undefined>(undefined)
  const fitAddonRef = useRef<FitAddon | undefined>(undefined)
  const socketRef = useRef<Socket | undefined>(undefined)

  const { theme, fontSize, isConnected } = useSelector((state: RootState) => state.terminal)
  const dispatch = useDispatch()

  useEffect(() => {
    if (!terminalRef.current) return

    // Create xterm instance
    const xterm = new XTerminal({
      theme: {
        background: theme === 'dark' ? '#0a0a0a' : '#ffffff',
        foreground: theme === 'dark' ? '#ffffff' : '#000000',
        cursor: theme === 'dark' ? '#ffffff' : '#000000',
      },
      fontSize,
      fontFamily: '"Fira Code", "Monaco", "Menlo", "Ubuntu Mono", monospace',
      cursorBlink: true,
      cols: 80,
      rows: 24,
    })

    // Add addons
    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    xterm.loadAddon(fitAddon)
    xterm.loadAddon(webLinksAddon)

    // Open terminal
    xterm.open(terminalRef.current)
    fitAddon.fit()

    // Store refs
    xtermRef.current = xterm
    fitAddonRef.current = fitAddon

    // Connect to WebSocket
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'
    const socket = io(wsUrl)
    socketRef.current = socket

    socket.on('connect', () => {
      dispatch(setConnected(true))
      xterm.writeln('🚀 Connected to VPS Terminal')
      xterm.write('$ ')
    })

    socket.on('disconnect', () => {
      dispatch(setConnected(false))
      xterm.writeln('\r\n❌ Disconnected from server')
    })

    socket.on('output', (data: string) => {
      xterm.write(data)
      dispatch(addOutput(data))
    })

    // Handle user input
    xterm.onData((data) => {
      if (socket.connected) {
        socket.emit('input', data)
      }
    })

    // Handle resize
    const handleResize = () => {
      fitAddon.fit()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      socket.disconnect()
      xterm.dispose()
      window.removeEventListener('resize', handleResize)
    }
  }, [theme, fontSize, dispatch])

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="text-sm text-gray-400">VPS Terminal</div>
      </div>
      <div
        ref={terminalRef}
        className="h-full p-4 terminal-container"
        style={{ height: 'calc(100% - 60px)' }}
      />
    </div>
  )
}