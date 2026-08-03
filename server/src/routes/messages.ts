import { Router } from 'express'
import { Op } from 'sequelize'
import { authMiddleware } from '../middleware/auth.js'
import { MessageModel, PropertyModel, UserModel } from '../models/index.js'

const router = Router()

// Unread message count for the current user (must be before /:propertyId)
router.get('/unread', authMiddleware, async (req, res) => {
  try {
    const count = await MessageModel.count({
      where: { recipientId: req.user!.userId, read: false },
    })
    res.json({ count })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch unread count' })
  }
})

// Inbox for the current user
router.get('/inbox', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId
    const messages = await MessageModel.findAll({
      where: {
        [Op.or]: [{ recipientId: userId }, { senderId: userId }],
      },
      order: [['createdAt', 'DESC']],
    })

    const propertyIds = [...new Set(messages.map((m) => m.getDataValue('propertyId')))]
    const properties: Record<string, string> = {}
    if (propertyIds.length > 0) {
      const rows = await PropertyModel.findAll({
        where: { id: { [Op.in]: propertyIds } },
        attributes: ['id', 'title'],
      })
      for (const row of rows) {
        properties[row.getDataValue('id')] = row.getDataValue('title')
      }
    }

    const userIds = new Set<string>()
    for (const m of messages) {
      userIds.add(m.getDataValue('senderId'))
      userIds.add(m.getDataValue('recipientId'))
    }
    const users: Record<string, { name: string; phone?: string | null; profilePhoto?: string | null }> = {}
    if (userIds.size > 0) {
      const rows = await UserModel.findAll({
        where: { id: { [Op.in]: [...userIds] } },
        attributes: ['id', 'username', 'phone', 'profilePhoto'],
      })
      for (const row of rows) {
        users[row.getDataValue('id')] = {
          name: row.getDataValue('username'),
          phone: row.getDataValue('phone'),
          profilePhoto: row.getDataValue('profilePhoto'),
        }
      }
    }

    const serialized = messages.map((m) => ({
      id: m.getDataValue('id'),
      propertyId: m.getDataValue('propertyId'),
      propertyTitle: properties[m.getDataValue('propertyId')] || 'Listing',
      senderId: m.getDataValue('senderId'),
      senderName: m.getDataValue('senderName'),
      senderRole: m.getDataValue('senderRole'),
      recipientId: m.getDataValue('recipientId'),
      recipientName: m.getDataValue('recipientName'),
      content: m.getDataValue('content'),
      read: m.getDataValue('read'),
      createdAt: m.getDataValue('createdAt'),
    }))

    res.json({ messages: serialized, users })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch inbox' })
  }
})

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
