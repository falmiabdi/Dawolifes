import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

interface OverviewStats {
  activeUsers: number
  verifiedAgents: number
  listedHouses: number
  listedCars: number
}

let cache: { data: OverviewStats; expiresAt: number } | null = null
const CACHE_TTL_MS = 60 * 1000

router.get('/overview', async (_req, res) => {
  try {
    const now = Date.now()
    if (cache && cache.expiresAt > now) {
      return res.json(cache.data)
    }

    const [activeUsers, verifiedAgents, listedHouses, listedCars] = await Promise.all([
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.user.count({ where: { role: { in: ['agent', 'owner'] }, status: 'Approved' } }),
      prisma.property.count({ where: { status: 'Approved' } }),
      prisma.vehicle.count({ where: { status: 'Approved' } }),
    ])

    cache = {
      data: { activeUsers, verifiedAgents, listedHouses, listedCars },
      expiresAt: now + CACHE_TTL_MS,
    }
    res.json(cache.data)
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to load statistics' })
  }
})

export default router