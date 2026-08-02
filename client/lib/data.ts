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

export const agent: Agent = {
  id: "a1",
  name: "Gemmechu Tesfaye Jabessa",
  role: "Property Owner",
  phone: "+251922497886",
  avatar: "/agent-1.png",
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

export const properties: Property[] = [
  {
    id: "mana-jireenyaa",
    title: "mana jireenyaa",
    type: "House",
    listingType: "For Rent",
    price: 12000,
    priceType: "per month",
    region: "Oromia",
    city: "Shaggar",
    subCity: "Koyyee Faccee",
    woreda: "Waddeessaa",
    kebele: "Ilaalaa",
    parcel: "3",
    block: "50",
    homeNo: "50",
    area: 105,
    bedrooms: 3,
    bathrooms: 2,
    condition: "Finished",
    legalizedYear: 2012,
    description: "manni kun hojjetamee xumurameera",
    features: ["Parking", "Compound", "Water Tank"],
    images: ["/properties/villa-1.png", "/properties/interior-4.png", "/properties/house-2.png"],
    featured: true,
    agent,
  },
  {
    id: "sale-house",
    title: "sale House",
    type: "House",
    listingType: "For Sale",
    price: 70000000,
    priceType: "Fixed Price",
    region: "Oromia",
    city: "Shaggar",
    subCity: "Waddeessaa",
    woreda: "Waddeessaa",
    kebele: "Gafarsa",
    parcel: "5",
    block: "81",
    homeNo: "65",
    area: 12,
    bedrooms: 4,
    bathrooms: 3,
    condition: "Finished",
    legalizedYear: 2019,
    description: "Spacious family home with a large compound in a quiet neighborhood.",
    features: ["Parking", "Garden", "Security", "Generator", "CCTV"],
    images: ["/properties/house-2.png", "/properties/interior-4.png", "/properties/villa-5.png"],
    featured: true,
    agent,
  },
  {
    id: "bole-apartment",
    title: "Modern Bole Apartment",
    type: "Apartment",
    listingType: "For Rent",
    price: 35000,
    priceType: "per month",
    region: "Addis Ababa",
    city: "Addis Ababa",
    subCity: "Bole",
    woreda: "03",
    kebele: "08",
    parcel: "12",
    block: "4",
    homeNo: "21",
    area: 140,
    bedrooms: 2,
    bathrooms: 2,
    condition: "Finished",
    legalizedYear: 2021,
    description: "Bright, fully furnished apartment near Bole with elevator and covered parking.",
    features: ["Elevator", "Parking", "Balcony", "Furnished", "Security"],
    images: ["/properties/apartment-3.png", "/properties/interior-4.png"],
    agent,
  },
  {
    id: "luxury-villa",
    title: "Luxury Villa with Pool",
    type: "Villa",
    listingType: "For Sale",
    price: 120000000,
    priceType: "Negotiable",
    region: "Addis Ababa",
    city: "Addis Ababa",
    subCity: "Old Airport",
    woreda: "05",
    kebele: "11",
    parcel: "8",
    block: "2",
    homeNo: "9",
    area: 480,
    bedrooms: 6,
    bathrooms: 5,
    condition: "Finished",
    legalizedYear: 2022,
    description: "Premium villa with swimming pool, landscaped garden and smart-home features.",
    features: ["Swimming Pool", "Garden", "Parking", "Solar Power", "Security", "Generator"],
    images: ["/properties/villa-5.png", "/properties/villa-1.png", "/properties/interior-4.png"],
    featured: true,
    agent,
  },
  {
    id: "commercial-space",
    title: "Prime Commercial Space",
    type: "Commercial",
    listingType: "For Rent",
    price: 90000,
    priceType: "per month",
    region: "Oromia",
    city: "Adama",
    subCity: "Dabus",
    woreda: "02",
    kebele: "04",
    parcel: "17",
    block: "7",
    homeNo: "3",
    area: 220,
    bedrooms: 0,
    bathrooms: 2,
    condition: "Finished",
    legalizedYear: 2018,
    description: "Street-facing commercial unit ideal for retail, offices or a showroom.",
    features: ["Parking", "Generator", "Air Conditioning"],
    images: ["/properties/commercial-6.png", "/properties/interior-4.png"],
    agent,
  },
  {
    id: "family-home",
    title: "Cozy Family Home",
    type: "House",
    listingType: "For Sale",
    price: 45000000,
    priceType: "Fixed Price",
    region: "Oromia",
    city: "Bishoftu",
    subCity: "Kuriftu",
    woreda: "01",
    kebele: "06",
    parcel: "22",
    block: "9",
    homeNo: "14",
    area: 260,
    bedrooms: 4,
    bathrooms: 3,
    condition: "Finished",
    legalizedYear: 2016,
    description: "Well-maintained home with a green compound close to schools and hospitals.",
    features: ["Parking", "Garden", "Borehole", "Compound"],
    images: ["/properties/house-2.png", "/properties/villa-1.png"],
    agent,
  },
]

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

export function getProperty(id: string) {
  return properties.find((p) => p.id === id)
}

export function formatPrice(price: number) {
  const value = Number(price)
  if (!Number.isFinite(value)) return "0"
  return new Intl.NumberFormat("en-US").format(value)
}
