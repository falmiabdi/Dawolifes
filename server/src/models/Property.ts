import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

export interface IProperty {
  id: string;
  title: string;
  type: string;
  listingType: "For Sale" | "For Rent";
  price: number;
  priceType: string;
  region: string;
  city: string;
  subCity?: string;
  woreda?: string;
  kebele?: string;
  parcel?: string;
  block?: string;
  homeNo?: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  condition?: string;
  legalizedYear?: number;
  description?: string;
  features: string[];
  images: string[];
  videoUrl?: string;
  featured?: boolean;
  locationDocument?: string;
  posterType?: string;
  ownerType?: string;
  agentId: string;
  agentName: string;
  displayPhone?: string;
  status: "Draft" | "Pending" | "Approved" | "Rejected" | "Sold" | "Rented";
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PropertyModel extends Model<IProperty> {}

PropertyModel.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    listingType: { type: DataTypes.ENUM("For Sale", "For Rent"), allowNull: false },
    price: { type: DataTypes.DOUBLE, allowNull: false },
    priceType: { type: DataTypes.STRING, allowNull: false },
    region: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    subCity: { type: DataTypes.STRING },
    woreda: { type: DataTypes.STRING },
    kebele: { type: DataTypes.STRING },
    parcel: { type: DataTypes.STRING },
    block: { type: DataTypes.STRING },
    homeNo: { type: DataTypes.STRING },
    area: { type: DataTypes.DOUBLE },
    bedrooms: { type: DataTypes.INTEGER },
    bathrooms: { type: DataTypes.INTEGER },
    condition: { type: DataTypes.STRING },
    legalizedYear: { type: DataTypes.INTEGER },
    description: { type: DataTypes.TEXT },
    features: { type: DataTypes.JSONB, defaultValue: [] },
    images: { type: DataTypes.JSONB, defaultValue: [] },
    videoUrl: { type: DataTypes.STRING },
    featured: { type: DataTypes.BOOLEAN, defaultValue: false },
    locationDocument: { type: DataTypes.STRING },
    posterType: { type: DataTypes.STRING },
    ownerType: { type: DataTypes.STRING },
    agentId: { type: DataTypes.UUID, allowNull: false },
    agentName: { type: DataTypes.STRING, allowNull: false },
    displayPhone: { type: DataTypes.STRING },
    status: {
      type: DataTypes.ENUM("Draft", "Pending", "Approved", "Rejected", "Sold", "Rented"),
      defaultValue: "Draft",
    },
    latitude: { type: DataTypes.DOUBLE },
    longitude: { type: DataTypes.DOUBLE },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  { sequelize, tableName: "properties", timestamps: true }
);
