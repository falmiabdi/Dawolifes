import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { PaymentModel } from '@/lib/models/payment'
import { verifyTransaction } from '@/lib/chapa-service'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log('[Chapa Webhook] Received:', JSON.stringify(body))

    const txRef = body.tx_ref || body.trx_ref
    if (!txRef) {
      console.error('[Chapa Webhook] Missing tx_ref in body:', JSON.stringify(body))
      return NextResponse.json({ message: 'Missing tx_ref' }, { status: 400 })
    }

    await connectToDatabase()

    const payment = await PaymentModel.findOne({ txRef })
    if (!payment) {
      console.error(`[Chapa Webhook] Payment not found for txRef: ${txRef}`)
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 })
    }

    const verification = await verifyTransaction(txRef)

    console.log(`[Chapa Webhook] Verification result:`, verification)

    if (verification.status === 'success') {
      payment.status = 'Completed'
      payment.chapaTxId = verification.refId
    } else if (verification.status === 'failed') {
      payment.status = 'Failed'
    }
    // 'pending' status leaves the payment as-is (still Pending)

    payment.notifyData = body
    await payment.save()

    console.log(`[Chapa Webhook] Payment ${txRef} updated to: ${payment.status}`)

    return NextResponse.json({ message: 'Webhook processed' })
  } catch (error: any) {
    console.error('[Chapa Webhook] Error:', error.message, error.stack)
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}
