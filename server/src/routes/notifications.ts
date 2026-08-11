import { Router } from 'express'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { isValidUuid } from '../utils/validation.js'

const router = Router()

// Notifications are auto-deleted 24h after being read. The cron-style cleanup
// below removes them on a schedule; the query filter is a defensive safety net
// so expired notifications can never leak into a fetch even if the cleanup is
// late (e.g. server was down during a tick).
const READ_NOTIFICATION_TTL_MS = 24 * 60 * 60 * 1000

export const notificationsRetentionCutoff = () => new Date(Date.now() - READ_NOTIFICATION_TTL_MS)

/**
 * Deletes notifications whose `readAt` is older than 24 hours. Called by the
 * server on a background interval (see index.ts). Re-entrant safe: concurrent
 * runs simply delete fewer rows.
 */
export async function cleanupExpiredNotifications(): Promise<number> {
  try {
    const result = await prisma.notification.deleteMany({
      where: { readAt: { lt: notificationsRetentionCutoff() } },
    })
    if (result.count > 0) {
      console.log(`[notifications] Cleaned up ${result.count} expired notification(s)`)
    }
    return result.count
  } catch (err) {
    console.error('[notifications] Cleanup failed:', err)
    return 0
  }
}

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000
let cleanupStarted = false

/** Starts the periodic 24h-expiry cleanup. Safe to call multiple times. */
export function startNotificationCleanup() {
  if (cleanupStarted) return
  cleanupStarted = true
  const timer = setInterval(() => {
    cleanupExpiredNotifications()
  }, CLEANUP_INTERVAL_MS)
  timer.unref()
}

// Get notifications for current user (excluding those expired past the 24h TTL)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user!.userId,
        OR: [{ readAt: null }, { readAt: { gte: notificationsRetentionCutoff() } }],
      },
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
      data: { read: true, readAt: new Date() },
    })
    res.json({ message: 'All notifications marked as read' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update notifications' })
  }
})

// Mark single notification as read (owner only)
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    if (!isValidUuid(req.params.id)) {
      return res.status(404).json({ message: 'Notification not found' })
    }
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } })
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }
    if (notification.userId !== req.user!.userId) {
      return res.status(403).json({ message: 'Not authorized' })
    }
    await prisma.notification.update({ where: { id: req.params.id }, data: { read: true, readAt: new Date() } })
    res.json({ message: 'Notification marked as read' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update notification' })
  }
})

// Admin: list all notifications (any user)
router.get('/admin', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    res.json({ notifications })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch notifications' })
  }
})

// Admin: send a notification to all users (optionally filtered by role)
router.post('/admin', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, body, type = 'system', role } = req.body
    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required' })
    }
    const users = await prisma.user.findMany({
      where: role ? { role } : {},
      select: { id: true },
    })
    if (users.length === 0) {
      return res.json({ message: 'Notification sent', sent: 0 })
    }
    const created = await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        title,
        body,
        type,
      })),
    })
    res.status(201).json({ message: 'Notification sent', sent: created.count })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to send notification' })
  }
})

// Admin: delete any notification
router.delete('/admin/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (!isValidUuid(req.params.id)) {
      return res.status(404).json({ message: 'Notification not found' })
    }
    await prisma.notification.delete({ where: { id: req.params.id } })
    res.json({ message: 'Notification deleted' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to delete notification' })
  }
})

export default router
