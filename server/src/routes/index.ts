import { Router } from 'express'
import healthController from '../controllers/health.controller'

const router = Router()

// Health check routes
router.get('/health', healthController.check.bind(healthController))
router.get('/status', healthController.status.bind(healthController))

// API info route
router.get('/', (req, res) => {
  res.json({
    name: 'VPS Terminal API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      status: '/status',
      websocket: 'ws://localhost:3001',
    },
  })
})

export default router