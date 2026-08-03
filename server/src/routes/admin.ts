import { Router } from 'express'
import { Op } from 'sequelize'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { UserModel, PropertyModel, VehicleModel, PaymentModel } from '../models/index.js'
import { sequelize } from '../config/database.js'
import { createAndBroadcastNotification } from '../utils/notifications.js'

function flattenAgent(user: any) {
  const profile = user.getDataValue?.('profile') || user.profile || {}
  const documents = user.getDataValue?.('documents') || user.documents || []
  const education = user.getDataValue?.('education') || user.education || {}
  const professionalInfo = user.getDataValue?.('professionalInfo') || user.professionalInfo || {}

  const docMap: Record<string, string> = {}
  if (Array.isArray(documents)) {
    for (const d of documents) {
      if (d.type && d.url) docMap[d.type] = d.url
    }
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    rejectionReason: user.rejectionReason,
    isRootAdmin: user.isRootAdmin,
    profilePhoto: user.profilePhoto,
    phone: user.phone,
    onboardingComplete: user.onboardingComplete,
    createdAt: user.createdAt,
    fullName: user.username,
    gender: profile.gender || '',
    dateOfBirth: profile.dateOfBirth || '',
    nationality: profile.nationality || '',
    preferredLanguage: profile.preferredLanguage || '',
    ethPhone: user.phone || '',
    safaricomPhone: profile.safaricomPhone || '',
    region: profile.region || '',
    city: profile.city || '',
    woreda: profile.woreda || '',
    kebele: profile.kebele || '',
    fullAddress: profile.fullAddress || '',
    faydaFront: docMap.faydaFront || '',
    faydaBack: docMap.faydaBack || '',
    selfieFayda: docMap.selfieFayda || '',
    passportPhoto: docMap.passportPhoto || '',
    highestEducation: education.level || '',
    educationCertificate: education.certificate || '',
    agentExperience: professionalInfo.experience || '',
    companyName: professionalInfo.companyName || '',
    officeAddress: professionalInfo.officeAddress || '',
    businessLicenseNumber: professionalInfo.licenseNumber || '',
    businessLicenseFile: professionalInfo.licenseFile || '',
    tinNumber: professionalInfo.tinNumber || '',
  }
}

const router = Router()

// Get all agents (with search and status filter)
router.get('/agents', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const where: any = { role: 'agent' }

    if (req.query.status && req.query.status !== 'all' && req.query.status !== '') {
      where.status = req.query.status
    }

    if (req.query.search) {
      const search = `%${req.query.search}%`
      where[Op.or] = [
        { username: { [Op.iLike]: search } },
        { email: { [Op.iLike]: search } },
      ]
    }

    const agents = await UserModel.findAll({ where, order: [['createdAt', 'DESC']] })
    res.json({ agents: agents.map(flattenAgent) })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch agents' })
  }
})

// Unified agent action handler
router.post('/agents', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { action, id, rejectionReason } = req.body

    if (!id || !action) {
      return res.status(400).json({ message: 'Missing id or action' })
    }

    const user = await UserModel.findByPk(id)
    if (!user) {
      return res.status(404).json({ message: 'Agent not found' })
    }

    switch (action) {
      case 'approve':
        await user.update({ status: 'Approved', rejectionReason: null as any })
        createAndBroadcastNotification(
          id,
          'Account Approved',
          'Your agent account has been approved. You can now post properties and vehicles.',
          'success'
        ).catch(() => {})
        break
      case 'reject':
        await user.update({ status: 'Rejected', rejectionReason: rejectionReason || 'No reason provided' })
        createAndBroadcastNotification(
          id,
          'Account Rejected',
          `Your agent account has been rejected. Reason: ${rejectionReason || 'No reason provided'}`,
          'error'
        ).catch(() => {})
        break
      case 'suspend':
        await user.update({ status: 'Suspended' })
        createAndBroadcastNotification(
          id,
          'Account Suspended',
          'Your agent account has been suspended. Please contact support for more information.',
          'warning'
        ).catch(() => {})
        break
      case 'reactivate':
        await user.update({ status: 'Approved', rejectionReason: null as any })
        createAndBroadcastNotification(
          id,
          'Account Reactivated',
          'Your agent account has been reactivated. You can now post properties and vehicles.',
          'success'
        ).catch(() => {})
        break
      case 'delete':
        await user.destroy()
        return res.json({ message: 'Agent deleted' })
      default:
        return res.status(400).json({ message: `Unknown action: ${action}` })
    }

    res.json({ message: 'Agent status updated successfully' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to process action' })
  }
})

const ADMIN_PHONES = ['+251962395282', '+251922477886']

router.patch('/properties/:id/contact', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const property = await PropertyModel.findByPk(req.params.id, {
      include: [{ model: UserModel, as: 'agent', attributes: ['id', 'phone'] }],
    })
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    const currentPhone = property.getDataValue('displayPhone') || ''
    const agentPhone = (property as any).agent?.phone || ''

    let newPhone: string
    if (currentPhone === ADMIN_PHONES[0]) {
      newPhone = ADMIN_PHONES[1]
    } else if (currentPhone === ADMIN_PHONES[1]) {
      newPhone = agentPhone || ADMIN_PHONES[0]
    } else {
      newPhone = ADMIN_PHONES[0]
    }
    await property.update({ displayPhone: newPhone })

    res.json({ message: 'Contact phone updated', displayPhone: newPhone })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update contact' })
  }
})

// Get all properties (admin)
router.get('/properties', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const where: any = {}
    if (req.query.status && req.query.status !== 'all' && req.query.status !== '') {
      where.status = req.query.status
    }
    if (req.query.search) {
      where.title = { [Op.iLike]: `%${req.query.search}%` }
    }
    const properties = await PropertyModel.findAll({
      where,
      include: [{ model: UserModel, as: 'agent', attributes: ['id', 'username', 'email', 'phone', 'profilePhoto'] }],
      order: [['createdAt', 'DESC']],
    })
    res.json({ properties })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch properties' })
  }
})

// Get pending properties
router.get('/properties/pending', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const properties = await PropertyModel.findAll({
      where: { status: 'Pending' },
      include: [{ model: UserModel, as: 'agent', attributes: ['id', 'username', 'email', 'phone', 'profilePhoto'] }],
      order: [['createdAt', 'DESC']],
    })
    res.json({ properties })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch properties' })
  }
})

// Approve property
router.patch('/properties/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const property = await PropertyModel.findByPk(req.params.id, {
      include: [{ model: UserModel, as: 'agent', attributes: ['id', 'username', 'email', 'phone', 'profilePhoto'] }],
    })
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
    const property = await PropertyModel.findByPk(req.params.id, {
      include: [{ model: UserModel, as: 'agent', attributes: ['id', 'username', 'email', 'phone', 'profilePhoto'] }],
    })
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }
    await property.update({ status: 'Rejected' })
    res.json({ message: 'Property rejected', property })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to reject property' })
  }
})

// Get all vehicles (admin)
router.get('/vehicles', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const where: any = {}
    if (req.query.status && req.query.status !== 'all' && req.query.status !== '') {
      where.status = req.query.status
    }
    if (req.query.search) {
      where.title = { [Op.iLike]: `%${req.query.search}%` }
    }
    const vehicles = await VehicleModel.findAll({
      where,
      include: [{ model: UserModel, as: 'agent', attributes: ['id', 'username', 'email', 'phone', 'profilePhoto'] }],
      order: [['createdAt', 'DESC']],
    })
    res.json({ vehicles })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch vehicles' })
  }
})

// Get pending vehicles
router.get('/vehicles/pending', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const vehicles = await VehicleModel.findAll({ where: { status: 'Pending' }, order: [['createdAt', 'DESC']] })
    res.json({ vehicles })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch vehicles' })
  }
})

// Approve vehicle
router.patch('/vehicles/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const vehicle = await VehicleModel.findByPk(req.params.id)
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }
    await vehicle.update({ status: 'Approved' })
    res.json({ message: 'Vehicle approved', vehicle })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to approve vehicle' })
  }
})

// Reject vehicle
router.patch('/vehicles/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const vehicle = await VehicleModel.findByPk(req.params.id)
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }
    await vehicle.update({ status: 'Rejected' })
    res.json({ message: 'Vehicle rejected', vehicle })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to reject vehicle' })
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

// Unified user action handler
router.post('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { action, id } = req.body

    if (!id || !action) {
      return res.status(400).json({ message: 'Missing id or action' })
    }

    const user = await UserModel.findByPk(id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    switch (action) {
      case 'suspend':
        await user.update({ status: 'Suspended' })
        break
      case 'activate':
        await user.update({ status: 'Approved' })
        break
      case 'delete':
        await user.destroy()
        return res.json({ message: 'User deleted' })
      default:
        return res.status(400).json({ message: `Unknown action: ${action}` })
    }

    res.json({ message: 'User status updated successfully' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to process action' })
  }
})

// Update admin's own profile
router.put('/profile', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { phone, profilePhoto, email } = req.body
    const updateData: Record<string, any> = {}
    if (phone !== undefined) updateData.phone = phone
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto
    if (email !== undefined) {
      const existing = await UserModel.findOne({ where: { email } })
      if (existing && existing.getDataValue('id') !== req.user!.userId) {
        return res.status(409).json({ message: 'Email already in use' })
      }
      updateData.email = email
    }
    await UserModel.update(updateData, { where: { id: req.user!.userId } })
    const user = await UserModel.findByPk(req.user!.userId, {
      attributes: ['id', 'username', 'email', 'phone', 'profilePhoto', 'role', 'isRootAdmin'],
    })
    res.json({ message: 'Profile updated', user })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update profile' })
  }
})

// Create a new admin (root admin only)
router.post('/create', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const currentUser = await UserModel.findByPk(req.user!.userId)
    if (!currentUser?.getDataValue('isRootAdmin')) {
      return res.status(403).json({ message: 'Only root admin can create new admins' })
    }
    const { username, email, password } = req.body
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' })
    }
    const existing = await UserModel.findOne({ where: { email } })
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' })
    }
    const { hashPassword } = await import('../utils/password.js')
    const hashedPassword = await hashPassword(password)
    const admin = await UserModel.create({
      username,
      email,
      password: hashedPassword,
      role: 'admin',
      roles: ['admin'],
      status: 'Approved',
    } as any)
    res.status(201).json({ message: 'Admin created', admin: { id: admin.getDataValue('id'), username, email, role: 'admin' } })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to create admin' })
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

    const [rawStats] = await sequelize.query(
      `SELECT status, COUNT(*)::int AS count, COALESCE(SUM(amount), 0) AS "totalAmount" FROM payments GROUP BY status`
    )

    const statsArr = rawStats as { status: string; count: number; totalAmount: string }[]
    const paymentStats = {
      totalRevenue: 0,
      completedCount: 0,
      pendingCount: 0,
      failedCount: 0,
      totalCount: paymentCount,
    }
    for (const row of statsArr) {
      const amount = Number(row.totalAmount) || 0
      const count = Number(row.count) || 0
      if (row.status === 'Completed') {
        paymentStats.completedCount = count
        paymentStats.totalRevenue += amount
      } else if (row.status === 'Pending') {
        paymentStats.pendingCount = count
      } else if (row.status === 'Failed') {
        paymentStats.failedCount = count
      }
    }

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
