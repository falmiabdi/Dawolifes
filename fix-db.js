const mongoose = require('mongoose');

async function run() {
  const uri = "mongodb+srv://falmiabdi2026:bFWrg8KsSjJD6IeJkk@cluster0.ubsrjcn.mongodb.net/DelaHarme";
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  // Delete all users with this email just to clean it up
  const result = await db.collection('users').deleteMany({ email: 'felmitesfaye@gmail.com' });
  console.log("Deleted count:", result.deletedCount);
  
  mongoose.disconnect();
}
run();
