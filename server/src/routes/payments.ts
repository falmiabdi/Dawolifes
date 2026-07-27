import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { PaymentModel } from '../models/Payment.js'

const router = Router()

// Get payments with stats
router.get('/', authMiddleware, async (req, res) => {
  try {
    const payments = await PaymentModel.find({})
      .sort({ createdAt: -1 })
      .limit(50)

    const stats = await PaymentModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ])

    res.json({ payments, stats })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch payments' })
  }
})

// Get payment by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const payment = await PaymentModel.findById(req.params.id)
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' })
    }
    res.json({ payment })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch payment' })
  }
})

export default router
