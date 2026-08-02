import { UserModel } from "./User.js";
import { PropertyModel } from "./Property.js";
import { VehicleModel } from "./Vehicle.js";
import { PaymentModel } from "./Payment.js";
import { NotificationModel } from "./Notification.js";
import { MessageModel } from "./Message.js";
import { SavedItemModel } from "./SavedItem.js";

UserModel.hasMany(PropertyModel, { foreignKey: "agentId", as: "properties" });
PropertyModel.belongsTo(UserModel, { foreignKey: "agentId", as: "agent" });

UserModel.hasMany(VehicleModel, { foreignKey: "agentId", as: "vehicles" });
VehicleModel.belongsTo(UserModel, { foreignKey: "agentId", as: "agent" });

UserModel.hasMany(SavedItemModel, { foreignKey: "userId", as: "savedItems" });
SavedItemModel.belongsTo(UserModel, { foreignKey: "userId", as: "user" });

export { UserModel, PropertyModel, VehicleModel, PaymentModel, NotificationModel, MessageModel, SavedItemModel };
