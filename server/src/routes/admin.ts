import { Router } from 'express'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { createAndBroadcastNotification } from '../utils/notifications.js'
import { hashPassword } from '../utils/password.js'
import { ADMIN_PHONES } from '../config/constants.js'

function flattenAgent(user: any) {
  const profile = user.profile || {}
  const documents = user.documents || []
  const education = user.education || {}
  const professionalInfo = user.professionalInfo || {}

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
      const search = String(req.query.search)
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 100))
    const [total, agents] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    ])
    res.json({ agents: agents.map(flattenAgent), pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } })
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

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return res.status(404).json({ message: 'Agent not found' })
    }

    switch (action) {
      case 'approve':
        await prisma.user.update({ where: { id }, data: { status: 'Approved', rejectionReason: null } })
        createAndBroadcastNotification(
          id,
          'Account Approved',
          'Your agent account has been approved. You can now post properties and vehicles.',
          'success'
        ).catch(() => {})
        break
      case 'reject':
        await prisma.user.update({ where: { id }, data: { status: 'Rejected', rejectionReason: rejectionReason || 'No reason provided' } })
        createAndBroadcastNotification(
          id,
          'Account Rejected',
          `Your agent account has been rejected. Reason: ${rejectionReason || 'No reason provided'}`,
          'error'
        ).catch(() => {})
        break
      case 'suspend':
        await prisma.user.update({ where: { id }, data: { status: 'Suspended' } })
        createAndBroadcastNotification(
          id,
          'Account Suspended',
          'Your agent account has been suspended. Please contact support for more information.',
          'warning'
        ).catch(() => {})
        break
      case 'reactivate':
        await prisma.user.update({ where: { id }, data: { status: 'Approved', rejectionReason: null } })
        createAndBroadcastNotification(
          id,
          'Account Reactivated',
          'Your agent account has been reactivated. You can now post properties and vehicles.',
          'success'
        ).catch(() => {})
        break
      case 'delete':
        await deleteUserCascade(id)
        return res.json({ message: 'Agent deleted' })
      default:
        return res.status(400).json({ message: `Unknown action: ${action}` })
    }

    res.json({ message: 'Agent status updated successfully' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to process action' })
  }
})

// Delete a user along with all records that reference them (listings,
// messages, saved items, notifications) to avoid foreign-key failures.
async function deleteUserCascade(userId: string) {
  const properties = await prisma.property.findMany({
    where: { agentId: userId },
    select: { id: true },
  })
  const propertyIds = properties.map((p) => p.id)
  const vehicles = await prisma.vehicle.findMany({
    where: { agentId: userId },
    select: { id: true },
  })
  const vehicleIds = vehicles.map((v) => v.id)

  if (propertyIds.length > 0) {
    await prisma.property.deleteMany({ where: { id: { in: propertyIds } } })
  }
  if (vehicleIds.length > 0) {
    await prisma.vehicle.deleteMany({ where: { id: { in: vehicleIds } } })
  }

  const messageOr: any[] = [{ senderId: userId }, { recipientId: userId }]
  if (propertyIds.length > 0) {
    messageOr.push({ propertyId: { in: propertyIds } })
  }
  await prisma.message.deleteMany({ where: { OR: messageOr } })
  await prisma.savedItem.deleteMany({ where: { userId } })
  await prisma.notification.deleteMany({ where: { userId } })
  await prisma.user.delete({ where: { id: userId } })
}

// Toggle the contact phone shown on a listing. Cycles between the agent's
// own phone and the configured fallback numbers.
router.patch('/properties/:id/contact', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: { agent: { select: { id: true, phone: true } } },
    })
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    const currentPhone = property.displayPhone || ''
    const agentPhone = property.agent?.phone || ''

    let newPhone: string
    if (currentPhone === ADMIN_PHONES[0]) {
      newPhone = ADMIN_PHONES[1]
    } else if (currentPhone === ADMIN_PHONES[1]) {
      newPhone = agentPhone || ADMIN_PHONES[0]
    } else {
      newPhone = ADMIN_PHONES[0]
    }
    await prisma.property.update({ where: { id: req.params.id }, data: { displayPhone: newPhone } })

    res.json({ message: 'Contact phone updated', displayPhone: newPhone })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update contact' })
  }
})

router.patch('/vehicles/:id/contact', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: { agent: { select: { id: true, phone: true } } },
    })
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    const currentPhone = vehicle.displayPhone || ''
    const agentPhone = vehicle.agent?.phone || ''

    let newPhone: string
    if (currentPhone === ADMIN_PHONES[0]) {
      newPhone = ADMIN_PHONES[1]
    } else if (currentPhone === ADMIN_PHONES[1]) {
      newPhone = agentPhone || ADMIN_PHONES[0]
    } else {
      newPhone = ADMIN_PHONES[0]
    }
    await prisma.vehicle.update({ where: { id: req.params.id }, data: { displayPhone: newPhone } })

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
      where.title = { contains: String(req.query.search), mode: 'insensitive' }
    }
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 100))
    const [total, properties] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        include: { agent: { select: { id: true, username: true, email: true, phone: true, profilePhoto: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])
    res.json({ properties, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch properties' })
  }
})

// Approve property
router.patch('/properties/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: { agent: { select: { id: true, username: true, email: true, phone: true, profilePhoto: true } } },
    })
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }
    const updated = await prisma.property.update({
      where: { id: req.params.id },
      data: { status: 'Approved', rejectionReason: null },
    })
    createAndBroadcastNotification(
      property.agentId,
      'Property Approved',
      `Your property "${property.title}" has been approved and is now live.`,
      'success',
      { type: 'property', id: property.id }
    ).catch(() => {})
    res.json({ message: 'Property approved', property: updated })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to approve property' })
  }
})

// Reject property
router.patch('/properties/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: { agent: { select: { id: true, username: true, email: true, phone: true, profilePhoto: true } } },
    })
    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }
    const reason = (req.body?.reason as string) || (req.body?.rejectionReason as string) || 'No reason provided'
    const updated = await prisma.property.update({
      where: { id: req.params.id },
      data: { status: 'Rejected', rejectionReason: reason },
    })
    createAndBroadcastNotification(
      property.agentId,
      'Property Rejected',
      `Your property "${property.title}" was rejected. Reason: ${reason}`,
      'error',
      { type: 'property', id: property.id }
    ).catch(() => {})
    res.json({ message: 'Property rejected', property: updated })
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
      where.title = { contains: String(req.query.search), mode: 'insensitive' }
    }
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 100))
    const [total, vehicles] = await Promise.all([
      prisma.vehicle.count({ where }),
      prisma.vehicle.findMany({
        where,
        include: { agent: { select: { id: true, username: true, email: true, phone: true, profilePhoto: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])
    res.json({ vehicles, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch vehicles' })
  }
})

// Approve vehicle
router.patch('/vehicles/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } })
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }
    const updated = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: { status: 'Approved', rejectionReason: null },
    })
    createAndBroadcastNotification(
      vehicle.agentId,
      'Vehicle Approved',
      `Your vehicle "${vehicle.title}" has been approved and is now live.`,
      'success',
      { type: 'vehicle', id: vehicle.id }
    ).catch(() => {})
    res.json({ message: 'Vehicle approved', vehicle: updated })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to approve vehicle' })
  }
})

// Reject vehicle
router.patch('/vehicles/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } })
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }
    const reason = (req.body?.reason as string) || (req.body?.rejectionReason as string) || 'No reason provided'
    const updated = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: { status: 'Rejected', rejectionReason: reason },
    })
    createAndBroadcastNotification(
      vehicle.agentId,
      'Vehicle Rejected',
      `Your vehicle "${vehicle.title}" was rejected. Reason: ${reason}`,
      'error',
      { type: 'vehicle', id: vehicle.id }
    ).catch(() => {})
    res.json({ message: 'Vehicle rejected', vehicle: updated })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to reject vehicle' })
  }
})

// Get all users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 100))
    const [total, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          roles: true,
          status: true,
          rejectionReason: true,
          isRootAdmin: true,
          profilePhoto: true,
          phone: true,
          onboardingComplete: true,
          emailVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])
    res.json({ users, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } })
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

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    switch (action) {
      case 'suspend':
        await prisma.user.update({ where: { id }, data: { status: 'Suspended' } })
        break
      case 'activate':
        await prisma.user.update({ where: { id }, data: { status: 'Approved' } })
        break
      case 'delete':
        await deleteUserCascade(id)
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
      const existing = await prisma.user.findFirst({ where: { email } })
      if (existing && existing.id !== req.user!.userId) {
        return res.status(409).json({ message: 'Email already in use' })
      }
      updateData.email = email
    }
    await prisma.user.update({ where: { id: req.user!.userId }, data: updateData })
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, username: true, email: true, phone: true, profilePhoto: true, role: true, isRootAdmin: true },
    })
    res.json({ message: 'Profile updated', user })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update profile' })
  }
})

// Create a new admin (root admin only)
router.post('/create', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const currentUser = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!currentUser?.isRootAdmin) {
      return res.status(403).json({ message: 'Only root admin can create new admins' })
    }
    const { username, email, password } = req.body
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' })
    }
    const existing = await prisma.user.findFirst({ where: { email } })
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' })
    }
    const hashedPassword = await hashPassword(password)
    const admin = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'admin',
        roles: ['admin'],
        status: 'Approved',
      },
    })
    res.status(201).json({ message: 'Admin created', admin: { id: admin.id, username, email, role: 'admin' } })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to create admin' })
  }
})

// Get admin stats
router.get('/stats', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const [userCount, propertyCount, paymentCount] = await Promise.all([
      prisma.user.count(),
      prisma.property.count(),
      prisma.payment.count(),
    ])

    const rawStats = await prisma.$queryRaw<
      { status: string; count: number; totalAmount: string }[]
    >`SELECT status, COUNT(*)::int AS count, COALESCE(SUM(amount), 0) AS "totalAmount" FROM payments GROUP BY status`

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
