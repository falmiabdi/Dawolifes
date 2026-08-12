import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB, prisma } from './utils/db.js'
import { withPrismaRetry, startKeepAlive } from './lib/prisma.js'
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
import chapaRoutes from './routes/chapa.js'
import telebirrRoutes from './routes/telebirr.js'
import announcementRoutes from './routes/announcements.js'
import { startNotificationCleanup } from './routes/notifications.js'
import { setupWebSocket } from './ws/server.js'
import { errorHandler, notFoundHandler } from './middleware/error.js'
import { readSmtpConfig } from './services/mail.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Request logging middleware (path only — never log query strings which can
// contain payment references or verification codes).
app.use((req, res, next) => {
  const start = Date.now()
  const path = (req.originalUrl || req.url || '/').split('?')[0]
  res.on('finish', () => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${path} ${res.statusCode} ${Date.now() - start}ms`)
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
  'https://dawolifes.vercel.app',
].filter(Boolean)

const allowAllOrigins = process.env.ALLOW_ALL_ORIGINS === 'true'

app.use(cors({
  origin: (origin, callback) => {
    if (allowAllOrigins || !origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
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
app.use('/api/chapa', chapaRoutes)
app.use('/api/telebirr', telebirrRoutes)
app.use('/api/announcements', announcementRoutes)

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'DawoLife API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      properties: '/api/properties',
      vehicles: '/api/vehicles',
      messages: '/api/messages',
      notifications: '/api/notifications',
      payments: '/api/payments',
      chapa: '/api/chapa/*',
      telebirr: '/api/telebirr/*',
      agent: '/api/agent/*',
      admin: '/api/admin/*',
      favorites: '/api/favorites',
      upload: '/api/upload',
      announcements: '/api/announcements',
    },
  })
})

// Health check
app.get('/api/health', async (_req, res) => {
  let dbState = 'disconnected'
  try {
    await withPrismaRetry(() => prisma.$queryRaw`SELECT 1`)
    dbState = 'connected'
  } catch {
    dbState = 'disconnected'
  }
  res.status(dbState === 'connected' ? 200 : 503).json({
    status: dbState === 'connected' ? 'ok' : 'degraded',
    db: dbState,
    timestamp: new Date().toISOString(),
  })
})

// Start server
async function start() {
  const db = await connectDB()
  if (db) {
    startKeepAlive()
  }

  // 404 + error handlers must be LAST after all routes
  app.use(notFoundHandler)
  app.use(errorHandler)

  const server = app.listen(PORT, () => {
    console.log(`DawoLife API server running on port ${PORT} ✅`)

    const smtp = readSmtpConfig()
    if (smtp) {
      console.log(`Email transport: SMTP via ${smtp.host}:${smtp.port} from ${smtp.fromEmail}`)
    } else if (process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY) {
      console.log('Email transport: Brevo REST API (SMTP not configured — set SMTP_NAME/SMTP_USER/SMTP_PASSWORD/SMTP_EMAIL)')
    } else {
      console.log('Email transport: NOT CONFIGURED — emails will be skipped (set SMTP vars or BREVO_API_KEY)')
    }

    // Prevent Render free-tier from spinning down the web server after 15 min
    // of inactivity. A self-ping every 5 min keeps the instance warm.
    const selfUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`
    setInterval(() => {
      fetch(`${selfUrl}/api/health`).catch(() => {})
    }, 5 * 60 * 1000).unref()
  })
  setupWebSocket(server)
  startNotificationCleanup()
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
