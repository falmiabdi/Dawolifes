import { Router } from 'express'
import multer from 'multer'
import { authMiddleware, agentMiddleware } from '../middleware/auth.js'
import cloudinary from '../utils/cloudinary.js'
import { prisma } from '../lib/prisma.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop() || '')
    const mimetype = allowedTypes.test(file.mimetype)
    if (extname && mimetype) {
      cb(null, true)
    } else {
      cb(new Error('File type not allowed'))
    }
  },
})

const router = Router()

// Upload a file for agent onboarding
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }
    const field = req.body.field || 'document'
    const folder = `dawolife/agents/${req.user!.userId}/${field}`
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder },
        (error, result) => {
          if (error) reject(new Error(error.message))
          else resolve(result)
        }
      ).end(req.file!.buffer)
    })
    res.json({ url: result.secure_url, publicId: result.public_id })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Upload failed' })
  }
})

// Save onboarding step data
router.post('/onboarding', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const updates: Record<string, any> = {}
    const currentProfile: any = user.profile || {}
    const profile: Record<string, any> = { ...currentProfile }

    if (req.body.fullName) updates.username = req.body.fullName
    if (req.body.gender) profile.gender = req.body.gender
    if (req.body.dateOfBirth) profile.dateOfBirth = req.body.dateOfBirth
    if (req.body.nationality) profile.nationality = req.body.nationality
    if (req.body.preferredLanguage) profile.preferredLanguage = req.body.preferredLanguage

    if (req.body.ethPhone) updates.phone = req.body.ethPhone
    if (req.body.safaricomPhone) profile.safaricomPhone = req.body.safaricomPhone
    if (req.body.region) profile.region = req.body.region
    if (req.body.city) profile.city = req.body.city
    if (req.body.woreda) profile.woreda = req.body.woreda
    if (req.body.kebele) profile.kebele = req.body.kebele
    if (req.body.fullAddress) profile.fullAddress = req.body.fullAddress

    if (req.body.faydaFront || req.body.faydaBack || req.body.selfieFayda || req.body.passportPhoto) {
      const docs: any[] = [...((user.documents as any[]) || [])]
      if (req.body.faydaFront) {
        const idx = docs.findIndex((d: any) => d.type === 'faydaFront')
        if (idx >= 0) docs[idx] = { type: 'faydaFront', url: req.body.faydaFront }
        else docs.push({ type: 'faydaFront', url: req.body.faydaFront })
      }
      if (req.body.faydaBack) {
        const idx = docs.findIndex((d: any) => d.type === 'faydaBack')
        if (idx >= 0) docs[idx] = { type: 'faydaBack', url: req.body.faydaBack }
        else docs.push({ type: 'faydaBack', url: req.body.faydaBack })
      }
      if (req.body.selfieFayda) {
        const idx = docs.findIndex((d: any) => d.type === 'selfieFayda')
        if (idx >= 0) docs[idx] = { type: 'selfieFayda', url: req.body.selfieFayda }
        else docs.push({ type: 'selfieFayda', url: req.body.selfieFayda })
      }
      if (req.body.passportPhoto) {
        const idx = docs.findIndex((d: any) => d.type === 'passportPhoto')
        if (idx >= 0) docs[idx] = { type: 'passportPhoto', url: req.body.passportPhoto }
        else docs.push({ type: 'passportPhoto', url: req.body.passportPhoto })
      }
      updates.documents = docs
    }

    if (req.body.highestEducation) {
      const currentEdu: any = user.education || {}
      updates.education = { ...currentEdu, level: req.body.highestEducation, certificate: req.body.educationCertificate || '' }
    }

    if (req.body.agentExperience || req.body.companyName || req.body.officeAddress || req.body.businessLicenseNumber || req.body.businessLicenseFile || req.body.tinNumber) {
      const currentProf: any = user.professionalInfo || {}
      updates.professionalInfo = { ...currentProf,
        experience: req.body.agentExperience,
        companyName: req.body.companyName,
        officeAddress: req.body.officeAddress,
        licenseNumber: req.body.businessLicenseNumber,
        licenseFile: req.body.businessLicenseFile,
        tinNumber: req.body.tinNumber,
      }
    }

    if (req.body.onboardingComplete === true) {
      updates.onboardingComplete = true
      if (user.status === 'Rejected') {
        updates.status = 'Pending'
        updates.rejectionReason = null
      }
    }

    if (Object.keys(profile).length > 0) {
      updates.profile = profile
    }

    await prisma.user.update({ where: { id: req.user!.userId }, data: updates })
    res.json({ message: 'Step saved' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to save step' })
  }
})

// Get agent profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    const profile: any = user.profile || {}
    const documents: any[] = (user.documents as any[]) || []
    const education: any = user.education || {}
    const professionalInfo: any = user.professionalInfo || {}

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        rejectionReason: user.rejectionReason,
        profilePhoto: user.profilePhoto,
        phone: user.phone,
        onboardingComplete: user.onboardingComplete,
        ...profile,
        documents,
        highestEducation: education.level || '',
        educationCertificate: education.certificate || '',
        agentExperience: professionalInfo.experience || '',
        companyName: professionalInfo.companyName || '',
        officeAddress: professionalInfo.officeAddress || '',
        businessLicenseNumber: professionalInfo.licenseNumber || '',
        businessLicenseFile: professionalInfo.licenseFile || '',
        tinNumber: professionalInfo.tinNumber || '',
      },
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch profile' })
  }
})

// Get agent's own properties (all statuses)
router.get('/properties', authMiddleware, agentMiddleware, async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      where: { agentId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ properties })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch properties' })
  }
})

// Get agent's own vehicles (all statuses)
router.get('/vehicles', authMiddleware, agentMiddleware, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { agentId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ vehicles })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch vehicles' })
  }
})

export default router
