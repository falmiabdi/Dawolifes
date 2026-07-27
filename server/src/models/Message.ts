import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IMessage extends Document {
  propertyId: string
  senderId: string
  senderName: string
  senderRole: string
  recipientId: string
  recipientName: string
  content: string
  read: boolean
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    propertyId: { type: String, required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },
    recipientId: { type: String, required: true },
    recipientName: { type: String, required: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const MessageModel: Model<IMessage> =
  (mongoose.models.Message as Model<IMessage>) || mongoose.model<IMessage>('Message', MessageSchema)
