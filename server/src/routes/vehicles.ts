import { Router } from 'express'
import { authMiddleware, agentMiddleware } from '../middleware/auth.js'
import { vehicleSchema } from '../utils/validation.js'
import { VehicleModel } from '../models/index.js'

const router = Router()

// Get all vehicles (public)
router.get('/', async (_req, res) => {
  try {
    const vehicles = await VehicleModel.findAll({ where: { status: 'Approved' }, order: [['createdAt', 'DESC']] })
    res.json({ vehicles })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch vehicles' })
  }
})

// Get vehicle by ID
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await VehicleModel.findByPk(req.params.id)
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }
    res.json({ vehicle })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch vehicle' })
  }
})

// Create vehicle (agent only)
router.post('/', authMiddleware, agentMiddleware, async (req, res) => {
  try {
    const parsed = vehicleSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() })
    }

    const vehicle = await VehicleModel.create({
      ...parsed.data,
      agentId: req.user!.userId,
      agentName: req.user!.email,
      status: 'Pending',
    } as any)

    res.status(201).json({ message: 'Vehicle created', vehicle })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to create vehicle' })
  }
})

// Update vehicle
router.patch('/:id', authMiddleware, agentMiddleware, async (req, res) => {
  try {
    const vehicle = await VehicleModel.findByPk(req.params.id)
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    if (vehicle.getDataValue('agentId') !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }

    await vehicle.update(req.body)
    res.json({ message: 'Vehicle updated', vehicle })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update vehicle' })
  }
})

// Delete vehicle
router.delete('/:id', authMiddleware, agentMiddleware, async (req, res) => {
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
