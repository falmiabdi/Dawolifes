import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './utils/db.js'
import authRoutes from './routes/auth.js'
import propertyRoutes from './routes/properties.js'
import paymentRoutes from './routes/payments.js'
import uploadRoutes from './routes/upload.js'
import messageRoutes from './routes/messages.js'
import notificationRoutes from './routes/notifications.js'
import adminRoutes from './routes/admin.js'
import vehicleRoutes from './routes/vehicles.js'
import { setupWebSocket } from './ws/server.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:4000',
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ],
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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
async function start() {
  await connectDB()
  const server = app.listen(PORT, () => {
    console.log(`DawoLife API server running on port ${PORT}`)
  })
  setupWebSocket(server)
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
