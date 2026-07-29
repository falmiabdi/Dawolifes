import { Router } from 'express'
import { authMiddleware, agentMiddleware } from '../middleware/auth.js'
import { propertySchema } from '../utils/validation.js'
import { PropertyModel } from '../models/index.js'

const router = Router()

// Get all properties (public)
router.get('/', async (_req, res) => {
  try {
    const properties = await PropertyModel.findAll({ where: { status: 'Approved' }, order: [['createdAt', 'DESC']] })
    res.json({ properties })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch properties' })
  }
})

// Get property by ID
router.get('/:id', async (req, res) => {
  try {
    const property = await PropertyModel.findByPk(req.params.id)
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }
    res.json({ property })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch property' })
  }
})

// Create property (agent only)
router.post('/', authMiddleware, agentMiddleware, async (req, res) => {
  try {
    const parsed = propertySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() })
    }

    const property = await PropertyModel.create({
      ...parsed.data,
      agentId: req.user!.userId,
      agentName: req.user!.email,
      status: 'Pending',
    } as any)

    res.status(201).json({ message: 'Property created', property })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to create property' })
  }
})

// Update property
router.patch('/:id', authMiddleware, agentMiddleware, async (req, res) => {
  try {
    const property = await PropertyModel.findByPk(req.params.id)
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    if (property.getDataValue('agentId') !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await property.update(req.body)
    res.json({ message: 'Property updated', property })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update property' })
  }
})

// Delete property
router.delete('/:id', authMiddleware, agentMiddleware, async (req, res) => {
  try {
    const property = await PropertyModel.findByPk(req.params.id)
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    if (property.getDataValue('agentId') !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await property.destroy()
    res.json({ message: 'Property deleted' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to delete property' })
  }
})

export default router
