import { Router } from 'express'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { UserModel, PropertyModel, PaymentModel } from '../models/index.js'
import { sequelize } from '../config/database.js'

const router = Router()

// Get all agents
router.get('/agents', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const agents = await UserModel.findAll({ where: { role: 'agent' }, order: [['createdAt', 'DESC']] })
    res.json({ agents })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch agents' })
  }
})

// Verify agent
router.patch('/agents/:id/verify', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'Agent not found' })
    }
    await user.update({ status: 'Approved' })
    res.json({ message: 'Agent verified', user })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to verify agent' })
  }
})

// Reject agent
router.patch('/agents/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'Agent not found' })
    }
    await user.update({ status: 'Rejected', rejectionReason: req.body.reason || 'No reason provided' })
    res.json({ message: 'Agent rejected', user })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to reject agent' })
  }
})

// Get pending properties
router.get('/properties/pending', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const properties = await PropertyModel.findAll({ where: { status: 'Pending' }, order: [['createdAt', 'DESC']] })
    res.json({ properties })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch properties' })
  }
})

// Approve property
router.patch('/properties/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const property = await PropertyModel.findByPk(req.params.id)
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }
    await property.update({ status: 'Approved' })
    res.json({ message: 'Property approved', property })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to approve property' })
  }
})

// Reject property
router.patch('/properties/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const property = await PropertyModel.findByPk(req.params.id)
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }
    await property.update({ status: 'Rejected' })
    res.json({ message: 'Property rejected', property })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to reject property' })
  }
})

// Get all users
router.get('/users', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const users = await UserModel.findAll({ order: [['createdAt', 'DESC']] })
    res.json({ users })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch users' })
  }
})

// Get admin stats
router.get('/stats', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const [userCount, propertyCount, paymentCount] = await Promise.all([
      UserModel.count(),
      PropertyModel.count(),
      PaymentModel.count(),
    ])

    const [paymentStats] = await sequelize.query(
      `SELECT status, COUNT(*)::int AS count, SUM(amount) AS "totalAmount" FROM payments GROUP BY status`
    )

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
