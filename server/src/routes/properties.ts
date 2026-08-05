import { Router } from 'express'
import { authMiddleware, agentMiddleware, requireActiveUser } from '../middleware/auth.js'
import { propertySchema } from '../utils/validation.js'
import { verifyAccessToken } from '../utils/jwt.js'
import { prisma, withPrismaRetry } from '../lib/prisma.js'
import { notifyAdmins } from '../utils/notifications.js'

const router = Router()

const ALLOWED_UPDATE_FIELDS = [
  'title', 'type', 'listingType', 'price', 'priceType', 'region', 'city',
  'subCity', 'woreda', 'kebele', 'parcel', 'block', 'homeNo', 'area',
  'bedrooms', 'bathrooms', 'condition', 'legalizedYear', 'description',
  'features', 'images', 'videoUrl', 'latitude', 'longitude', 'locationDocument',
  'posterType', 'ownerType',
]

const agentSelect = { id: true, username: true, email: true, phone: true, profilePhoto: true }

function getRequestUserId(req: any): { userId: string; role: string } | null {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) return null
  try {
    const decoded = verifyAccessToken(header.split(' ')[1])
    return { userId: decoded.userId, role: decoded.role }
  } catch {
    return null
  }
}

// Get all properties (public)
router.get('/', async (req, res) => {
  try {
    const where: any = { status: 'Approved' }
    if (req.query.city) where.city = req.query.city
    if (req.query.type) where.type = req.query.type
    if (req.query.agentId) where.agentId = req.query.agentId  // allow filtering by agent
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 100))
    const [total, properties] = await withPrismaRetry(() =>
      Promise.all([
        prisma.property.count({ where }),
        prisma.property.findMany({
          where,
          include: { agent: { select: agentSelect } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]),
    )
    res.json({ properties, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch properties' })
  }
})

// Get property by ID
router.get('/:id', async (req, res) => {
  try {
    const property = await withPrismaRetry(() =>
      prisma.property.findUnique({
        where: { id: req.params.id },
        include: { agent: { select: agentSelect } },
      }),
    )
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    // Only expose approved listings publicly; owner and admins may preview
    // drafts/pending/rejected listings via their own dashboards.
    if (property.status !== 'Approved') {
      const caller = getRequestUserId(req)
      const isOwnerOrAdmin = caller && (caller.role === 'admin' || caller.userId === property.agentId)
      if (!isOwnerOrAdmin) {
        return res.status(404).json({ message: 'Property not found' })
      }
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
    const contactName = parsed.data.name?.trim() || ''
    const contactPhone = parsed.data.phone?.trim() || ''
    const { name: _name, phone: _phone, ...propertyData } = parsed.data
    const property = await prisma.property.create({
      data: {
        ...propertyData,
        agentId: req.user!.userId,
        agentName: contactName || req.user!.email,
        status: 'Pending',
        displayPhone: contactPhone || ADMIN_PHONES[0],
      },
    })

    notifyAdmins(
      'New Property Listing',
      `A new property "${parsed.data.title}" has been posted and needs review.`,
      'info',
      { type: 'property', id: property.id }
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
    const property = await prisma.property.findUnique({ where: { id: req.params.id } })
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    if (property.agentId !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const parsed = propertySchema.partial().safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() })
    }

    const updates: Record<string, any> = {}
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (parsed.data[field as keyof typeof parsed.data] !== undefined) {
        updates[field] = parsed.data[field as keyof typeof parsed.data]
      }
    }

    if (req.user!.role !== 'admin') {
      updates.status = 'Pending'
      updates.rejectionReason = null
    }

    const updated = await prisma.property.update({ where: { id: req.params.id }, data: updates })
    res.json({ message: 'Property updated', property: updated })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update property' })
  }
})

// Delete property
router.delete('/:id', authMiddleware, agentMiddleware, requireActiveUser, async (req, res) => {
  try {
    const property = await prisma.property.findUnique({ where: { id: req.params.id } })
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    if (property.agentId !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await prisma.property.delete({ where: { id: req.params.id } })
    res.json({ message: 'Property deleted' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to delete property' })
  }
})

export default router
