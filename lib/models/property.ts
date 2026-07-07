import mongoose, { Schema, model, models } from 'mongoose'

const propertySchema = new Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ['House', 'Apartment', 'Land', 'Commercial', 'Villa', 'Condo'], required: true },
    listingType: { type: String, enum: ['For Rent', 'For Sale'], required: true },
    price: { type: Number, required: true },
    priceType: { type: String, default: 'Fixed Price' },
    region: { type: String, required: true },
    city: { type: String, required: true },
    subCity: { type: String, default: '' },
    woreda: { type: String, default: '' },
    kebele: { type: String, default: '' },
    parcel: { type: String, default: '' },
    block: { type: String, default: '' },
    homeNo: { type: String, default: '' },
    area: { type: Number, default: 0 },
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    condition: { type: String, default: 'Finished' },
    yearBuilt: { type: Number, default: new Date().getFullYear() },
    description: { type: String, default: '' },
    features: { type: [String], default: [] },
    images: { type: [String], default: [] },
    agentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  },
  {
    timestamps: true,
  },
)

export const PropertyModel = models.Property || model('Property', propertySchema)
