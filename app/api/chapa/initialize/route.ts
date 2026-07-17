import { NextResponse } from 'next/server'
import { initializeTransaction, createTxRef } from '@/lib/chapa-service'
import { connectToDatabase } from '@/lib/db'
import { PaymentModel } from '@/lib/models/payment'

export async function POST(request: Request) {
  console.log('[Chapa Initialize] === Request received ===')
  console.log('[Chapa Initialize] Secret key exists:', !!process.env.CHAPA_SECRET_KEY)
  console.log('[Chapa Initialize] Key prefix:', process.env.CHAPA_SECRET_KEY?.substring(0, 15))

  try {
    const body = await request.json()
    console.log('[Chapa Initialize] Body:', JSON.stringify(body))

    const { title, amount, userId, propertyId, propertyTitle, paymentType, email, firstName, lastName, phoneNumber } = body

    if (!title || !amount) {
      return NextResponse.json({ message: 'Title and amount are required' }, { status: 400 })
    }

    console.log('[Chapa Initialize] Connecting to DB...')
    await connectToDatabase()

    const txRef = createTxRef()
    console.log('[Chapa Initialize] txRef:', txRef)

    console.log('[Chapa Initialize] Calling initializeTransaction...')
    const result = await initializeTransaction({
      amount: String(amount),
      txRef,
      email,
      firstName,
      lastName,
      phoneNumber,
      title: title,
      description: paymentType ? paymentType.replace(/_/g, ' ') : 'Payment',
    })

    console.log('[Chapa Initialize] Chapa result:', JSON.stringify(result))

    console.log('[Chapa Initialize] Saving payment to DB...')
    const payment = await PaymentModel.create({
      orderId: `CHAPA-${txRef}`,
      merchOrderId: txRef,
      userId: userId || '',
      propertyId: propertyId || '',
      propertyTitle: propertyTitle || '',
      title,
      amount: Number(amount),
      status: 'Pending',
      paymentType: paymentType || 'service_charge',
      method: 'Chapa',
      txRef,
      rawRequest: result.checkoutUrl,
    })

    console.log('[Chapa Initialize] Payment saved:', payment._id)

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      txRef: result.txRef,
      paymentId: payment._id.toString(),
    })
  } catch (error: any) {
    console.error('[Chapa Initialize] === ERROR ===')
    console.error('[Chapa Initialize] Message:', error.message)
    console.error('[Chapa Initialize] Stack:', error.stack)
    return NextResponse.json({ message: error.message || 'Failed to initialize payment' }, { status: 500 })
  }
}
