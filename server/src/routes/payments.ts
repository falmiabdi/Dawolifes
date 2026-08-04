import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const router = Router()

// Get payments with stats
router.get('/', authMiddleware, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const rawStats = await prisma.$queryRaw<
      { status: string; count: number; totalAmount: string }[]
    >`SELECT status, COUNT(*)::int AS count, COALESCE(SUM(amount), 0) AS "totalAmount" FROM payments GROUP BY status`

    // Normalize raw SQL array into a friendly object for the frontend
    const statsArr = rawStats as { status: string; count: number; totalAmount: string }[]
    const statsObj = {
      totalRevenue: 0,
      completedCount: 0,
      pendingCount: 0,
      failedCount: 0,
      totalCount: 0,
    }
    for (const row of statsArr) {
      const amount = Number(row.totalAmount) || 0
      const count = Number(row.count) || 0
      statsObj.totalCount += count
      if (row.status === 'Completed') {
        statsObj.completedCount = count
        statsObj.totalRevenue += amount
      } else if (row.status === 'Pending') {
        statsObj.pendingCount = count
      } else if (row.status === 'Failed') {
        statsObj.failedCount = count
      }
    }

    res.json({ payments, stats: statsObj })
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
    res.json({ payment })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch payment' })
  }
})

export default router
