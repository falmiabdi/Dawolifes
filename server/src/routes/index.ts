import { Router } from 'express'
import authRoutes from './routes/auth.js'
import propertyRoutes from './routes/properties.js'
import paymentRoutes from './routes/payments.js'
import uploadRoutes from './routes/upload.js'
import messageRoutes from './routes/messages.js'
import notificationRoutes from './routes/notifications.js'
import adminRoutes from './routes/admin.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/properties', propertyRoutes)
router.use('/payments', paymentRoutes)
router.use('/upload', uploadRoutes)
router.use('/messages', messageRoutes)
router.use('/notifications', notificationRoutes)
router.use('/admin', adminRoutes)

export default router
