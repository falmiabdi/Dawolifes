import { prisma } from '../lib/prisma.js'
import dotenv from 'dotenv'

dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Add it to your .env file.')
}

export { prisma }

export async function connectDB(retries = 6, interval = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('✅ Neon PostgreSQL connected')
      return prisma
    } catch (error: any) {
      console.error(`❌ DB connection attempt ${i + 1}/${retries} failed: ${error.message}`)
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${interval / 1000}s...`)
        await new Promise((r) => setTimeout(r, interval))
      }
    }
  }
  console.warn('⚠️  Database connection failed after retries. Starting server anyway — DB-dependent routes will return errors until the database is available.')
  return prisma
}
