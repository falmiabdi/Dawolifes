import { Router } from 'express'
import { authMiddleware, agentMiddleware, requireActiveUser } from '../middleware/auth.js'
import { vehicleSchema } from '../utils/validation.js'
import { VehicleModel, UserModel } from '../models/index.js'
import { notifyAdmins } from '../utils/notifications.js'

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

// Get all vehicles (public)
router.get('/', async (req, res) => {
  try {
    const where: any = { status: 'Approved' }
    if (req.query.city) where.city = req.query.city
    if (req.query.category) where.vehicleCategory = req.query.category
    if (req.query.make) where.make = req.query.make
    if (req.query.agentId) where.agentId = req.query.agentId
    const limit = parseInt(req.query.limit as string) || 100
    const vehicles = await VehicleModel.findAll({
      where,
      include: [
        { model: UserModel, as: 'agent', attributes: ['id', 'username', 'email', 'phone', 'profilePhoto'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
    })
    res.json({ vehicles })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch vehicles' })
  }
})

// Get vehicle by ID
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await VehicleModel.findByPk(req.params.id, {
      include: [
        { model: UserModel, as: 'agent', attributes: ['id', 'username', 'email', 'phone', 'profilePhoto'] },
      ],
    } as any)
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
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

    const vehicle = await VehicleModel.create({
      ...parsed.data,
      agentId: req.user!.userId,
      agentName: req.user!.email,
      status: 'Pending',
    } as any)

    notifyAdmins(
      'New Vehicle Listing',
      `A new vehicle "${parsed.data.title}" has been posted and needs review.`,
      'info',
      { type: 'vehicle', id: vehicle.getDataValue('id') }
    ).catch(() => {})

    res.status(201).json({ message: 'Vehicle created', vehicle })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to create vehicle' })
  }
})

// Update vehicle
router.patch('/:id', authMiddleware, agentMiddleware, requireActiveUser, async (req, res) => {
  try {
    const vehicle = await VehicleModel.findByPk(req.params.id)
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    if (vehicle.getDataValue('agentId') !== req.user!.userId && req.user!.role !== 'admin') {
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

    await vehicle.update(updates)
    res.json({ message: 'Vehicle updated', vehicle })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update vehicle' })
  }
})

// Delete vehicle
router.delete('/:id', authMiddleware, agentMiddleware, requireActiveUser, async (req, res) => {
  try {
    const vehicle = await VehicleModel.findByPk(req.params.id)
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    if (vehicle.getDataValue('agentId') !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await vehicle.destroy()
    res.json({ message: 'Vehicle deleted' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to delete vehicle' })
  }
})

export default router
