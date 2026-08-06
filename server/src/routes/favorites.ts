import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { SavedItemType } from '@prisma/client'
import { isValidUuid } from '../utils/validation.js'

const router = Router()

const agentSelect = { id: true, username: true, email: true, phone: true, profilePhoto: true }

router.get('/', authMiddleware, async (req, res) => {
  try {
    const saved = await prisma.savedItem.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    })

    const items = []
    for (const row of saved) {
      const { itemType, itemId } = row
      let item: any = null

      if (itemType === 'property') {
        item = await prisma.property.findUnique({
          where: { id: itemId },
          include: { agent: { select: agentSelect } },
        })
      } else if (itemType === 'vehicle') {
        item = await prisma.vehicle.findUnique({
          where: { id: itemId },
          include: { agent: { select: agentSelect } },
        })
      }

      if (!item) continue

      const { status } = item
      if (status && status !== 'Approved') continue

      items.push({
        itemType,
        itemId,
        savedAt: row.createdAt,
        item,
      })
    }

    res.json({ items })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch saved items' })
  }
})

// Check whether a specific item is saved
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const { itemType, itemId } = req.query
    if (!itemType || !itemId) {
      return res.status(400).json({ message: 'Missing itemType or itemId' })
    }
    const exists = await prisma.savedItem.findUnique({
      where: {
        userId_itemType_itemId: {
          userId: req.user!.userId,
          itemType: String(itemType) as SavedItemType,
          itemId: String(itemId),
        },
      },
    })
    res.json({ saved: !!exists })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to check saved status' })
  }
})

// Save an item
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { itemType, itemId } = req.body
    if (!['property', 'vehicle'].includes(itemType)) {
      return res.status(400).json({ message: 'itemType must be "property" or "vehicle"' })
    }
    if (!itemId) {
      return res.status(400).json({ message: 'itemId is required' })
    }
    if (!isValidUuid(itemId)) {
      return res.status(400).json({ message: 'itemId must be a valid id' })
    }

    const item: any =
      itemType === 'property'
        ? await prisma.property.findUnique({ where: { id: itemId } })
        : await prisma.vehicle.findUnique({ where: { id: itemId } })

    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }

    const userId = req.user!.userId
    const typedItemType = itemType as SavedItemType

    const existing = await prisma.savedItem.findUnique({
      where: { userId_itemType_itemId: { userId, itemType: typedItemType, itemId } },
    })

    let savedItem
    if (existing) {
      savedItem = existing
    } else {
      savedItem = await prisma.savedItem.create({
        data: { userId, itemType: typedItemType, itemId },
      })
      if (itemType === 'vehicle') {
        const favorites = Number(item.favorites || 0)
        await prisma.vehicle.update({ where: { id: itemId }, data: { favorites: favorites + 1 } })
      }
    }

    res.status(201).json({ message: 'Item saved', saved: true, savedItem })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to save item' })
  }
})

// Remove a saved item
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const { itemType, itemId } = req.body
    if (!itemType || !itemId) {
      return res.status(400).json({ message: 'Missing itemType or itemId' })
    }
    if (!isValidUuid(itemId)) {
      return res.status(400).json({ message: 'itemId must be a valid id' })
    }

    const deleted = await prisma.savedItem.deleteMany({
      where: { userId: req.user!.userId, itemType: itemType as SavedItemType, itemId },
    })

    if (deleted.count > 0 && itemType === 'vehicle') {
      const item: any = await prisma.vehicle.findUnique({ where: { id: itemId } })
      if (item) {
        const favorites = Number(item.favorites || 0)
        await prisma.vehicle.update({ where: { id: itemId }, data: { favorites: Math.max(0, favorites - 1) } })
      }
    }

    res.json({ message: 'Item removed', saved: false })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to remove item' })
  }
})

export default router
