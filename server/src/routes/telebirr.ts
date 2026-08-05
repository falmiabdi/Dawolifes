import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

function isNotifyAuthorized(req: any): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[TeleBirr] PAYMENT_WEBHOOK_SECRET not set — notify not authenticated (dev only)')
    return true
  }
  const header = req.headers['x-webhook-secret'] || req.headers['x-telebirr-signature']
  return header === secret
}

// Create a TeleBirr order
router.post('/create-order', async (req, res) => {
  try {
    const { title, amount, propertyId, propertyTitle, paymentType } = req.body

    if (!title || !amount) {
      return res.status(400).json({ message: 'Missing title or amount' })
    }

    const paymentTypeVal = paymentType || 'service_charge'

    // Prevent duplicate payments for the same item.
    const completed = await prisma.payment.findFirst({
      where: { propertyId: propertyId || null, status: 'Completed', method: 'telebirr' },
    })
    if (completed) {
      return res.status(409).json({ message: 'Payment already completed for this item' })
    }
    const existing = await prisma.payment.findFirst({
      where: { propertyId: propertyId || null, status: 'Pending', method: 'telebirr', paymentType: paymentTypeVal },
    })
    if (existing) {
      return res.json({
        toPayUrl: `https://app.ethiotelebirr.et/payment/h5/?merch_order_id=${existing.merchOrderId}`,
        merchOrderId: existing.merchOrderId,
        orderId: existing.orderId,
        duplicate: true,
      })
    }

    const merchOrderId = `TB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const orderId = uuidv4()
    const toPayUrl = `https://app.ethiotelebirr.et/payment/h5/?merch_order_id=${merchOrderId}`

    // Record payment in DB
    await prisma.payment.create({
      data: {
        id: orderId,
        orderId,
        merchOrderId,
        txRef: merchOrderId,
        status: 'Pending',
        amount: Number(amount),
        currency: 'ETB',
        method: 'telebirr',
        paymentType: paymentTypeVal,
        buyerName: 'TeleBirr User',
        buyerEmail: 'customer@telebirr.et',
        buyerPhone: '0900000000',
        propertyId: propertyId || null,
        propertyTitle: propertyTitle || title,
      },
    })

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

    const payment = await prisma.payment.findFirst({ where: { merchOrderId: String(merchOrderId) } })
    if (!payment) return res.status(404).json({ message: 'Payment not found' })

    res.json({
      status: payment.status,
      merchOrderId: payment.merchOrderId,
      amount: payment.amount,
      method: payment.method,
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

    if (!isNotifyAuthorized(req)) {
      return res.status(401).json({ message: 'Unauthorized notification' })
    }

    const payment = await prisma.payment.findFirst({ where: { merchOrderId: merch_order_id } })
    if (payment) {
      const newStatus = status === 'success' || status === 'SUCCESS' ? 'Completed' : 'Failed'
      await prisma.payment.update({ where: { id: payment.id }, data: { status: newStatus } })
    }

    res.json({ message: 'Notification received' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Notification processing failed' })
  }
})

export default router
