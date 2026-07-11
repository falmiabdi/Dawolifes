import mongoose, { Schema, model, models } from 'mongoose'

const notificationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

notificationSchema.index({ userId: 1, isRead: 1 })
notificationSchema.index({ userId: 1, createdAt: -1 })

export const NotificationModel = models.Notification || model('Notification', notificationSchema)
