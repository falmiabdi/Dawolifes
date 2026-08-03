import { Router } from 'express'
import { authMiddleware, agentMiddleware, requireActiveUser } from '../middleware/auth.js'
import { propertySchema } from '../utils/validation.js'
import { PropertyModel, UserModel } from '../models/index.js'
import { notifyAdmins } from '../utils/notifications.js'

const router = Router()

const ALLOWED_UPDATE_FIELDS = [
  'title', 'type', 'listingType', 'price', 'priceType', 'region', 'city',
  'subCity', 'woreda', 'kebele', 'parcel', 'block', 'homeNo', 'area',
  'bedrooms', 'bathrooms', 'condition', 'legalizedYear', 'description',
  'features', 'images', 'videoUrl', 'latitude', 'longitude', 'locationDocument',
  'posterType', 'ownerType',
]

const propertyIncludes = [
  { model: UserModel, as: 'agent', attributes: ['id', 'username', 'email', 'phone', 'profilePhoto'] },
]

// Get all properties (public)
router.get('/', async (req, res) => {
  try {
    const where: any = { status: 'Approved' }
    if (req.query.city) where.city = req.query.city
    if (req.query.type) where.type = req.query.type
    if (req.query.agentId) where.agentId = req.query.agentId  // allow filtering by agent
    const limit = parseInt(req.query.limit as string) || 100
    const properties = await PropertyModel.findAll({
      where,
      include: propertyIncludes,
      order: [['createdAt', 'DESC']],
      limit,
    })
    res.json({ properties })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch properties' })
  }
})

// Get property by ID
router.get('/:id', async (req, res) => {
  try {
    const property = await PropertyModel.findByPk(req.params.id, { include: propertyIncludes })
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }
    res.json({ property })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch property' })
  }
})

// Create property (agent only)
router.post('/', authMiddleware, agentMiddleware, requireActiveUser, async (req, res) => {
  try {
    const parsed = propertySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() })
    }

    const ADMIN_PHONES = ['+251962395282', '+251922477886']
    const property = await PropertyModel.create({
      ...parsed.data,
      agentId: req.user!.userId,
      agentName: req.user!.email,
      status: 'Pending',
      displayPhone: ADMIN_PHONES[0],
    } as any)

    notifyAdmins(
      'New Property Listing',
      `A new property "${parsed.data.title}" has been posted and needs review.`,
      'info',
      { type: 'property', id: property.getDataValue('id') }
    ).catch(() => {})

    res.status(201).json({ message: 'Property created', property })
  } catch (err: any) {
    console.error('[Create Property Error]', err)
    res.status(500).json({ message: err.message || 'Failed to create property' })
  }
})

// Update property
router.patch('/:id', authMiddleware, agentMiddleware, requireActiveUser, async (req, res) => {
  try {
    const property = await PropertyModel.findByPk(req.params.id)
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    if (property.getDataValue('agentId') !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const updates: Record<string, any> = {}
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]
      }
    }

    if (req.user!.role !== 'admin') {
      updates.status = 'Pending'
    }

    await property.update(updates)
    res.json({ message: 'Property updated', property })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update property' })
  }
})

// Delete property
router.delete('/:id', authMiddleware, agentMiddleware, requireActiveUser, async (req, res) => {
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
