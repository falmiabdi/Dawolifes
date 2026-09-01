import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const router = Router()

// Register (upsert) the caller's FCM device token so they can receive push
// notifications. Sending the same token again just updates the platform.
router.post('/register', authMiddleware, async (req, res) => {
  try {
    const { token, platform = 'android' } = req.body ?? {}
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({ message: 'Device token is required' })
    }

    await prisma.deviceToken.upsert({
      where: { token },
      create: {
        userId: req.user!.userId,
        token,
        platform: String(platform).toLowerCase(),
      },
      update: {
        userId: req.user!.userId,
        platform: String(platform).toLowerCase(),
      },
    })

    res.json({ message: 'Device token registered' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to register device token' })
  }
})

// Remove a device token (e.g. on logout or when the token is invalidated).
router.delete('/:token', authMiddleware, async (req, res) => {
  try {
    await prisma.deviceToken.deleteMany({
      where: { token: req.params.token, userId: req.user!.userId },
    })
    res.json({ message: 'Device token removed' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to remove device token' })
  }
})

export default router