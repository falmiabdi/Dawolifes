import { Sequelize } from "sequelize";

async function main() {
  const sequelize = new Sequelize("dawolife", "postgres", "1234", {
    host: "localhost",
    port: 5432,
    dialect: "postgres",
    logging: console.log,
  });

  try {
    await sequelize.authenticate();
    console.log("✅ Connection successful");
  } catch (err: any) {
    console.error("❌ Connection failed:", err.message);
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

main();
