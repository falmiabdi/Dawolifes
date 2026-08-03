import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB, sequelize } from './utils/db.js'
import authRoutes from './routes/auth.js'
import propertyRoutes from './routes/properties.js'
import paymentRoutes from './routes/payments.js'
import uploadRoutes from './routes/upload.js'
import messageRoutes from './routes/messages.js'
import notificationRoutes from './routes/notifications.js'
import adminRoutes from './routes/admin.js'
import vehicleRoutes from './routes/vehicles.js'
import agentRoutes from './routes/agent.js'
import favoriteRoutes from './routes/favorites.js'
import { setupWebSocket } from './ws/server.js'
import { errorHandler, notFoundHandler } from './middleware/error.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now()
  const timestamp = new Date().toLocaleTimeString()
  res.on("finish", () => {
    const ms = Date.now() - start
    const icon = res.statusCode < 400 ? "✅" : "❌"
    console.log(`[${timestamp}] ${icon} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`)
  })
  next()
})

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'capacitor://localhost',
  'http://localhost',
  'http://10.0.2.2',
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  process.env.FRONTEND_URL || '',
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(null, true)
    }
  },
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/agent', agentRoutes)
app.use('/api/favorites', favoriteRoutes)

// ── Payment gateway routes ─────────────────────────────────────────────────
import chapaRoutes from './routes/chapa.js'
import telebirrRoutes from './routes/telebirr.js'
app.use('/api/chapa', chapaRoutes)
app.use('/api/telebirr', telebirrRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  const dbState = sequelize ? 'connected' : 'disconnected'
  res.json({
    status: 'ok',
    db: dbState,
    timestamp: new Date().toISOString(),
  })
})

// Start server
async function start() {
  const db = await connectDB()
  if (!db) {
    console.error("FATAL: Database connection failed after retries. Exiting.")
    process.exit(1)
  }
  const server = app.listen(PORT, () => {
    console.log(`DawoLife API server running on port ${PORT} ✅ DB connected`)
  })
  setupWebSocket(server)

  // 404 + error handlers must be after all routes
  app.use(notFoundHandler)
  app.use(errorHandler)
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})