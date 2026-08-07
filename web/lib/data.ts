export type ListingType = "For Sale" | "For Rent"

export type Property = {
  id: string
  title: string
  type: string
  listingType: ListingType
  price: number
  priceType: string
  region: string
  city: string
  subCity: string
  woreda: string
  kebele: string
  parcel: string
  block: string
  homeNo: string
  area: number
  bedrooms: number
  bathrooms: number
  floorNumber?: string
  condition: string
  legalizedYear: number
  description: string
  features: string[]
  images: string[]
  videoUrl?: string
  featured?: boolean
  agent: Agent
}

export type Vehicle = {
  id: string
  title: string
  listingType: 'For Sale' | 'For Rent' | 'Both'
  vehicleCategory: string
  make: string
  model: string
  trimVersion?: string
  manufacturingYear: number
  color: string
  countryOfOrigin: string
  fuelType?: string
  engineSize?: number
  horsepower?: number
  transmission?: string
  drivetrain?: string
  seatingCapacity?: number
  doors?: number
  mileage?: number
  cylinders?: number
  fuelConsumption?: string
  fuelTankCapacity?: number
  groundClearance?: number
  weight?: number
  tireSize?: string
  condition: string
  accidentFree?: boolean
  imported?: boolean
  safetyFeatures: string[]
  interiorFeatures: string[]
  exteriorFeatures: string[]
  price: number
  priceType: string
  region: string
  city: string
  subCity?: string
  woreda?: string
  description?: string
  features: string[]
  images: string[]
  videoUrl?: string
  featured?: boolean
  agent: Agent
  // Rental
  dailyRate?: number
  weeklyRate?: number
  monthlyRate?: number
  selfDrive?: boolean
  driverIncluded?: boolean
  // Sale
  negotiable?: boolean
  financingAvailable?: boolean
  // Legal
  plateNumber?: string
  plateType?: string
  insuranceValid?: boolean
  ownershipCertificate?: boolean
  roadFundPaid?: boolean
  inspectionCertificate?: boolean
  status?: string
  rejectionReason?: string
}

export type Agent = {
  id: string
  name: string
  role: string
  phone: string
  avatar: string
  email?: string
  secondaryPhone?: string
  companyName?: string
  officeAddress?: string
  licenseNumber?: string
}

export const categories = [
  { key: "houses", label: "Houses", icon: "Home" },
  { key: "apartments", label: "Apartments", icon: "Building2" },
  { key: "land", label: "Land", icon: "Trees" },
  { key: "commercial", label: "Commercial", icon: "Store" },
  { key: "villas", label: "Villas", icon: "Hotel" },
  { key: "cars", label: "Cars", icon: "Car" },

] as const

export const services = [
  {
    title: "User Friendly",
    icon: "LayoutGrid",
    description: "Clean, modern design with both classic and modern look options.",
  },
  {
    title: "Free Support",
    icon: "Headphones",
    description: "24/7 free support for all your real estate needs.",
  },
  {
    title: "Advanced Search",
    icon: "Search",
    description: "Powerful property search with customizable filters and fields.",
  },
  {
    title: "Google & OpenStreet Maps",
    icon: "MapPin",
    description: "Google Maps API integration with property markers and location picking.",
  },
  {
    title: "Member Support",
    icon: "Users",
    description: "User registration, login, and social media sign-in support.",
  },
  {
    title: "Property Submit",
    icon: "Building2",
    description: "Front-end property submission for owners and registered agents.",
  },
] as const

export const amenityOptions = [
  "Parking",
  "Garden",
  "Security",
  "Swimming Pool",
  "Elevator",
  "Balcony",
  "Solar Power",
  "Generator",
  "Compound",
  "Borehole",
  "CCTV",
  "Air Conditioning",
  "Furnished",
  "Water Tank",
]

export const houseSafetyFeatureOptions = [
  "Security Guard",
  "CCTV",
  "Alarm System",
  "Perimeter Wall",
  "Electronic Gate",
  "Fire Extinguisher",
  "Smoke Detector",
  "Safe Room",
]

export const houseInteriorFeatureOptions = [
  "Furnished",
  "Built-in Wardrobes",
  "Kitchen Cabinets",
  "Tiled Flooring",
  "Ceiling Work",
  "TV Lounge",
  "Study Room",
  "Maids Room",
  "Storage Room",
]

export const houseExteriorFeatureOptions = [
  "Garden",
  "Parking",
  "Compound",
  "Balcony",
  "Terrace",
  "Water Tank",
  "Borehole",
  "Solar Power",
  "Generator",
  "Swimming Pool",
]

export const vehicleCategories = [
  "Sedan",
  "SUV",
  "Pickup",
  "Hatchback",
  "Coupe",
  "Convertible",
  "Van",
  "Minibus",
  "Bus",
  "Truck",
  "Motorcycle",
  "Three-Wheeler (Bajaj)",
  "Electric Vehicle",
  "Hybrid Vehicle",
]

export const vehicleMakes = [
  "Toyota",
  "Hyundai",
  "Nissan",
  "Honda",
  "Mazda",
  "Subaru",
  "Mitsubishi",
  "Suzuki",
  "Kia",
  "Ford",
  "BMW",
  "Mercedes-Benz",
  "Volkswagen",
  "Chevrolet",
  "Isuzu",
  "Lexus",
  "Acura",
  "Infiniti",
  "Range Rover",
  "Jeep",
  "Tesla",
  "BYD",
  "Other",
]

export const fuelTypes = ["Gasoline", "Diesel", "Electric", "Hybrid", "CNG", "LPG"]
export const transmissionTypes = ["Automatic", "Manual", "CVT", "DCT"]
export const drivetrainTypes = ["FWD", "RWD", "4WD", "AWD"]
export const vehicleConditions = ["New", "Used", "Certified Pre-Owned"]
export const colorOptions = ["White", "Black", "Silver", "Gray", "Red", "Blue", "Green", "Yellow", "Orange", "Brown", "Beige", "Gold", "Other"]
export const countryOfOriginOptions = ["Japan", "Germany", "USA", "South Korea", "China", "UK", "France", "Italy", "Thailand", "India", "Ethiopia", "Other"]

export const safetyFeatureOptions = [
  "ABS", "Airbags", "Traction Control", "Stability Control",
  "Blind Spot Monitoring", "Lane Assist", "Tire Pressure Monitoring",
  "Child Lock", "Immobilizer", "Alarm System",
]

export const interiorFeatureOptions = [
  "Leather Seats", "Fabric Seats", "Heated Seats", "Power Windows",
  "Power Steering", "Power Mirrors", "Sunroof", "Bluetooth",
  "USB Ports", "Apple CarPlay", "Android Auto", "Premium Sound System",
]

export const exteriorFeatureOptions = [
  "Alloy Wheels", "Fog Lights", "LED Headlights", "Roof Rack",
  "Tow Hook", "Running Boards", "Spare Tire",
]

export function formatPrice(price: number) {
  const value = Number(price)
  if (!Number.isFinite(value)) return "0"
  return new Intl.NumberFormat("en-US").format(value)
}
