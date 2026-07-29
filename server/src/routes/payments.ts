import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { PaymentModel } from '../models/index.js'
import { sequelize } from '../config/database.js'

const router = Router()

// Get payments with stats
router.get('/', authMiddleware, async (req, res) => {
  try {
    const payments = await PaymentModel.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50,
    })

    const [stats] = await sequelize.query(
      `SELECT status, COUNT(*)::int AS count, SUM(amount) AS "totalAmount" FROM payments GROUP BY status`
    )

    res.json({ payments, stats })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch payments' })
  }
})

// Get payment by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const payment = await PaymentModel.findByPk(req.params.id)
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' })
    }
    res.json({ payment })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch payment' })
  }
})

export default router
