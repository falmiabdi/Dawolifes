import mongoose, { Schema, model, models } from 'mongoose'

const messageSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    agentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, default: '' },
    buyerPhone: { type: String, default: '' },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    sender: { type: String, enum: ['buyer', 'agent'], required: true },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

messageSchema.index({ propertyId: 1, agentId: 1, buyerEmail: 1 })

export const MessageModel = models.Message || model('Message', messageSchema)
