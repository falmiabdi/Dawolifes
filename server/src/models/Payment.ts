import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPayment extends Document {
  orderId: string
  merchOrderId: string
  txRef: string
  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded' | 'Expired'
  amount: number
  currency: string
  method: 'chapa' | 'telebirr'
  paymentType: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  propertyId?: string
  propertyTitle?: string
  notificationData?: any
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: { type: String, required: true, unique: true },
    merchOrderId: { type: String, required: true },
    txRef: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded', 'Expired'],
      default: 'Pending',
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'ETB' },
    method: { type: String, enum: ['chapa', 'telebirr'], required: true },
    paymentType: { type: String, required: true },
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    buyerPhone: { type: String, required: true },
    propertyId: { type: String },
    propertyTitle: { type: String },
    notificationData: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
)

export const PaymentModel: Model<IPayment> =
  (mongoose.models.Payment as Model<IPayment>) || mongoose.model<IPayment>('Payment', PaymentSchema)
