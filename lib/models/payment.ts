import mongoose, { Schema, model, models } from 'mongoose'

const paymentSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    merchOrderId: { type: String, required: true, unique: true, index: true },
    prepayId: { type: String, default: '' },
    userId: { type: String, default: '' },
    propertyId: { type: String, default: '' },
    propertyTitle: { type: String, default: '' },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'ETB' },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded', 'Expired'],
      default: 'Pending',
    },
    paymentType: {
      type: String,
      enum: ['service_charge', 'listing_fee', 'commission', 'subscription'],
      default: 'service_charge',
    },
    method: { type: String, default: 'Telebirr' },
    buyerPhone: { type: String, default: '' },
    buyerName: { type: String, default: '' },
    rawRequest: { type: String, default: '' },
    telebirrTxId: { type: String, default: '' },
    txRef: { type: String, default: '', index: true },
    chapaTxId: { type: String, default: '' },
    notifyData: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
  },
)

paymentSchema.index({ userId: 1, createdAt: -1 })
paymentSchema.index({ status: 1, createdAt: -1 })

export const PaymentModel = models.Payment || model('Payment', paymentSchema)
