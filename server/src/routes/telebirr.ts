import { Router } from 'express'
import { PaymentModel } from '../models/index.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// Create a TeleBirr order
router.post('/create-order', async (req, res) => {
  try {
    const { title, amount, propertyId, propertyTitle, paymentType } = req.body

    if (!title || !amount) {
      return res.status(400).json({ message: 'Missing title or amount' })
    }

    const merchOrderId = `TB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const orderId = uuidv4()
    const toPayUrl = `https://app.ethiotelebirr.et/payment/h5/?merch_order_id=${merchOrderId}`

    // Record payment in DB
    await PaymentModel.create({
      id: orderId,
      orderId,
      merchOrderId,
      txRef: merchOrderId,
      status: 'Pending',
      amount: Number(amount),
      currency: 'ETB',
      method: 'telebirr',
      paymentType: paymentType || 'service_charge',
      buyerName: 'TeleBirr User',
      buyerEmail: 'customer@telebirr.et',
      buyerPhone: '0900000000',
      propertyId: propertyId || null,
      propertyTitle: propertyTitle || title,
    } as any)

    res.json({ toPayUrl, merchOrderId, orderId })
  } catch (err: any) {
    console.error('[TeleBirr Create Order Error]', err)
    res.status(500).json({ message: err.message || 'Failed to create order' })
  }
})

// Check TeleBirr payment status
router.get('/status', async (req, res) => {
  try {
    const { merchOrderId } = req.query
    if (!merchOrderId) return res.status(400).json({ message: 'merchOrderId required' })

    const payment = await PaymentModel.findOne({ where: { merchOrderId: String(merchOrderId) } as any })
    if (!payment) return res.status(404).json({ message: 'Payment not found' })

    res.json({
      status: payment.getDataValue('status'),
      merchOrderId: payment.getDataValue('merchOrderId'),
      amount: payment.getDataValue('amount'),
      method: payment.getDataValue('method'),
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Status check failed' })
  }
})

// TeleBirr webhook callback
router.post('/notify', async (req, res) => {
  try {
    const { merch_order_id, status } = req.body
    if (!merch_order_id) return res.status(400).json({ message: 'merch_order_id required' })

    const payment = await PaymentModel.findOne({ where: { merchOrderId: merch_order_id } as any })
    if (payment) {
      const newStatus = status === 'success' || status === 'SUCCESS' ? 'Completed' : 'Failed'
      await payment.update({ status: newStatus })
    }

    res.json({ message: 'Notification received' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Notification processing failed' })
  }
})

export default router
