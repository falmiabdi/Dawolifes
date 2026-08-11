import { Router } from 'express'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { isValidUuid } from '../utils/validation.js'
import { broadcastToAll } from '../ws/server.js'

const router = Router()

// Public: list announcements (no auth required so the /news page works for everyone)
router.get('/', async (_req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    res.json({ announcements })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch announcements' })
  }
})

// Admin: create an announcement
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' })
    }
    const announcement = await prisma.announcement.create({
      data: {
        title: String(title).trim(),
        content: String(content).trim(),
        authorId: req.user!.userId,
      },
    })
    broadcastToAll({ type: 'announcement', announcement })
    res.status(201).json({ message: 'Announcement created', announcement })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to create announcement' })
  }
})

// Admin: update an announcement
router.patch('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!isValidUuid(req.params.id)) {
      return res.status(404).json({ message: 'Announcement not found' })
    }
    const { title, content } = req.body
    if (!title && !content) {
      return res.status(400).json({ message: 'Nothing to update' })
    }
    const announcement = await prisma.announcement.update({
      where: { id: req.params.id },
      data: {
        ...(title ? { title: String(title).trim() } : {}),
        ...(content ? { content: String(content).trim() } : {}),
      },
    })
    broadcastToAll({ type: 'announcement', announcement })
    res.json({ message: 'Announcement updated', announcement })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update announcement' })
  }
})

// Admin: delete an announcement
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!isValidUuid(req.params.id)) {
      return res.status(404).json({ message: 'Announcement not found' })
    }
    await prisma.announcement.delete({ where: { id: req.params.id } })
    broadcastToAll({ type: 'announcement', announcementId: req.params.id })
    res.json({ message: 'Announcement deleted' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to delete announcement' })
  }
})

export default router
