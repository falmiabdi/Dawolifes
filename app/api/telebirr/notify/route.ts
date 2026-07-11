import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { PaymentModel } from '@/lib/models/payment'
import { telebirrConfig } from '@/lib/telebirr-config'
import { verifySignature, buildNotifySignString } from '@/lib/telebirr-utils'

function parseBody(body: any): Record<string, any> {
  if (typeof body === 'object' && body !== null) return body
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      const params = new URLSearchParams(body)
      const result: Record<string, any> = {}
      params.forEach((value, key) => {
        result[key] = value
      })
      return result
    }
  }
  return {}
}

function extractMerchOrderId(body: Record<string, any>): string {
  if (body.merch_order_id) return body.merch_order_id
  if (body.biz_content) {
    try {
      const biz = typeof body.biz_content === 'string' ? JSON.parse(body.biz_content) : body.biz_content
      if (biz.merch_order_id) return biz.merch_order_id
    } catch {}
  }
  return ''
}

function extractField(body: Record<string, any>, field: string): string {
  if (body[field]) return String(body[field])
  if (body.biz_content) {
    try {
      const biz = typeof body.biz_content === 'string' ? JSON.parse(body.biz_content) : body.biz_content
      if (biz[field]) return String(biz[field])
    } catch {}
  }
  return ''
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let rawBody: any
    let body: Record<string, any>

    if (contentType.includes('application/json')) {
      rawBody = await request.json()
      body = parseBody(rawBody)
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text()
      body = parseBody(text)
      rawBody = body
    } else {
      const text = await request.text()
      body = parseBody(text)
      rawBody = body
    }

    console.log('[Telebirr Notify] Content-Type:', contentType)
    console.log('[Telebirr Notify] Payment notification received:', JSON.stringify(body))

    if (body.sign && telebirrConfig.publicKey) {
      const signStr = buildNotifySignString(body)
      const valid = verifySignature(signStr, body.sign, telebirrConfig.publicKey)
      if (!valid) {
        console.error('[Telebirr Notify] Signature verification failed')
        console.error('[Telebirr Notify] Sign string:', signStr)
        console.error('[Telebirr Notify] Expected sign:', body.sign)
      } else {
        console.log('[Telebirr Notify] Signature verified successfully')
      }
    }

    await connectToDatabase()

    const merchOrderId = extractMerchOrderId(body)
    if (!merchOrderId) {
      console.error('[Telebirr Notify] Missing merch_order_id in body:', JSON.stringify(body))
      return NextResponse.json({ code: 'FAIL', message: 'Missing merch_order_id' }, { status: 400 })
    }

    console.log(`[Telebirr Notify] Looking up payment for order: ${merchOrderId}`)

    const payment = await PaymentModel.findOne({ merchOrderId })
    if (!payment) {
      console.error(`[Telebirr Notify] Payment not found for order: ${merchOrderId}`)
      return NextResponse.json({ code: 'FAIL', message: 'Payment not found' }, { status: 404 })
    }

    const resultCode = extractField(body, 'result_code')
    const transactionId = extractField(body, 'transaction_id')
    const buyerPhone = extractField(body, 'buyer_phone_number')

    console.log(`[Telebirr Notify] resultCode=${resultCode}, txId=${transactionId}, phone=${buyerPhone}`)

    if (resultCode === '000000') {
      payment.status = 'Completed'
      payment.buyerPhone = buyerPhone
      payment.telebirrTxId = transactionId
    } else if (resultCode === '000001' || resultCode === '000002') {
      payment.status = 'Failed'
    } else if (resultCode) {
      payment.status = 'Failed'
    }

    payment.notifyData = rawBody
    await payment.save()

    console.log(`[Telebirr Notify] Payment ${merchOrderId} updated to: ${payment.status}`)

    return NextResponse.json({ code: 'SUCCESS', message: 'Notification processed' })
  } catch (error: any) {
    console.error('[Telebirr Notify] Error:', error.message, error.stack)
    return NextResponse.json({ code: 'FAIL', message: error.message || 'Internal error' }, { status: 500 })
  }
}
