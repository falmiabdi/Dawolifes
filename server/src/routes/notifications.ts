import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { NotificationModel } from '../models/Notification.js'

const router = Router()

// Get notifications for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await NotificationModel.find({ userId: req.user!.userId })
      .sort({ createdAt: -1 })
      .limit(50)
    res.json({ notifications })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch notifications' })
  }
})

// Create notification
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, body, type, data } = req.body
    if (!title || !body || !type) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const notification = new NotificationModel({
      userId: req.user!.userId,
      title,
      body,
      type,
      data,
    })
    await notification.save()

    res.status(201).json({ message: 'Notification created', notification })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to create notification' })
  }
})

// Mark all notifications as read
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    await NotificationModel.updateMany(
      { userId: req.user!.userId, read: false },
      { $set: { read: true } }
    )
    res.json({ message: 'All notifications marked as read' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update notifications' })
  }
})

// Mark single notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await NotificationModel.findById(req.params.id)
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }
    notification.read = true
    await notification.save()
    res.json({ message: 'Notification marked as read' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update notification' })
  }
})

export default router
