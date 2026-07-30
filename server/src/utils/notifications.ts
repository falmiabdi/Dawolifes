import { NotificationModel } from '../models/index.js'
import { broadcastToUser } from '../ws/server.js'

export async function createAndBroadcastNotification(
  userId: string,
  title: string,
  body: string,
  type: string = 'info',
  data?: any
) {
  const notification = await NotificationModel.create({
    userId,
    title,
    body,
    type,
    data,
  } as any)

  broadcastToUser(userId, {
    type: 'notification',
    notification: {
      id: notification.getDataValue('id'),
      userId: notification.getDataValue('userId'),
      title: notification.getDataValue('title'),
      body: notification.getDataValue('body'),
      type: notification.getDataValue('type'),
      read: notification.getDataValue('read'),
      data: notification.getDataValue('data'),
      createdAt: notification.getDataValue('createdAt'),
    },
  })

  return notification
}

export async function notifyAdmins(
  title: string,
  body: string,
  type: string = 'info',
  data?: any
) {
  const { UserModel } = await import('../models/index.js')
  const admins = await UserModel.findAll({
    where: { role: 'admin' },
    attributes: ['id'],
  })

  for (const admin of admins) {
    await createAndBroadcastNotification(
      admin.getDataValue('id'),
      title,
      body,
      type,
      data
    )
  }
}
