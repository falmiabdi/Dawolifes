import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

export interface IPayment {
  id: string;
  orderId: string;
  merchOrderId: string;
  txRef: string;
  status: "Pending" | "Completed" | "Failed" | "Refunded" | "Expired";
  amount: number;
  currency: string;
  method: "chapa" | "telebirr";
  paymentType: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  propertyId?: string;
  propertyTitle?: string;
  notificationData?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentModel extends Model<IPayment> {}

PaymentModel.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: { type: DataTypes.STRING, allowNull: false, unique: true },
    merchOrderId: { type: DataTypes.STRING, allowNull: false },
    txRef: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM("Pending", "Completed", "Failed", "Refunded", "Expired"),
      defaultValue: "Pending",
    },
    amount: { type: DataTypes.DOUBLE, allowNull: false },
    currency: { type: DataTypes.STRING, defaultValue: "ETB" },
    method: { type: DataTypes.ENUM("chapa", "telebirr"), allowNull: false },
    paymentType: { type: DataTypes.STRING, allowNull: false },
    buyerName: { type: DataTypes.STRING, allowNull: false },
    buyerEmail: { type: DataTypes.STRING, allowNull: false },
    buyerPhone: { type: DataTypes.STRING, allowNull: false },
    propertyId: { type: DataTypes.STRING },
    propertyTitle: { type: DataTypes.STRING },
    notificationData: { type: DataTypes.JSONB },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  { sequelize, tableName: "payments", timestamps: true }
);
