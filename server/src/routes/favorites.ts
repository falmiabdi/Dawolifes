import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { SavedItemModel, PropertyModel, VehicleModel, UserModel } from '../models/index.js'

const router = Router()

const agentInclude = { model: UserModel, as: 'agent', attributes: ['id', 'username', 'email', 'phone', 'profilePhoto'] }

router.get('/', authMiddleware, async (req, res) => {
  try {
    const saved = await SavedItemModel.findAll({
      where: { userId: req.user!.userId },
      order: [['createdAt', 'DESC']],
    })

    const items = []
    for (const row of saved) {
      const itemType = row.getDataValue('itemType')
      const itemId = row.getDataValue('itemId')
      let item: any = null

      if (itemType === 'property') {
        item = await PropertyModel.findByPk(itemId, { include: [agentInclude] })
      } else if (itemType === 'vehicle') {
        item = await VehicleModel.findByPk(itemId, { include: [agentInclude] })
      }

      if (!item) continue

      const status = item.getDataValue('status')
      if (status && status !== 'Approved') continue

      items.push({
        itemType,
        itemId,
        savedAt: row.getDataValue('createdAt'),
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
    const exists = await SavedItemModel.findOne({
      where: {
        userId: req.user!.userId,
        itemType: String(itemType),
        itemId: String(itemId),
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

    const item: any =
      itemType === 'property'
        ? await PropertyModel.findByPk(itemId)
        : await VehicleModel.findByPk(itemId)

    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }

    const [savedItem, created] = await SavedItemModel.findOrCreate({
      where: { userId: req.user!.userId, itemType, itemId },
      defaults: { userId: req.user!.userId, itemType, itemId },
    } as any)

    if (created && itemType === 'vehicle') {
      const favorites = Number(item.getDataValue('favorites') || 0)
      await item.update({ favorites: favorites + 1 })
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

    const deleted = await SavedItemModel.destroy({
      where: { userId: req.user!.userId, itemType, itemId },
    })

    if (deleted > 0 && itemType === 'vehicle') {
      const item: any = await VehicleModel.findByPk(itemId)
      if (item) {
        const favorites = Number(item.getDataValue('favorites') || 0)
        await item.update({ favorites: Math.max(0, favorites - 1) })
      }
    }

    res.json({ message: 'Item removed', saved: false })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to remove item' })
  }
})

export default router
