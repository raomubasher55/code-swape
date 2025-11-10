import type { CorsOptions } from 'cors'
import config from './env.js'

export const corsOptions: CorsOptions = {
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

export default corsOptions