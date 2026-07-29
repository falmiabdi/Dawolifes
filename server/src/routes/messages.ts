import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { MessageModel } from '../models/index.js'

const router = Router()

// Get messages for a property
router.get('/:propertyId', authMiddleware, async (req, res) => {
  try {
    const messages = await MessageModel.findAll({
      where: { propertyId: req.params.propertyId },
      order: [['createdAt', 'ASC']],
    })
    res.json({ messages })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch messages' })
  }
})

// Send a message
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { propertyId, recipientId, recipientName, content } = req.body

    if (!propertyId || !recipientId || !content) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const msgDoc = await MessageModel.create({
      propertyId,
      senderId: req.user!.userId,
      senderName: req.user!.email,
      senderRole: req.user!.role,
      recipientId,
      recipientName,
      content,
    } as any)

    res.status(201).json({ message: 'Message sent', data: msgDoc })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to send message' })
  }
})

// Mark message as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const message = await MessageModel.findByPk(req.params.id)
    if (!message) {
      return res.status(404).json({ message: 'Message not found' })
    }
    await message.update({ read: true })
    res.json({ message: 'Message marked as read' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update message' })
  }
})

export default router
