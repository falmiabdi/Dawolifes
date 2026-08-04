import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const router = Router()

// Unread message count for the current user (must be before /:propertyId)
router.get('/unread', authMiddleware, async (req, res) => {
  try {
    const count = await prisma.message.count({
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
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ recipientId: userId }, { senderId: userId }],
      },
      orderBy: { createdAt: 'desc' },
    })

    const propertyIds = [...new Set(messages.map((m) => m.propertyId))]
    const properties: Record<string, string> = {}
    if (propertyIds.length > 0) {
      const rows = await prisma.property.findMany({
        where: { id: { in: propertyIds } },
        select: { id: true, title: true },
      })
      for (const row of rows) {
        properties[row.id] = row.title
      }
    }

    const userIds = new Set<string>()
    for (const m of messages) {
      userIds.add(m.senderId)
      userIds.add(m.recipientId)
    }
    const users: Record<string, { name: string; phone?: string | null; profilePhoto?: string | null }> = {}
    if (userIds.size > 0) {
      const rows = await prisma.user.findMany({
        where: { id: { in: [...userIds] } },
        select: { id: true, username: true, phone: true, profilePhoto: true },
      })
      for (const row of rows) {
        users[row.id] = {
          name: row.username,
          phone: row.phone,
          profilePhoto: row.profilePhoto,
        }
      }
    }

    const serialized = messages.map((m) => ({
      id: m.id,
      propertyId: m.propertyId,
      propertyTitle: properties[m.propertyId] || 'Listing',
      senderId: m.senderId,
      senderName: m.senderName,
      senderRole: m.senderRole,
      recipientId: m.recipientId,
      recipientName: m.recipientName,
      content: m.content,
      read: m.read,
      createdAt: m.createdAt,
    }))

    res.json({ messages: serialized, users })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch inbox' })
  }
})

// Get messages for a property
router.get('/:propertyId', authMiddleware, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { propertyId: req.params.propertyId },
      orderBy: { createdAt: 'asc' },
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

    const msgDoc = await prisma.message.create({
      data: {
        propertyId,
        senderId: req.user!.userId,
        senderName: req.user!.email,
        senderRole: req.user!.role,
        recipientId,
        recipientName,
        content,
      },
    })

    res.status(201).json({ message: 'Message sent', data: msgDoc })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to send message' })
  }
})

// Mark message as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const message = await prisma.message.findUnique({ where: { id: req.params.id } })
    if (!message) {
      return res.status(404).json({ message: 'Message not found' })
    }
    await prisma.message.update({ where: { id: req.params.id }, data: { read: true } })
    res.json({ message: 'Message marked as read' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update message' })
  }
})

export default router
