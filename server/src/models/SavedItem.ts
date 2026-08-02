import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

export interface ISavedItem {
  id: string;
  userId: string;
  itemType: "property" | "vehicle";
  itemId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SavedItemModel extends Model<ISavedItem> {}

SavedItemModel.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    itemType: { type: DataTypes.ENUM("property", "vehicle"), allowNull: false },
    itemId: { type: DataTypes.UUID, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: "saved_items",
    timestamps: true,
    indexes: [{ unique: true, fields: ["userId", "itemType", "itemId"] }],
  }
);
