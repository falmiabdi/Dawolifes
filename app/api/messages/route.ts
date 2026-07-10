import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectToDatabase } from '@/lib/db'
import { MessageModel } from '@/lib/models/message'
import '@/lib/models/user'
import '@/lib/models/property'

// GET — list conversations for an agent, or messages for a conversation
export async function GET(request: Request) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const propertyId = searchParams.get('propertyId')
    const buyerEmail = searchParams.get('buyerEmail')

    // Agent fetching their conversations
    if (agentId) {
      const conversations = await MessageModel.aggregate([
        { $match: { agentId: new mongoose.Types.ObjectId(agentId) } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: { propertyId: '$propertyId', buyerEmail: '$buyerEmail' },
            lastMessage: { $first: '$text' },
            lastTime: { $first: '$createdAt' },
            buyerName: { $first: '$buyerName' },
            buyerEmail: { $first: '$buyerEmail' },
            buyerPhone: { $first: '$buyerPhone' },
            propertyId: { $first: '$propertyId' },
            unread: {
              $sum: { $cond: [{ $and: [{ $eq: ['$sender', 'buyer'] }, { $eq: ['$read', false] }] }, 1, 0] },
            },
          },
        },
        { $sort: { lastTime: -1 } },
      ])

      // Populate property title
      const PropertyModel = (await import('@/lib/models/property')).PropertyModel
      const propertyIds = conversations.map((c: any) => c.propertyId)
      const props = await PropertyModel.find({ _id: { $in: propertyIds } }).select('title').lean()
      const propMap = new Map(props.map((p: any) => [p._id.toString(), p.title]))

      const result = conversations.map((c: any) => ({
        id: `${c.propertyId}-${c.buyerEmail}`,
        propertyId: c.propertyId.toString(),
        propertyName: propMap.get(c.propertyId.toString()) || 'Unknown Property',
        buyerName: c.buyerName,
        buyerEmail: c.buyerEmail,
        buyerPhone: c.buyerPhone,
        lastMessage: c.lastMessage,
        lastTime: c.lastTime,
        unread: c.unread,
      }))

      return NextResponse.json({ conversations: result })
    }

    // Buyer fetching their messages for a property
    if (propertyId && buyerEmail) {
      const messages = await MessageModel.find({
        propertyId,
        buyerEmail: buyerEmail.toLowerCase(),
      })
        .sort({ createdAt: 1 })
        .lean()

      return NextResponse.json({ messages })
    }

    return NextResponse.json({ message: 'Missing parameters' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 })
  }
}

// POST — send a message (buyer or agent)
export async function POST(request: Request) {
  try {
    await connectToDatabase()
    const body = await request.json()

    const { propertyId, agentId, buyerName, buyerEmail, buyerPhone, sender, text } = body

    if (!propertyId || !agentId || !buyerName || !sender || !text) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 })
    }

    const message = await MessageModel.create({
      propertyId,
      agentId,
      buyerName,
      buyerEmail: buyerEmail?.toLowerCase() || '',
      buyerPhone: buyerPhone || '',
      sender,
      text,
      read: sender === 'buyer' ? false : true,
    })

    return NextResponse.json({ message, ok: true })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 })
  }
}

// PATCH — mark messages as read
export async function PATCH(request: Request) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const { propertyId, buyerEmail, sender } = body

    if (!propertyId || !buyerEmail || !sender) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 })
    }

    await MessageModel.updateMany(
      { propertyId, buyerEmail: buyerEmail.toLowerCase(), sender, read: false },
      { $set: { read: true } }
    )

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 })
  }
}
