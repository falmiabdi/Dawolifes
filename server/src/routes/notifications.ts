import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const router = Router()

// Get notifications for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json({ notifications })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch notifications' })
  }
})

// Get unread notification count
router.get('/count', authMiddleware, async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user!.userId, read: false },
    })
    res.json({ count })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to get count' })
  }
})

// Create notification
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, body, type, data } = req.body
    if (!title || !body || !type) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const notification = await prisma.notification.create({
      data: {
        userId: req.user!.userId,
        title,
        body,
        type,
        data,
      },
    })

    res.status(201).json({ message: 'Notification created', notification })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to create notification' })
  }
})

// Mark all notifications as read
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, read: false },
      data: { read: true },
    })
    res.json({ message: 'All notifications marked as read' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update notifications' })
  }
})

// Mark single notification as read (owner only)
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } })
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }
    if (notification.userId !== req.user!.userId) {
      return res.status(403).json({ message: 'Not authorized' })
    }
    await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } })
    res.json({ message: 'Notification marked as read' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update notification' })
  }
})

export default router
