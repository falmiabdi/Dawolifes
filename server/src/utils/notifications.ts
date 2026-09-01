import { prisma } from '../lib/prisma.js'
import { broadcastToUser } from '../ws/server.js'
import { sendPushToUser } from './fcm.js'

export async function createAndBroadcastNotification(
  userId: string,
  title: string,
  body: string,
  type: string = 'info',
  data?: any
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      body,
      type,
      data: data ?? undefined,
    },
  })

  broadcastToUser(userId, {
    type: 'notification',
    notification: {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      read: notification.read,
      data: notification.data,
      createdAt: notification.createdAt,
    },
  })

  // Fire-and-forget: FCM failures must never break the caller.
  await sendPushToUser(userId, title, body, type, data)

  return notification
}

export async function notifyAdmins(
  title: string,
  body: string,
  type: string = 'info',
  data?: any
) {
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true },
  })

  for (const admin of admins) {
    await createAndBroadcastNotification(admin.id, title, body, type, data)
  }
}
