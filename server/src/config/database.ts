import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to your .env file.");
}

export const sequelize = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // required for Neon's TLS
    },
  },
  logging: false,
  pool: {
    max: 5,   // keep low — Neon free tier has limited connections
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export async function connectDB(retries = 5, interval = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log("✅ Neon PostgreSQL connected");

      // sync({ alter: true }) compares the current DB schema against models
      // and adds any missing columns/tables automatically — safe on a fresh DB
      await sequelize.sync({ alter: true });
      console.log("✅ All tables synced");

      return sequelize;
    } catch (error: any) {
      console.error(`❌ DB connection attempt ${i + 1}/${retries} failed: ${error.message}`);
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${interval / 1000}s...`);
        await new Promise((r) => setTimeout(r, interval));
      }
    }
  }
  console.error("❌ All database connection retries exhausted");
  return null;
}
