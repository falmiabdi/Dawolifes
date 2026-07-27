import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IVehicle extends Document {
  // Basic Vehicle Information
  title: string
  vehicleId: string
  listingType: 'For Sale' | 'For Rent' | 'Both'
  vehicleCategory: string
  make: string
  vehicleModel: string
  trimVersion?: string
  manufacturingYear: number
  registrationYear?: number
  vin?: string
  engineNumber?: string
  plateNumber?: string
  color: string
  countryOfOrigin: string

  // Technical Specifications
  fuelType?: string
  engineSize?: number
  horsepower?: number
  transmission?: string
  drivetrain?: string
  cylinders?: number
  seatingCapacity?: number
  doors?: number
  mileage?: number
  fuelConsumption?: string
  fuelTankCapacity?: number
  groundClearance?: number
  weight?: number
  tireSize?: string

  // Vehicle Condition
  condition: string
  accidentFree?: boolean
  accidentHistory?: string
  serviceHistoryAvailable?: boolean
  ownershipCount?: number
  imported?: boolean
  locallyAssembled?: boolean

  // Features (combined safety, interior, exterior)
  safetyFeatures: string[]
  interiorFeatures: string[]
  exteriorFeatures: string[]

  // Rental Specifications
  dailyRate?: number
  weeklyRate?: number
  monthlyRate?: number
  securityDeposit?: number
  minRentalDays?: number
  maxRentalDays?: number
  driverIncluded?: boolean
  selfDrive?: boolean
  fuelPolicy?: string
  mileageLimit?: number
  extraKmCharge?: number
  deliveryAvailable?: boolean
  airportPickup?: boolean
  availableLocations?: string[]
  availableDates?: string
  driverAgeRequirement?: number
  minDrivingExperience?: number
  drivingLicenseRequired?: string
  passportRequired?: boolean
  smokingAllowed?: boolean
  petsAllowed?: boolean
  offroadAllowed?: boolean
  crossborderAllowed?: boolean
  insuranceIncluded?: boolean
  damageLiability?: string

  // Sale Specifications
  sellingPrice?: number
  negotiable?: boolean
  financingAvailable?: boolean
  exchangeAccepted?: boolean
  bankLoanAccepted?: boolean

  // Ethiopian Legal Information
  regionRegistration?: string
  ownershipCertificate?: boolean
  roadFundPaid?: boolean
  insuranceValid?: boolean
  inspectionCertificate?: boolean
  customsClearance?: boolean
  dutyPaid?: boolean
  plateType?: string

  // Location Information
  region: string
  city: string
  subCity?: string
  woreda?: string
  latitude?: number
  longitude?: number
  pickupAddress?: string

  // Description
  description?: string

  // Media
  images: string[]
  videoUrl?: string

  // Common
  price: number
  priceType: string
  features: string[]
  featured?: boolean
  agentId: string
  agentName: string
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Sold' | 'Rented'
  views?: number
  favorites?: number

  createdAt: Date
  updatedAt: Date
}

const VehicleSchema = new Schema<IVehicle>(
  {
    // Basic Vehicle Information
    title: { type: String, required: true, trim: true },
    vehicleId: { type: String, required: true, unique: true },
    listingType: { type: String, enum: ['For Sale', 'For Rent', 'Both'], required: true },
    vehicleCategory: { type: String, required: true },
    make: { type: String, required: true },
    vehicleModel: { type: String, required: true },
    trimVersion: { type: String },
    manufacturingYear: { type: Number, required: true, min: 1900, max: 2030 },
    registrationYear: { type: Number, min: 1900, max: 2030 },
    vin: { type: String },
    engineNumber: { type: String },
    plateNumber: { type: String },
    color: { type: String, required: true },
    countryOfOrigin: { type: String, required: true },

    // Technical Specifications
    fuelType: { type: String },
    engineSize: { type: Number },
    horsepower: { type: Number },
    transmission: { type: String },
    drivetrain: { type: String },
    cylinders: { type: Number },
    seatingCapacity: { type: Number },
    doors: { type: Number },
    mileage: { type: Number },
    fuelConsumption: { type: String },
    fuelTankCapacity: { type: Number },
    groundClearance: { type: Number },
    weight: { type: Number },
    tireSize: { type: String },

    // Vehicle Condition
    condition: { type: String, required: true },
    accidentFree: { type: Boolean },
    accidentHistory: { type: String },
    serviceHistoryAvailable: { type: Boolean },
    ownershipCount: { type: Number },
    imported: { type: Boolean },
    locallyAssembled: { type: Boolean },

    // Features
    safetyFeatures: { type: [String], default: [] },
    interiorFeatures: { type: [String], default: [] },
    exteriorFeatures: { type: [String], default: [] },

    // Rental Specifications
    dailyRate: { type: Number },
    weeklyRate: { type: Number },
    monthlyRate: { type: Number },
    securityDeposit: { type: Number },
    minRentalDays: { type: Number },
    maxRentalDays: { type: Number },
    driverIncluded: { type: Boolean },
    selfDrive: { type: Boolean },
    fuelPolicy: { type: String },
    mileageLimit: { type: Number },
    extraKmCharge: { type: Number },
    deliveryAvailable: { type: Boolean },
    airportPickup: { type: Boolean },
    availableLocations: { type: [String] },
    availableDates: { type: String },
    driverAgeRequirement: { type: Number },
    minDrivingExperience: { type: Number },
    drivingLicenseRequired: { type: String },
    passportRequired: { type: Boolean },
    smokingAllowed: { type: Boolean },
    petsAllowed: { type: Boolean },
    offroadAllowed: { type: Boolean },
    crossborderAllowed: { type: Boolean },
    insuranceIncluded: { type: Boolean },
    damageLiability: { type: String },

    // Sale Specifications
    sellingPrice: { type: Number },
    negotiable: { type: Boolean },
    financingAvailable: { type: Boolean },
    exchangeAccepted: { type: Boolean },
    bankLoanAccepted: { type: Boolean },

    // Ethiopian Legal Information
    regionRegistration: { type: String },
    ownershipCertificate: { type: Boolean },
    roadFundPaid: { type: Boolean },
    insuranceValid: { type: Boolean },
    inspectionCertificate: { type: Boolean },
    customsClearance: { type: Boolean },
    dutyPaid: { type: Boolean },
    plateType: { type: String },

    // Location Information
    region: { type: String, required: true },
    city: { type: String, required: true },
    subCity: { type: String },
    woreda: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    pickupAddress: { type: String },

    // Description
    description: { type: String },

    // Media
    images: { type: [String], default: [] },
    videoUrl: { type: String },

    // Common
    price: { type: Number, required: true },
    priceType: { type: String, required: true },
    features: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    agentId: { type: String, required: true },
    agentName: { type: String, required: true },
    status: {
      type: String,
      enum: ['Draft', 'Pending', 'Approved', 'Rejected', 'Sold', 'Rented'],
      default: 'Draft',
    },
    views: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const VehicleModel: Model<IVehicle> =
  (mongoose.models.Vehicle as Model<IVehicle>) || mongoose.model<IVehicle>('Vehicle', VehicleSchema)
