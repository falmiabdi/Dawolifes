import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { PaymentModel } from '@/lib/models/payment'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const merchOrderId = searchParams.get('merchOrderId')
    const paymentId = searchParams.get('paymentId')

    if (!merchOrderId && !paymentId) {
      return NextResponse.json({ message: 'merchOrderId or paymentId is required' }, { status: 400 })
    }

    await connectToDatabase()

    const query: Record<string, any> = {}
    if (merchOrderId) query.merchOrderId = merchOrderId
    if (paymentId) query._id = paymentId

    const payment = await PaymentModel.findOne(query).lean()

    if (!payment) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 })
    }

    return NextResponse.json({
      status: payment.status,
      orderId: payment.orderId,
      amount: payment.amount,
      title: payment.title,
      buyerPhone: payment.buyerPhone,
      telebirrTxId: payment.telebirrTxId,
      createdAt: payment.createdAt,
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to get status' }, { status: 500 })
  }
}
