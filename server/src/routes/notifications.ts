import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { NotificationModel } from '../models/index.js'

const router = Router()

// Get notifications for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await NotificationModel.findAll({
      where: { userId: req.user!.userId },
      order: [['createdAt', 'DESC']],
      limit: 50,
    })
    res.json({ notifications })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch notifications' })
  }
})

// Get unread notification count
router.get('/count', authMiddleware, async (req, res) => {
  try {
    const count = await NotificationModel.count({
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

    const notification = await NotificationModel.create({
      userId: req.user!.userId,
      title,
      body,
      type,
      data,
    } as any)

    res.status(201).json({ message: 'Notification created', notification })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to create notification' })
  }
})

// Mark all notifications as read
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    await NotificationModel.update(
      { read: true },
      { where: { userId: req.user!.userId, read: false } }
    )
    res.json({ message: 'All notifications marked as read' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update notifications' })
  }
})

// Mark single notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await NotificationModel.findByPk(req.params.id)
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }
    await notification.update({ read: true })
    res.json({ message: 'Notification marked as read' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update notification' })
  }
})

export default router
