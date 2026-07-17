import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { PaymentModel } from '@/lib/models/payment'
import { verifyTransaction } from '@/lib/chapa-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const txRef = searchParams.get('txRef')
    const paymentId = searchParams.get('paymentId')

    if (!txRef && !paymentId) {
      return NextResponse.json({ message: 'txRef or paymentId is required' }, { status: 400 })
    }

    await connectToDatabase()

    const query: Record<string, any> = {}
    if (txRef) query.txRef = txRef
    if (paymentId) query._id = paymentId

    const payment = await PaymentModel.findOne(query).lean()

    if (!payment) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 })
    }

    if (txRef && payment.status === 'Pending') {
      try {
        const verification = await verifyTransaction(txRef)
        if (verification.status === 'success' && payment.status !== 'Completed') {
          await PaymentModel.findOneAndUpdate(
            { txRef },
            { status: 'Completed', chapaTxId: verification.refId }
          )
          return NextResponse.json({
            status: 'Completed',
            orderId: payment.orderId,
            amount: payment.amount,
            title: payment.title,
            txRef: payment.txRef,
            createdAt: payment.createdAt,
          })
        }
      } catch {
        // If verification fails, just return the current DB status
      }
    }

    return NextResponse.json({
      status: payment.status,
      orderId: payment.orderId,
      amount: payment.amount,
      title: payment.title,
      txRef: payment.txRef,
      chapaTxId: payment.chapaTxId,
      createdAt: payment.createdAt,
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to get status' }, { status: 500 })
  }
}
