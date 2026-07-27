import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dawolife'

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB')
  return mongoose.connection
}
