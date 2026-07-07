const mongoose = require('mongoose');

async function run() {
  const uri = "mongodb+srv://falmiabdi2026:bFWrg8KsSjJD6IeJkk@cluster0.ubsrjcn.mongodb.net/DelaHarme";
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  console.log("Users in DB:", users);
  mongoose.disconnect();
}
run();
