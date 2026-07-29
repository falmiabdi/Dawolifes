import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const DB_NAME = process.env.DB_NAME || "dawolife";
const DB_USER = process.env.DB_USER || "postgres";
const DB_PASSWORD = process.env.DB_PASSWORD || "postgres";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = parseInt(process.env.DB_PORT || "5432", 10);

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "postgres",
  logging: process.env.NODE_ENV !== "production" ? false : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connected");
    await sequelize.sync({ alter: false });
    console.log("✅ Tables synced");
    return sequelize;
  } catch (error: any) {
    console.error("❌ Database connection failed");
    console.error("Name:", error.name);
    console.error("Message:", error.message);
    return null;
  }
}
