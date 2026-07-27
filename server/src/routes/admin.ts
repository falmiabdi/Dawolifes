import { Router } from 'express'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { UserModel } from '../models/User.js'
import { PropertyModel } from '../models/Property.js'
import { PaymentModel } from '../models/Payment.js'

const router = Router()

// Get all agents
router.get('/agents', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const agents = await UserModel.find({ role: 'agent' }).sort({ createdAt: -1 })
    res.json({ agents })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch agents' })
  }
})

// Verify agent
router.patch('/agents/:id/verify', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'Agent not found' })
    }
    user.status = 'Approved'
    await user.save()
    res.json({ message: 'Agent verified', user })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to verify agent' })
  }
})

// Reject agent
router.patch('/agents/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'Agent not found' })
    }
    user.status = 'Rejected'
    user.rejectionReason = req.body.reason || 'No reason provided'
    await user.save()
    res.json({ message: 'Agent rejected', user })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to reject agent' })
  }
})

// Get pending properties
router.get('/properties/pending', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const properties = await PropertyModel.find({ status: 'Pending' }).sort({ createdAt: -1 })
    res.json({ properties })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch properties' })
  }
})

// Approve property
router.patch('/properties/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const property = await PropertyModel.findById(req.params.id)
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }
    property.status = 'Approved'
    await property.save()
    res.json({ message: 'Property approved', property })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to approve property' })
  }
})

// Reject property
router.patch('/properties/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const property = await PropertyModel.findById(req.params.id)
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }
    property.status = 'Rejected'
    await property.save()
    res.json({ message: 'Property rejected', property })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to reject property' })
  }
})

// Get all users
router.get('/users', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const users = await UserModel.find().sort({ createdAt: -1 })
    res.json({ users })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch users' })
  }
})

// Get admin stats
router.get('/stats', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const [userCount, propertyCount, paymentCount] = await Promise.all([
      UserModel.countDocuments(),
      PropertyModel.countDocuments(),
      PaymentModel.countDocuments(),
    ])

    const paymentStats = await PaymentModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ])

    res.json({
      users: userCount,
      properties: propertyCount,
      payments: paymentCount,
      paymentStats,
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch stats' })
  }
})

export default router
