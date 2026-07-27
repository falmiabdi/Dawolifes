import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IProperty extends Document {
  title: string
  type: string
  listingType: 'For Sale' | 'For Rent'
  price: number
  priceType: string
  region: string
  city: string
  subCity?: string
  woreda?: string
  kebele?: string
  parcel?: string
  block?: string
  homeNo?: string
  area?: number
  bedrooms?: number
  bathrooms?: number
  condition?: string
  legalizedYear?: number
  description?: string
  features: string[]
  images: string[]
  videoUrl?: string
  featured?: boolean
  agentId: string
  agentName: string
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Sold' | 'Rented'
  latitude?: number
  longitude?: number
  createdAt: Date
  updatedAt: Date
}

const PropertySchema = new Schema<IProperty>(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, required: true },
    listingType: { type: String, enum: ['For Sale', 'For Rent'], required: true },
    price: { type: Number, required: true },
    priceType: { type: String, required: true },
    region: { type: String, required: true },
    city: { type: String, required: true },
    subCity: { type: String },
    woreda: { type: String },
    kebele: { type: String },
    parcel: { type: String },
    block: { type: String },
    homeNo: { type: String },
    area: { type: Number },
    bedrooms: { type: Number, min: 0 },
    bathrooms: { type: Number, min: 0 },
    condition: { type: String },
    legalizedYear: { type: Number, min: 1900, max: 2030 },
    description: { type: String },
    features: { type: [String], default: [] },
    images: { type: [String], default: [] },
    videoUrl: { type: String },
    featured: { type: Boolean, default: false },
    agentId: { type: String, required: true },
    agentName: { type: String, required: true },
    status: {
      type: String,
      enum: ['Draft', 'Pending', 'Approved', 'Rejected', 'Sold', 'Rented'],
      default: 'Draft',
    },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { timestamps: true }
)

export const PropertyModel: Model<IProperty> =
  (mongoose.models.Property as Model<IProperty>) || mongoose.model<IProperty>('Property', PropertySchema)
