import { randomBytes, scrypt, timingSafeEqual } from 'crypto'

import { connectToDatabase } from '@/lib/db'
import { UserModel } from '@/lib/models/user'

export type UserRole = 'admin' | 'agent'
export type AgentStatus = 'Pending' | 'Approved' | 'Rejected' | 'Suspended'

export interface AuthUser {
  id: string
  username: string
  email: string
  passwordHash: string
  role: UserRole
  roles?: string[]
  status: AgentStatus
  rejectionReason?: string
  isRootAdmin?: boolean
  createdAt?: string

  // Onboarding fields
  onboardingComplete?: boolean
  fullName?: string
  profilePhoto?: string
  gender?: string
  dateOfBirth?: string
  nationality?: string
  preferredLanguage?: string
  ethPhone?: string
  safaricomPhone?: string
  region?: string
  city?: string
  woreda?: string
  kebele?: string
  fullAddress?: string
  faydaFront?: string
  faydaBack?: string
  selfieFayda?: string
  passportPhoto?: string
  highestEducation?: string
  educationCertificate?: string
  agentExperience?: string
  companyName?: string
  officeAddress?: string
  businessLicenseNumber?: string
  businessLicenseFile?: string
  tinNumber?: string
}

const memoryUsers: AuthUser[] = []
let seeded = false

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString('hex')
    scrypt(password, salt, 64, (error, derived) => {
      if (error) {
        reject(error)
        return
      }
      resolve(`${salt}:${derived.toString('hex')}`)
    })
  })
}

function verifyPassword(password: string, stored: string): Promise<boolean> {
  return new Promise((resolve) => {
    const [salt, key] = stored.split(':')
    if (!salt || !key) {
      resolve(false)
      return
    }
    scrypt(password, salt, 64, (error, derived) => {
      if (error) {
        resolve(false)
        return
      }
      const keyBuffer = Buffer.from(key, 'hex')
      if (keyBuffer.length !== derived.length) {
        resolve(false)
        return
      }
      resolve(timingSafeEqual(keyBuffer, derived))
    })
  })
}

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

function toPlainUser(user: any): AuthUser {
  return {
    id: user._id?.toString?.() || user.id,
    username: user.username,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role || 'agent',
    roles: user.roles || [user.role || 'agent'],
    status: user.status || 'Pending',
    rejectionReason: user.rejectionReason || '',
    isRootAdmin: user.isRootAdmin || false,
    createdAt: user.createdAt?.toISOString?.() || new Date().toISOString(),

    // Onboarding
    onboardingComplete: user.onboardingComplete || false,
    fullName: user.fullName || '',
    profilePhoto: user.profilePhoto || '',
    gender: user.gender || '',
    dateOfBirth: user.dateOfBirth || '',
    nationality: user.nationality || '',
    preferredLanguage: user.preferredLanguage || '',
    ethPhone: user.ethPhone || '',
    safaricomPhone: user.safaricomPhone || '',
    region: user.region || '',
    city: user.city || '',
    woreda: user.woreda || '',
    kebele: user.kebele || '',
    fullAddress: user.fullAddress || '',
    faydaFront: user.faydaFront || '',
    faydaBack: user.faydaBack || '',
    selfieFayda: user.selfieFayda || '',
    passportPhoto: user.passportPhoto || '',
    highestEducation: user.highestEducation || '',
    educationCertificate: user.educationCertificate || '',
    agentExperience: user.agentExperience || '',
    companyName: user.companyName || '',
    officeAddress: user.officeAddress || '',
    businessLicenseNumber: user.businessLicenseNumber || '',
    businessLicenseFile: user.businessLicenseFile || '',
    tinNumber: user.tinNumber || '',
  }
}

async function ensureSeeded() {
  if (seeded) {
    return
  }

  seeded = true

  const Model = await useDatabase()
  if (Model) {
    const existing = await Model.findOne({ email: 'felmitesfaye@gmail.com' }).lean()
    if (!existing) {
      await Model.create({
        username: 'DelaHarme Admin',
        email: 'felmitesfaye@gmail.com',
        passwordHash: await hashPassword('SecurePass@12345'),
        role: 'admin',
        roles: ['admin', 'superadmin'],
        status: 'Approved',
        isRootAdmin: true,
      })
      console.log('Admin user successfully seeded into MongoDB!')
    }
  }

  if (memoryUsers.some((user) => user.email === 'felmitesfaye@gmail.com')) {
    return
  }

  memoryUsers.push({
    id: 'admin-1',
    username: 'DelaHarme Admin',
    email: 'felmitesfaye@gmail.com',
    passwordHash: await hashPassword('SecurePass@12345'),
    role: 'admin',
    roles: ['admin', 'superadmin'],
    status: 'Approved',
    isRootAdmin: true,
  })
}

async function useDatabase() {
  const connected = await connectToDatabase()
  return connected ? UserModel : null
}

export async function getUserByEmail(email: string) {
  await ensureSeeded()
  const normalized = normalizeEmail(email)

  const Model = await useDatabase()
  if (Model) {
    const user = await Model.findOne({ email: normalized }).lean()
    if (user) {
      return toPlainUser(user)
    }
  }

  return memoryUsers.find((user) => user.email === normalized) || null
}

export async function getUserById(id: string) {
  await ensureSeeded()
  const Model = await useDatabase()
  if (Model) {
    const user = await Model.findById(id).lean()
    if (user) {
      return toPlainUser(user)
    }
  }

  return memoryUsers.find((user) => user.id === id) || null
}

export async function authenticateUser({ email, password }: { email: string; password: string }) {
  const user = await getUserByEmail(email)
  if (!user) {
    return null
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return null
  }

  return user
}

export async function registerAgent({ username, email, password }: { username: string; email: string; password: string }) {
  await ensureSeeded()
  const normalizedEmail = normalizeEmail(email)
  const existing = await getUserByEmail(normalizedEmail)
  if (existing) {
    throw new Error('An account already exists for this email.')
  }

  const Model = await useDatabase()
  const data = {
    username,
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    role: 'agent' as const,
    status: 'Pending' as const,
    rejectionReason: '',
  }

  if (Model) {
    const created = await Model.create(data)
    return toPlainUser(created)
  }

  const created = {
    id: `agent-${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString(),
  }
  memoryUsers.push(created)
  return created
}

export async function listAgents({ search = '', status = 'all' }: { search?: string; status?: string }) {
  await ensureSeeded()
  const Model = await useDatabase()
  if (Model) {
    const query: Record<string, any> = { role: 'agent' }
    if (status !== 'all') {
      query.status = status
    }

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    const docs = await Model.find(query).sort({ createdAt: -1 }).lean()
    return docs.map(toPlainUser)
  }

  return memoryUsers
    .filter((user) => user.role === 'agent')
    .filter((user) => {
      if (status !== 'all' && user.status !== status) {
        return false
      }

      if (!search) {
        return true
      }

      const needle = search.toLowerCase()
      return user.username.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle)
    })
}

export async function updateAgentStatus(id: string, status: AgentStatus, rejectionReason?: string) {
  const Model = await useDatabase()
  if (Model) {
    await Model.findByIdAndUpdate(id, { status, rejectionReason: rejectionReason || '' })
    return true
  }

  const existing = memoryUsers.find((user) => user.id === id)
  if (!existing) {
    return false
  }

  existing.status = status
  existing.rejectionReason = rejectionReason || ''
  return true
}

export async function deleteAgent(id: string) {
  const Model = await useDatabase()
  if (Model) {
    await Model.findByIdAndDelete(id)
    return true
  }

  const index = memoryUsers.findIndex((user) => user.id === id)
  if (index < 0) {
    return false
  }

  memoryUsers.splice(index, 1)
  return true
}
