import mongoose, { Schema, Document, Model } from 'mongoose'

export interface INotification extends Document {
  userId: string
  title: string
  body: string
  type: string
  read: boolean
  data?: any
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, required: true },
    read: { type: Boolean, default: false },
    data: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
)

export const NotificationModel: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) || mongoose.model<INotification>('Notification', NotificationSchema)
