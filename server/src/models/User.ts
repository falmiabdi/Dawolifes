import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

export interface IUser {
  id: string;
  username: string;
  email: string;
  password: string;
  role: "admin" | "agent" | "user";
  roles: string[];
  status: "Pending" | "Approved" | "Rejected" | "Suspended";
  rejectionReason?: string;
  isRootAdmin: boolean;
  profilePhoto?: string;
  phone?: string;
  documents?: { type: string; url: string }[];
  education?: { institution: string; degree: string; year: number }[];
  professionalInfo?: { licenseNumber: string; companyName: string; officeAddress: string };
  createdAt: Date;
  updatedAt: Date;
}

export class UserModel extends Model<IUser> {}

UserModel.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    username: { type: DataTypes.STRING(50), allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM("admin", "agent", "user"), defaultValue: "user" },
    roles: { type: DataTypes.JSONB, defaultValue: [] },
    status: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected", "Suspended"),
      defaultValue: "Pending",
    },
    rejectionReason: { type: DataTypes.STRING },
    isRootAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
    profilePhoto: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    documents: { type: DataTypes.JSONB, defaultValue: [] },
    education: { type: DataTypes.JSONB, defaultValue: [] },
    professionalInfo: { type: DataTypes.JSONB },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  { sequelize, tableName: "users", timestamps: true }
);
