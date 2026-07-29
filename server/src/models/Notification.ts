import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

export interface INotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationModel extends Model<INotification> {}

NotificationModel.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
    data: { type: DataTypes.JSONB },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  { sequelize, tableName: "notifications", timestamps: true }
);
