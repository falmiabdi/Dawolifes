import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

export interface IMessage {
  id: string;
  propertyId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  content: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class MessageModel extends Model<IMessage> {}

MessageModel.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    propertyId: { type: DataTypes.STRING, allowNull: false },
    senderId: { type: DataTypes.UUID, allowNull: false },
    senderName: { type: DataTypes.STRING, allowNull: false },
    senderRole: { type: DataTypes.STRING, allowNull: false },
    recipientId: { type: DataTypes.UUID, allowNull: false },
    recipientName: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  { sequelize, tableName: "messages", timestamps: true }
);
