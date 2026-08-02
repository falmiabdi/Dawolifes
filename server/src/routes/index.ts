import { Router } from 'express'
import authRoutes from './auth.js'
import propertyRoutes from './properties.js'
import paymentRoutes from './payments.js'
import uploadRoutes from './upload.js'
import messageRoutes from './messages.js'
import notificationRoutes from './notifications.js'
import adminRoutes from './admin.js'
import favoriteRoutes from './favorites.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/properties', propertyRoutes)
router.use('/payments', paymentRoutes)
router.use('/upload', uploadRoutes)
router.use('/messages', messageRoutes)
router.use('/notifications', notificationRoutes)
router.use('/admin', adminRoutes)
router.use('/favorites', favoriteRoutes)

export default router
