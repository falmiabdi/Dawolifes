import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

export interface IVehicle {
  id: string;
  title: string;
  vehicleId: string;
  listingType: "For Sale" | "For Rent" | "Both";
  vehicleCategory: string;
  make: string;
  vehicleModel: string;
  trimVersion?: string;
  manufacturingYear: number;
  registrationYear?: number;
  vin?: string;
  engineNumber?: string;
  plateNumber?: string;
  color: string;
  countryOfOrigin: string;
  fuelType?: string;
  engineSize?: number;
  horsepower?: number;
  transmission?: string;
  drivetrain?: string;
  cylinders?: number;
  seatingCapacity?: number;
  doors?: number;
  mileage?: number;
  fuelConsumption?: string;
  fuelTankCapacity?: number;
  groundClearance?: number;
  weight?: number;
  tireSize?: string;
  condition: string;
  accidentFree?: boolean;
  accidentHistory?: string;
  serviceHistoryAvailable?: boolean;
  ownershipCount?: number;
  imported?: boolean;
  locallyAssembled?: boolean;
  safetyFeatures: string[];
  interiorFeatures: string[];
  exteriorFeatures: string[];
  dailyRate?: number;
  weeklyRate?: number;
  monthlyRate?: number;
  securityDeposit?: number;
  minRentalDays?: number;
  maxRentalDays?: number;
  driverIncluded?: boolean;
  selfDrive?: boolean;
  fuelPolicy?: string;
  mileageLimit?: number;
  extraKmCharge?: number;
  deliveryAvailable?: boolean;
  airportPickup?: boolean;
  availableLocations?: string[];
  availableDates?: string;
  driverAgeRequirement?: number;
  minDrivingExperience?: number;
  drivingLicenseRequired?: string;
  passportRequired?: boolean;
  smokingAllowed?: boolean;
  petsAllowed?: boolean;
  offroadAllowed?: boolean;
  crossborderAllowed?: boolean;
  insuranceIncluded?: boolean;
  damageLiability?: string;
  sellingPrice?: number;
  negotiable?: boolean;
  financingAvailable?: boolean;
  exchangeAccepted?: boolean;
  bankLoanAccepted?: boolean;
  regionRegistration?: string;
  ownershipCertificate?: boolean;
  roadFundPaid?: boolean;
  insuranceValid?: boolean;
  inspectionCertificate?: boolean;
  customsClearance?: boolean;
  dutyPaid?: boolean;
  plateType?: string;
  region: string;
  city: string;
  subCity?: string;
  woreda?: string;
  latitude?: number;
  longitude?: number;
  pickupAddress?: string;
  description?: string;
  images: string[];
  videoUrl?: string;
  price: number;
  priceType: string;
  features: string[];
  featured?: boolean;
  agentId: string;
  agentName: string;
  status: "Draft" | "Pending" | "Approved" | "Rejected" | "Sold" | "Rented";
  views: number;
  favorites: number;
  createdAt: Date;
  updatedAt: Date;
}

export class VehicleModel extends Model<IVehicle> {}

VehicleModel.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    vehicleId: { type: DataTypes.STRING, allowNull: false, unique: true },
    listingType: { type: DataTypes.ENUM("For Sale", "For Rent", "Both"), allowNull: false },
    vehicleCategory: { type: DataTypes.STRING, allowNull: false },
    make: { type: DataTypes.STRING, allowNull: false },
    vehicleModel: { type: DataTypes.STRING, allowNull: false },
    trimVersion: { type: DataTypes.STRING },
    manufacturingYear: { type: DataTypes.INTEGER, allowNull: false },
    registrationYear: { type: DataTypes.INTEGER },
    vin: { type: DataTypes.STRING },
    engineNumber: { type: DataTypes.STRING },
    plateNumber: { type: DataTypes.STRING },
    color: { type: DataTypes.STRING, allowNull: false },
    countryOfOrigin: { type: DataTypes.STRING, allowNull: false },
    fuelType: { type: DataTypes.STRING },
    engineSize: { type: DataTypes.DOUBLE },
    horsepower: { type: DataTypes.DOUBLE },
    transmission: { type: DataTypes.STRING },
    drivetrain: { type: DataTypes.STRING },
    cylinders: { type: DataTypes.INTEGER },
    seatingCapacity: { type: DataTypes.INTEGER },
    doors: { type: DataTypes.INTEGER },
    mileage: { type: DataTypes.DOUBLE },
    fuelConsumption: { type: DataTypes.STRING },
    fuelTankCapacity: { type: DataTypes.DOUBLE },
    groundClearance: { type: DataTypes.DOUBLE },
    weight: { type: DataTypes.DOUBLE },
    tireSize: { type: DataTypes.STRING },
    condition: { type: DataTypes.STRING, allowNull: false },
    accidentFree: { type: DataTypes.BOOLEAN },
    accidentHistory: { type: DataTypes.TEXT },
    serviceHistoryAvailable: { type: DataTypes.BOOLEAN },
    ownershipCount: { type: DataTypes.INTEGER },
    imported: { type: DataTypes.BOOLEAN },
    locallyAssembled: { type: DataTypes.BOOLEAN },
    safetyFeatures: { type: DataTypes.JSONB, defaultValue: [] },
    interiorFeatures: { type: DataTypes.JSONB, defaultValue: [] },
    exteriorFeatures: { type: DataTypes.JSONB, defaultValue: [] },
    dailyRate: { type: DataTypes.DOUBLE },
    weeklyRate: { type: DataTypes.DOUBLE },
    monthlyRate: { type: DataTypes.DOUBLE },
    securityDeposit: { type: DataTypes.DOUBLE },
    minRentalDays: { type: DataTypes.INTEGER },
    maxRentalDays: { type: DataTypes.INTEGER },
    driverIncluded: { type: DataTypes.BOOLEAN },
    selfDrive: { type: DataTypes.BOOLEAN },
    fuelPolicy: { type: DataTypes.STRING },
    mileageLimit: { type: DataTypes.INTEGER },
    extraKmCharge: { type: DataTypes.DOUBLE },
    deliveryAvailable: { type: DataTypes.BOOLEAN },
    airportPickup: { type: DataTypes.BOOLEAN },
    availableLocations: { type: DataTypes.JSONB },
    availableDates: { type: DataTypes.STRING },
    driverAgeRequirement: { type: DataTypes.INTEGER },
    minDrivingExperience: { type: DataTypes.INTEGER },
    drivingLicenseRequired: { type: DataTypes.STRING },
    passportRequired: { type: DataTypes.BOOLEAN },
    smokingAllowed: { type: DataTypes.BOOLEAN },
    petsAllowed: { type: DataTypes.BOOLEAN },
    offroadAllowed: { type: DataTypes.BOOLEAN },
    crossborderAllowed: { type: DataTypes.BOOLEAN },
    insuranceIncluded: { type: DataTypes.BOOLEAN },
    damageLiability: { type: DataTypes.STRING },
    sellingPrice: { type: DataTypes.DOUBLE },
    negotiable: { type: DataTypes.BOOLEAN },
    financingAvailable: { type: DataTypes.BOOLEAN },
    exchangeAccepted: { type: DataTypes.BOOLEAN },
    bankLoanAccepted: { type: DataTypes.BOOLEAN },
    regionRegistration: { type: DataTypes.STRING },
    ownershipCertificate: { type: DataTypes.BOOLEAN },
    roadFundPaid: { type: DataTypes.BOOLEAN },
    insuranceValid: { type: DataTypes.BOOLEAN },
    inspectionCertificate: { type: DataTypes.BOOLEAN },
    customsClearance: { type: DataTypes.BOOLEAN },
    dutyPaid: { type: DataTypes.BOOLEAN },
    plateType: { type: DataTypes.STRING },
    region: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    subCity: { type: DataTypes.STRING },
    woreda: { type: DataTypes.STRING },
    latitude: { type: DataTypes.DOUBLE },
    longitude: { type: DataTypes.DOUBLE },
    pickupAddress: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    images: { type: DataTypes.JSONB, defaultValue: [] },
    videoUrl: { type: DataTypes.STRING },
    price: { type: DataTypes.DOUBLE, allowNull: false },
    priceType: { type: DataTypes.STRING, allowNull: false },
    features: { type: DataTypes.JSONB, defaultValue: [] },
    featured: { type: DataTypes.BOOLEAN, defaultValue: false },
    agentId: { type: DataTypes.UUID, allowNull: false },
    agentName: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM("Draft", "Pending", "Approved", "Rejected", "Sold", "Rented"),
      defaultValue: "Draft",
    },
    views: { type: DataTypes.INTEGER, defaultValue: 0 },
    favorites: { type: DataTypes.INTEGER, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  { sequelize, tableName: "vehicles", timestamps: true }
);
