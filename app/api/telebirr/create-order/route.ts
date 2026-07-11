import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/telebirr-service'
import { connectToDatabase } from '@/lib/db'
import { PaymentModel } from '@/lib/models/payment'

export async function POST(request: Request) {
  try {
    const { title, amount, userId, propertyId, propertyTitle, paymentType } = await request.json()

    if (!title || !amount) {
      return NextResponse.json({ message: 'Title and amount are required' }, { status: 400 })
    }

    await connectToDatabase()

    const result = await createOrder({
      title,
      amount: String(amount),
    })

    const payment = await PaymentModel.create({
      orderId: `ORD-${result.merchOrderId}`,
      merchOrderId: result.merchOrderId,
      prepayId: result.prepayId,
      userId: userId || '',
      propertyId: propertyId || '',
      propertyTitle: propertyTitle || '',
      title,
      amount: Number(amount),
      status: 'Pending',
      paymentType: paymentType || 'service_charge',
      method: 'Telebirr',
      rawRequest: result.toPayUrl,
    })

    return NextResponse.json({
      toPayUrl: result.toPayUrl,
      merchOrderId: result.merchOrderId,
      prepayId: result.prepayId,
      paymentId: payment._id.toString(),
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to create order' }, { status: 500 })
  }
}
