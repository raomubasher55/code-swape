export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  terminal: {
    shell: process.env.SHELL || '/bin/bash',
    cwd: process.env.HOME || '/root',
    defaultCols: 80,
    defaultRows: 24,
  },
} as const

export default config