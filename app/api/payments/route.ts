import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { PaymentModel } from '@/lib/models/payment'
import '@/lib/models/user'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'admin'
    const userId = searchParams.get('userId') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    await connectToDatabase()

    const query: Record<string, any> = {}
    if (role === 'agent' && userId) {
      query.userId = userId
    }
    if (status) {
      query.status = status
    }

    const skip = (page - 1) * limit
    const [payments, total] = await Promise.all([
      PaymentModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'fullName username email')
        .lean(),
      PaymentModel.countDocuments(query),
    ])

    const stats = await PaymentModel.aggregate([
      ...(role === 'agent' && userId ? [{ $match: { userId } }] : []),
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, '$amount', 0] } },
          completedCount: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          failedCount: { $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] } },
          totalCount: { $sum: 1 },
        },
      },
    ])

    return NextResponse.json({
      payments: payments.map((p) => ({
        _id: p._id,
        orderId: p.orderId,
        merchOrderId: p.merchOrderId,
        title: p.title,
        amount: p.amount,
        status: p.status,
        method: p.method,
        paymentType: p.paymentType,
        buyerPhone: p.buyerPhone,
        createdAt: p.createdAt,
        user: p.userId && typeof p.userId === 'object'
          ? { fullName: (p.userId as any).fullName, username: (p.userId as any).username }
          : null,
      })),
      stats: stats[0] || { totalRevenue: 0, completedCount: 0, pendingCount: 0, failedCount: 0, totalCount: 0 },
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch payments' }, { status: 500 })
  }
}
