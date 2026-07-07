import mongoose from 'mongoose'

const mongoUri = process.env.MONGODB_URI

export async function connectToDatabase() {
  if (!mongoUri) {
    console.log('MongoDB URI is not defined in environment variables! Falling back to in-memory database.')
    return false
  }

  if (mongoose.connection.readyState === 1) {
    console.log('MongoDB is already connected.')
    return true
  }

  try {
    await mongoose.connect(mongoUri, {
      dbName: 'DelaHarme',
    })
    console.log('MongoDB connected successfully!')
    return true
  } catch (error) {
    console.error('MongoDB connection error:', error)
    return false
  }
}
