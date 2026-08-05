import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const router = Router()

// Get payments with stats.
// Admin sees every transaction; agents see payments tied to their own
// listings (via property ownership) plus their own purchases.
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId
    const isAdmin = req.user!.role === 'admin'

    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50))

    let where: any = {}
    if (!isAdmin) {
      const ownedPropertyIds = await prisma.property
        .findMany({ where: { agentId: userId }, select: { id: true } })
        .then((rows) => rows.map((r) => r.id))

      const orClauses: any[] = []
      if (ownedPropertyIds.length > 0) {
        orClauses.push({ propertyId: { in: ownedPropertyIds } })
      }
      orClauses.push({ buyerEmail: req.user!.email })
      where = { OR: orClauses }
    }

    if (req.query.status && req.query.status !== 'all' && req.query.status !== '') {
      where.status = req.query.status
    }

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    const [completedAgg, pendingCount, failedCount] = await Promise.all([
      prisma.payment.aggregate({
        where: { ...where, status: 'Completed' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.count({ where: { ...where, status: 'Pending' } }),
      prisma.payment.count({ where: { ...where, status: 'Failed' } }),
    ])

    const stats = {
      totalRevenue: completedAgg._sum.amount || 0,
      completedCount: completedAgg._count,
      pendingCount,
      failedCount,
      totalCount: total,
    }

    res.json({
      payments,
      stats,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch payments' })
  }
})

// Get payment by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } })
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' })
    }

    const isAdmin = req.user!.role === 'admin'
    const isBuyer = payment.buyerEmail === req.user!.email
    const isOwner = await prisma.property.count({
      where: { id: payment.propertyId || '00000000-0000-0000-0000-000000000000', agentId: req.user!.userId },
    })
    if (!isAdmin && !isBuyer && !isOwner) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    res.json({ payment })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch payment' })
  }
})

export default router
