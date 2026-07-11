import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { NotificationModel } from '@/lib/models/notification'
import { getSessionFromRequest } from '@/lib/auth-session'

export async function GET(req: Request) {
  const session = await getSessionFromRequest()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const unreadOnly = url.searchParams.get('unread') === 'true'
  const countOnly = url.searchParams.get('count') === 'true'

  await connectToDatabase()

  const filter: any = { userId: session.userId }
  if (unreadOnly) {
    filter.isRead = false
  }

  if (countOnly) {
    const count = await NotificationModel.countDocuments(filter)
    return NextResponse.json({ count })
  }

  const notifications = await NotificationModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      description: n.message,
      type: n.type,
      isRead: n.isRead,
      time: formatTime(n.createdAt),
    })),
  })
}

export async function POST(req: Request) {
  const session = await getSessionFromRequest()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { userId, title, message, type } = body

  if (!userId || !title || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  await connectToDatabase()

  const notification = await NotificationModel.create({
    userId,
    title,
    message,
    type: type || 'info',
  })

  return NextResponse.json({
    notification: {
      id: notification._id.toString(),
      title: notification.title,
      description: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      time: 'Just now',
    },
  }, { status: 201 })
}

export async function PATCH(req: Request) {
  const session = await getSessionFromRequest()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { markAllRead, notificationId } = body

  await connectToDatabase()

  if (markAllRead) {
    await NotificationModel.updateMany(
      { userId: session.userId, isRead: false },
      { isRead: true },
    )
    return NextResponse.json({ ok: true })
  }

  if (notificationId) {
    await NotificationModel.findOneAndUpdate(
      { _id: notificationId, userId: session.userId },
      { isRead: true },
    )
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}
