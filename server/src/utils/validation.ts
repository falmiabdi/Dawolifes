import { z } from 'zod'

// Coerce numeric strings and strip empty/null values so both the web form
// (which submits strings) and the Flutter app (which submits numbers or
// null for blank optional fields) satisfy the same schema.
function toNumber(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isNaN(n) ? value : n
  }
  return value
}

export const num = (schema: z.ZodNumber) => z.preprocess(toNumber, schema)
export const optNum = (schema: z.ZodNumber) => z.preprocess(toNumber, schema.optional())
export const requiredStr = z.string().min(1)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isValidUuid = (value: unknown): boolean =>
  typeof value === 'string' && UUID_RE.test(value)

// Strip empty/null so blank optional fields (Flutter sends null) are dropped
// rather than rejected, while still validating anything that is present.
const strip = (value: unknown) => (value === undefined || value === null || value === '' ? undefined : value)
export const optStr = z.preprocess(strip, z.string().optional())
export const optBool = z.preprocess(strip, z.boolean().optional())
export const optArr = z.preprocess(strip, z.array(z.string()).optional())

export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: optStr,
  profilePhoto: z.string().url().optional(),
})

export const buyerRegisterSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().min(6).max(30),
  password: z.string().min(8).max(100),
  profilePhoto: z.string().url().optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(4).max(6),
  newPassword: z.string().min(8).max(100),
})

export const propertySchema = z.object({
  title: requiredStr.max(200),
  type: requiredStr,
  listingType: z.enum(['For Sale', 'For Rent']),
  price: num(z.number().positive()),
  priceType: z.string(),
  region: requiredStr,
  city: requiredStr,
  subCity: optStr,
  woreda: optStr,
  kebele: optStr,
  parcel: optStr,
  block: optStr,
  area: optNum(z.number().positive()),
  bedrooms: optNum(z.number().int().min(0)),
  bathrooms: optNum(z.number().int().min(0)),
  condition: optStr,
  legalizedYear: optNum(z.number().int().min(1900).max(2030)),
  description: optStr,
  features: optArr,
  images: optArr,
  videoUrl: optStr,
  latitude: optNum(z.number().min(-90).max(90)),
  longitude: optNum(z.number().min(-180).max(180)),
  name: optStr,
  phone: optStr,
  locationDocument: optStr,
  posterType: optStr,
  ownerType: optStr,
})

export const vehicleSchema = z.object({
  title: requiredStr.max(200),
  vehicleId: requiredStr,
  listingType: z.enum(['For Sale', 'For Rent', 'Both']),
  vehicleCategory: requiredStr,
  make: requiredStr,
  vehicleModel: requiredStr,
  trimVersion: optStr,
  manufacturingYear: num(z.number().int().min(1900).max(2030)),
  registrationYear: optNum(z.number().int().min(1900).max(2030)),
  vin: optStr,
  engineNumber: optStr,
  plateNumber: optStr,
  color: requiredStr,
  countryOfOrigin: requiredStr,
  fuelType: optStr,
  engineSize: optNum(z.number().positive()),
  horsepower: optNum(z.number().positive()),
  transmission: optStr,
  drivetrain: optStr,
  cylinders: optNum(z.number().int().positive()),
  seatingCapacity: optNum(z.number().int().positive()),
  doors: optNum(z.number().int().positive()),
  mileage: optNum(z.number().min(0)),
  fuelConsumption: optStr,
  fuelTankCapacity: optNum(z.number().positive()),
  groundClearance: optNum(z.number().positive()),
  weight: optNum(z.number().positive()),
  tireSize: optStr,
  condition: requiredStr,
  accidentFree: optBool,
  accidentHistory: optStr,
  serviceHistoryAvailable: optBool,
  ownershipCount: optNum(z.number().int().min(0)),
  imported: optBool,
  locallyAssembled: optBool,
  safetyFeatures: optArr,
  interiorFeatures: optArr,
  exteriorFeatures: optArr,
  dailyRate: optNum(z.number().positive()),
  weeklyRate: optNum(z.number().positive()),
  monthlyRate: optNum(z.number().positive()),
  securityDeposit: optNum(z.number().positive()),
  minRentalDays: optNum(z.number().int().positive()),
  maxRentalDays: optNum(z.number().int().positive()),
  driverIncluded: optBool,
  selfDrive: optBool,
  fuelPolicy: optStr,
  mileageLimit: optNum(z.number().int()),
  extraKmCharge: optNum(z.number().positive()),
  deliveryAvailable: optBool,
  airportPickup: optBool,
  availableLocations: optArr,
  availableDates: optStr,
  driverAgeRequirement: optNum(z.number().int()),
  minDrivingExperience: optNum(z.number().int()),
  drivingLicenseRequired: optStr,
  passportRequired: optBool,
  smokingAllowed: optBool,
  petsAllowed: optBool,
  offroadAllowed: optBool,
  crossborderAllowed: optBool,
  insuranceIncluded: optBool,
  damageLiability: optStr,
  sellingPrice: optNum(z.number().positive()),
  negotiable: optBool,
  financingAvailable: optBool,
  exchangeAccepted: optBool,
  bankLoanAccepted: optBool,
  regionRegistration: optStr,
  ownershipCertificate: optBool,
  roadFundPaid: optBool,
  insuranceValid: optBool,
  inspectionCertificate: optBool,
  customsClearance: optBool,
  dutyPaid: optBool,
  plateType: optStr,
  region: requiredStr,
  city: requiredStr,
  subCity: optStr,
  woreda: optStr,
  latitude: optNum(z.number().min(-90).max(90)),
  longitude: optNum(z.number().min(-180).max(180)),
  pickupAddress: optStr,
  description: optStr,
  images: optArr,
  videoUrl: optStr,
  price: num(z.number().positive()),
  priceType: z.string(),
  features: optArr,
})
