import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

function isWebhookAuthorized(req: any): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[Chapa] PAYMENT_WEBHOOK_SECRET not set — webhook not authenticated (dev only)')
    return true
  }
  const header = req.headers['x-webhook-secret'] || req.headers['x-chapa-signature']
  return header === secret
}

async function verifyChapaTransaction(txRef: string): Promise<boolean | null> {
  const key = process.env.CHAPA_SECRET_KEY
  if (!key) return null // not configured — fall back to webhook-provided status
  const res = await fetch(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!res.ok) return false
  const data: any = await res.json()
  return data?.data?.status === 'success'
}

// Initialize a Chapa transaction
router.post('/initialize', async (req, res) => {
  try {
    const { title, amount, propertyId, propertyTitle, paymentType, email, firstName, lastName, phoneNumber } = req.body

    if (!title || !amount || !email || !firstName || !lastName || !phoneNumber) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const paymentTypeVal = paymentType || 'service_charge'

    // Prevent duplicate payments for the same item + buyer.
    const completed = await prisma.payment.findFirst({
      where: { propertyId: propertyId || null, buyerEmail: email, status: 'Completed', method: 'chapa' },
    })
    if (completed) {
      return res.status(409).json({ message: 'Payment already completed for this item' })
    }
    const existing = await prisma.payment.findFirst({
      where: {
        propertyId: propertyId || null,
        buyerEmail: email,
        status: 'Pending',
        method: 'chapa',
        paymentType: paymentTypeVal,
      },
    })
    if (existing) {
      return res.json({
        checkoutUrl: `https://checkout.chapa.co/checkout/payment/${existing.txRef}`,
        txRef: existing.txRef,
        orderId: existing.orderId,
        duplicate: true,
      })
    }

    const txRef = `CHAPA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const orderId = uuidv4()
    const checkoutUrl = `https://checkout.chapa.co/checkout/payment/${txRef}`

    // Record payment in DB
    await prisma.payment.create({
      data: {
        id: orderId,
        orderId,
        merchOrderId: txRef,
        txRef,
        status: 'Pending',
        amount: Number(amount),
        currency: 'ETB',
        method: 'chapa',
        paymentType: paymentTypeVal,
        buyerName: `${firstName} ${lastName}`,
        buyerEmail: email,
        buyerPhone: phoneNumber,
        propertyId: propertyId || null,
        propertyTitle: propertyTitle || title,
      },
    })

    res.json({ checkoutUrl, txRef, orderId })
  } catch (err: any) {
    console.error('[Chapa Initialize Error]', err)
    res.status(500).json({ message: err.message || 'Failed to initialize payment' })
  }
})

// Verify a Chapa transaction (webhook / polling)
router.get('/verify', async (req, res) => {
  try {
    const { txRef } = req.query
    if (!txRef) return res.status(400).json({ message: 'txRef required' })

    const payment = await prisma.payment.findFirst({ where: { txRef: String(txRef) } })
    if (!payment) return res.status(404).json({ message: 'Payment not found' })

    res.json({
      status: payment.status,
      txRef: payment.txRef,
      amount: payment.amount,
      method: payment.method,
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Verification failed' })
  }
})

// Chapa webhook callback
router.post('/webhook', async (req, res) => {
  try {
    const { trx_ref, status } = req.body
    if (!trx_ref) return res.status(400).json({ message: 'trx_ref required' })

    if (!isWebhookAuthorized(req)) {
      return res.status(401).json({ message: 'Unauthorized webhook' })
    }

    const payment = await prisma.payment.findFirst({ where: { txRef: trx_ref } })
    if (payment) {
      let newStatus: any = status === 'success' ? 'Completed' : 'Failed'
      const verified = await verifyChapaTransaction(String(trx_ref))
      if (verified !== null) {
        newStatus = verified ? 'Completed' : 'Failed'
      }
      await prisma.payment.update({ where: { id: payment.id }, data: { status: newStatus } })
    }

    res.json({ message: 'Webhook received' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Webhook processing failed' })
  }
})

export default router
