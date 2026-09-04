import { Router } from 'express'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

const router = Router()

const DEFAULT_SETTINGS = {
  id: 'default',
  contactPhone1: '+251911234567',
  contactPhone2: '+251962395282',
  contactPhone3: '+251922477886',
  contactEmail: 'info@dawolife.com',
  socialFacebook: '',
  socialTelegram: '',
  socialWhatsapp: '',
  socialTiktok: '',
  socialLinkedin: '',
  socialInstagram: '',
}

async function getSettings() {
  const existing = await prisma.setting.findUnique({ where: { id: 'default' } })
  if (existing) return existing
  const created = await prisma.setting.upsert({
    where: { id: 'default' },
    update: {},
    create: { ...DEFAULT_SETTINGS },
  })
  return created
}

// Public: fetch app-wide contact / social settings (no auth required).
router.get('/', async (_req, res) => {
  try {
    const settings = await getSettings()
    const { id, updatedAt, ...rest } = settings
    res.json(settings)
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch settings' })
  }
})

// Admin: update app-wide contact / social settings.
router.put('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      contactPhone1,
      contactPhone2,
      contactPhone3,
      contactEmail,
      socialFacebook,
      socialTelegram,
      socialWhatsapp,
      socialTiktok,
      socialLinkedin,
      socialInstagram,
    } = req.body ?? {}

    const data: Record<string, any> = {}
    if (contactPhone1 !== undefined) data.contactPhone1 = String(contactPhone1).trim()
    if (contactPhone2 !== undefined) data.contactPhone2 = String(contactPhone2).trim()
    if (contactPhone3 !== undefined) data.contactPhone3 = String(contactPhone3).trim()
    if (contactEmail !== undefined) data.contactEmail = String(contactEmail).trim()
    if (socialFacebook !== undefined) data.socialFacebook = String(socialFacebook).trim()
    if (socialTelegram !== undefined) data.socialTelegram = String(socialTelegram).trim()
    if (socialWhatsapp !== undefined) data.socialWhatsapp = String(socialWhatsapp).trim()
    if (socialTiktok !== undefined) data.socialTiktok = String(socialTiktok).trim()
    if (socialLinkedin !== undefined) data.socialLinkedin = String(socialLinkedin).trim()
    if (socialInstagram !== undefined) data.socialInstagram = String(socialInstagram).trim()

    const settings = await prisma.setting.upsert({
      where: { id: 'default' },
      update: data,
      create: { ...DEFAULT_SETTINGS, ...data },
    })

    res.json({ message: 'Settings updated', settings })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update settings' })
  }
})

export default router
