import { Router } from 'express'
import { authMiddleware, agentMiddleware, requireActiveUser, getRequestUserId } from '../middleware/auth.js'
import { vehicleSchema, isValidUuid } from '../utils/validation.js'
import { prisma, withPrismaRetry } from '../lib/prisma.js'
import { notifyAdmins } from '../utils/notifications.js'
import { resolveSystemAdmin } from '../utils/admin-contact.js'
import { assertListingPermissionAllowed } from './permissions.js'

const router = Router()

const ALLOWED_UPDATE_FIELDS = [
  'title', 'listingType', 'vehicleCategory', 'make', 'vehicleModel',
  'trimVersion', 'manufacturingYear', 'registrationYear', 'color',
  'countryOfOrigin', 'condition', 'fuelType', 'engineSize', 'horsepower',
  'transmission', 'drivetrain', 'cylinders', 'seatingCapacity', 'doors',
  'mileage', 'fuelConsumption', 'fuelTankCapacity', 'groundClearance',
  'weight', 'tireSize', 'accidentFree', 'accidentHistory',
  'serviceHistoryAvailable', 'ownershipCount', 'imported', 'locallyAssembled',
  'safetyFeatures', 'interiorFeatures', 'exteriorFeatures',
  'price', 'priceType', 'sellingPrice', 'negotiable', 'financingAvailable',
  'exchangeAccepted', 'bankLoanAccepted', 'dailyRate', 'weeklyRate',
  'monthlyRate', 'securityDeposit', 'minRentalDays', 'maxRentalDays',
  'driverIncluded', 'selfDrive', 'fuelPolicy', 'mileageLimit', 'extraKmCharge',
  'deliveryAvailable', 'airportPickup', 'region', 'city', 'subCity', 'woreda',
  'pickupAddress', 'regionRegistration', 'ownershipCertificate', 'roadFundPaid',
  'insuranceValid', 'inspectionCertificate', 'customsClearance', 'dutyPaid',
  'plateType', 'plateNumber', 'description', 'images', 'videoUrl',
  'latitude', 'longitude', 'features',
]

const agentSelect = { id: true, username: true, email: true, phone: true, profilePhoto: true, role: true, status: true }

// Get all vehicles (public)
router.get('/', async (req, res) => {
  try {
    const where: any = { status: { in: ['Approved', 'Sold', 'Rented'] } }
    if (req.query.city) where.city = req.query.city
    if (req.query.category) where.vehicleCategory = req.query.category
    if (req.query.make) where.make = req.query.make
    if (req.query.agentId) where.agentId = req.query.agentId
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 100))
    const [total, vehicles] = await withPrismaRetry(() =>
      Promise.all([
        prisma.vehicle.count({ where }),
        prisma.vehicle.findMany({
          where,
          include: { agent: { select: agentSelect } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ])
    )
    res.json({ vehicles, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch vehicles' })
  }
})

// Get vehicle by ID
router.get('/:id', async (req, res) => {
  try {
    if (!isValidUuid(req.params.id)) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: { agent: { select: agentSelect } },
    })
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    // Only expose approved listings publicly; owner and admins may preview
    // drafts/pending/rejected listings via their own dashboards.
    if (vehicle.status !== 'Approved' && vehicle.status !== 'Sold' && vehicle.status !== 'Rented') {
      const caller = getRequestUserId(req)
      const isOwnerOrAdmin = caller && (caller.role === 'admin' || caller.userId === vehicle.agentId)
      if (!isOwnerOrAdmin) {
        return res.status(404).json({ message: 'Vehicle not found' })
      }
    }

    res.json({ vehicle })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch vehicle' })
  }
})

// Create vehicle (agent only)
router.post('/', authMiddleware, agentMiddleware, requireActiveUser, async (req, res) => {
  try {
    const parsed = vehicleSchema.safeParse(req.body)
    if (!parsed.success) {
      console.error('[Vehicle Validation Error]', JSON.stringify(parsed.error.flatten().fieldErrors))
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { username: true, phone: true, profilePhoto: true, role: true },
    })
    const isAdmin = currentUser?.role === 'admin'

    // Same contact model as properties: default is the System Admin number and
    // buyer messages route to the admin account until the admin toggles the
    // listing over to the agent/owner who published it.
    const contactName = parsed.data.name?.trim() || ''
    const contactPhone = parsed.data.phone?.trim() || ''
    const { name: _name, phone: _phone, contactMode, ...vehicleData } = parsed.data
    const mode = contactMode || 'Admin'
    let agentName = contactName || currentUser?.username || req.user!.email
    let displayPhone: string | null = contactPhone || currentUser?.phone || null
    let displayPhoto = currentUser?.profilePhoto || null
    let contactUserId: string | null = req.user!.userId
    if (mode === 'Admin') {
      const admin = await resolveSystemAdmin()
      agentName = admin.name
      displayPhone = admin.phone
      displayPhoto = admin.photo || null
      contactUserId = admin.id ?? req.user!.userId
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        ...vehicleData,
        agentId: req.user!.userId,
        agentName,
        status: isAdmin ? 'Approved' : 'Pending',
        displayPhone,
        displayPhoto,
        contactUserId,
      },
    })

    if (!isAdmin) {
      notifyAdmins(
        'New Vehicle Listing',
        `A new vehicle "${parsed.data.title}" has been posted and needs review.`,
        'info',
        { entityType: 'VEHICLE', entityId: vehicle.id, type: 'vehicle', id: vehicle.id }
      ).catch(() => {})
    }

    res.status(201).json({ message: 'Vehicle created', vehicle })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to create vehicle' })
  }
})

// Update vehicle
router.patch('/:id', authMiddleware, agentMiddleware, requireActiveUser, async (req, res) => {
  try {
    if (!isValidUuid(req.params.id)) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }
    const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } })
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    if (vehicle.agentId !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const permission = await assertListingPermissionAllowed({
      requesterId: req.user!.userId,
      isAdmin: req.user!.role === 'admin',
      entityType: 'VEHICLE',
      entityId: vehicle.id,
      listingStatus: vehicle.status,
      type: 'EDIT',
    })
    if (!permission.allowed) {
      return res.status(403).json({ code: 'PERMISSION_REQUIRED', message: 'Approved listings require admin permission to edit.' })
    }

    const parsed = vehicleSchema.partial().safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() })
    }

    const updates: Record<string, any> = {}
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (parsed.data[field as keyof typeof parsed.data] !== undefined) {
        updates[field] = parsed.data[field as keyof typeof parsed.data]
      }
    }

    // Recalculate the displayed contact when the poster (or admin) switches modes.
    if (parsed.data.contactMode) {
      if (parsed.data.contactMode === 'Admin') {
        const admin = await resolveSystemAdmin()
        updates.agentName = admin.name
        updates.displayPhone = admin.phone
        updates.displayPhoto = admin.photo || null
        updates.contactUserId = admin.id ?? req.user!.userId
      } else {
        const contactName = parsed.data.name?.trim() || ''
        const contactPhone = parsed.data.phone?.trim() || ''
        if (contactName) updates.agentName = contactName
        if (contactPhone) updates.displayPhone = contactPhone
        updates.contactUserId = req.user!.userId
      }
    }

    if (req.user!.role !== 'admin') {
      updates.status = 'Pending'
      updates.rejectionReason = null
    }

    const updated = await prisma.vehicle.update({ where: { id: req.params.id }, data: updates })
    res.json({ message: 'Vehicle updated', vehicle: updated })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update vehicle' })
  }
})

// Delete vehicle
router.delete('/:id', authMiddleware, agentMiddleware, requireActiveUser, async (req, res) => {
  try {
    if (!isValidUuid(req.params.id)) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }
    const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } })
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    if (vehicle.agentId !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const permission = await assertListingPermissionAllowed({
      requesterId: req.user!.userId,
      isAdmin: req.user!.role === 'admin',
      entityType: 'VEHICLE',
      entityId: vehicle.id,
      listingStatus: vehicle.status,
      type: 'DELETE',
    })
    if (!permission.allowed) {
      return res.status(403).json({ code: 'PERMISSION_REQUIRED', message: 'Approved listings require admin permission to delete.' })
    }

    await prisma.vehicle.delete({ where: { id: req.params.id } })
    res.json({ message: 'Vehicle deleted' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to delete vehicle' })
  }
})

export default router
