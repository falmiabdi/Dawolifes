import { Router } from 'express'
import { registerSchema, buyerRegisterSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validation.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { signAccessToken, signRefreshToken, verifyAccessToken } from '../utils/jwt.js'
import { generateOtp, otpExpiresAt } from '../utils/otp.js'
import { prisma } from '../lib/prisma.js'
import { notifyAdmins } from '../utils/notifications.js'
import { authMiddleware } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { sendOtpEmail, sendResetPasswordEmail } from '../services/email.js'

const router = Router()

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 })

const emailFilter = (email: string) => ({ email: { equals: email, mode: 'insensitive' as const } })
const normalizeEmail = (email: string) => email.trim().toLowerCase()

// Pending registrations are held in memory and only committed to the DB after
// the user submits the correct verification code.
interface PendingRegistration {
  username: string
  email: string
  phone?: string
  passwordHash: string
  profilePhoto?: string
  role: 'agent' | 'user'
  otp: string
  otpExpiresAt: Date
}
const pendingRegistrations = new Map<string, PendingRegistration>()
// The universal bypass code is ONLY active when explicitly configured via env.
// Never enable it in production.
const OTP_BYPASS_CODE = process.env.OTP_BYPASS_CODE

setInterval(() => {
  const now = Date.now()
  for (const [email, pending] of pendingRegistrations) {
    if (pending.otpExpiresAt.getTime() < now) {
      pendingRegistrations.delete(email)
    }
  }
}, 10 * 60 * 1000)

function storePendingRegistration(
  email: string,
  data: Omit<PendingRegistration, 'otp' | 'otpExpiresAt'>
) {
  const pending: PendingRegistration = {
    ...data,
    email,
    otp: generateOtp(),
    otpExpiresAt: otpExpiresAt(),
  }
  pendingRegistrations.set(email, pending)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[OTP] Verification code for ${email}: ${pending.otp} (expires in 10 minutes)`)
  }
  sendOtpEmail(email, pending.username, pending.otp).catch((err) => {
    console.error('Failed to send OTP email:', err)
  })
  return pending
}

// Register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() })
    }

    const { username, email, password } = parsed.data
    const normalizedEmail = normalizeEmail(email)

    const existingUser = await prisma.user.findFirst({ where: emailFilter(normalizedEmail) })
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const hashedPassword = await hashPassword(password)
    const pending = storePendingRegistration(normalizedEmail, {
      username,
      email: normalizedEmail,
      passwordHash: hashedPassword,
      role: 'agent',
    })

    res.status(201).json({
      message: 'Registration successful. Please verify your email to continue.',
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: pending.otp } : {}),
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Registration failed' })
  }
})

// Buyer / user registration
router.post('/register-buyer', authLimiter, async (req, res) => {
  try {
    const parsed = buyerRegisterSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() })
    }

    const { name, email, phone, password, profilePhoto } = parsed.data
    const normalizedEmail = normalizeEmail(email)

    const existingUser = await prisma.user.findFirst({ where: emailFilter(normalizedEmail) })
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const hashedPassword = await hashPassword(password)
    const pending = storePendingRegistration(normalizedEmail, {
      username: name,
      email: normalizedEmail,
      phone,
      passwordHash: hashedPassword,
      profilePhoto,
      role: 'user',
    })

    res.status(201).json({
      message: 'Account created successfully. Please verify your email to continue.',
      pending: true,
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: pending.otp } : {}),
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Registration failed' })
  }
})

// Verify email with OTP
router.post('/verify-otp', otpLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP code are required' })
    }

    const normalizedEmail = normalizeEmail(String(email))
    const pending = pendingRegistrations.get(normalizedEmail)

    let user: any
    let createdNow = false

    if (pending) {
    const bypass = !!OTP_BYPASS_CODE && String(otp).trim() === OTP_BYPASS_CODE
    if (!bypass && String(otp).trim() !== pending.otp) {
      return res.status(400).json({ message: 'Invalid OTP code' })
    }
    if (!bypass && pending.otpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'OTP code has expired. Please request a new one.' })
    }

      // Account is created ONLY after the correct code is entered.
      user = await prisma.user.create({
        data: {
          username: pending.username,
          email: pending.email,
          phone: pending.phone,
          password: pending.passwordHash,
          profilePhoto: pending.profilePhoto,
          role: pending.role,
          roles: [pending.role],
          status: pending.role === 'agent' ? 'Pending' : 'Approved',
          emailVerified: true,
          onboardingComplete: pending.role === 'user',
        },
      })
      pendingRegistrations.delete(normalizedEmail)
      createdNow = true

      if (pending.role === 'agent') {
        notifyAdmins(
          'New Agent Registration',
          `${pending.username} (${pending.email}) has verified their email and is awaiting approval.`,
          'info',
          { type: 'agent', id: user.id }
        ).catch(() => {})
      }
    } else {
      user = await prisma.user.findFirst({ where: emailFilter(normalizedEmail) })
      if (!user) {
        return res.status(404).json({ message: 'User not found. Please register first.' })
      }

      // Legacy flow: OTP stored on the user record.
      const storedOtp = user.otp
      const expiresAt = user.otpExpiresAt
      if (!storedOtp || String(storedOtp).trim() !== String(otp).trim()) {
        return res.status(400).json({ message: 'Invalid OTP code' })
      }
      if (!expiresAt || new Date(expiresAt).getTime() < Date.now()) {
        return res.status(400).json({ message: 'OTP code has expired. Please request a new one.' })
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: { otp: null, otpExpiresAt: null, emailVerified: true },
      })
    }

    const { id: userId, email: emailVal, role } = user

    const payload = { userId, email: emailVal, role }
    const response: any = { message: 'Email verified successfully' }

    if (role === 'user') {
      const accessToken = signAccessToken(payload)
      const refreshToken = signRefreshToken(payload)
      response.accessToken = accessToken
      response.refreshToken = refreshToken
      response.user = {
        id: userId,
        name: user.username,
        email: emailVal,
        role,
        roles: user.roles,
        status: user.status,
        emailVerified: true,
        isRootAdmin: user.isRootAdmin,
        profilePhoto: user.profilePhoto,
        phone: user.phone,
        onboardingComplete: user.onboardingComplete,
      }
    }

    res.json(response)
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Verification failed' })
  }
})

// Resend OTP code
router.post('/resend-otp', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    const normalizedEmail = normalizeEmail(String(email))
    const pending = pendingRegistrations.get(normalizedEmail)

    if (pending) {
      pending.otp = generateOtp()
      pending.otpExpiresAt = otpExpiresAt()
      sendOtpEmail(normalizedEmail, pending.username, pending.otp).catch((err) => {
        console.error('Failed to send OTP email:', err)
      })
      return res.json({
        message: 'A new verification code has been generated.',
        ...(process.env.NODE_ENV !== 'production' ? { devOtp: pending.otp } : {}),
      })
    }

    const user = await prisma.user.findFirst({ where: emailFilter(normalizedEmail) })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const otp = generateOtp()
    const expiresAt = otpExpiresAt()
    await prisma.user.update({ where: { id: user.id }, data: { otp, otpExpiresAt: expiresAt } })

    sendOtpEmail(normalizeEmail(String(email)), user.username, otp).catch((err) => {
      console.error('Failed to send OTP email:', err)
    })

    res.json({
      message: 'A new verification code has been generated.',
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to resend OTP' })
  }
})

// Login
router.post('/signin', authLimiter, async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() })
    }

    const { email, password } = parsed.data
    const user = await prisma.user.findFirst({ where: emailFilter(normalizeEmail(email)) })

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const { status } = user
    if (status === 'Rejected') {
      return res.status(403).json({ message: 'Your account has been rejected', rejectionReason: user.rejectionReason })
    }

    if (status === 'Suspended') {
      return res.status(403).json({ message: 'Your account has been suspended' })
    }

    const userId = user.id
    const emailVal = user.email
    const role = user.role

    const accessToken = signAccessToken({ userId, email: emailVal, role })
    const refreshToken = signRefreshToken({ userId, email: emailVal, role })

    res.json({
      message: 'Login successful',
      user: {
        id: userId,
        name: user.username,
        email: emailVal,
        role,
        roles: user.roles,
        status,
        rejectionReason: user.rejectionReason,
        isRootAdmin: user.isRootAdmin,
        profilePhoto: user.profilePhoto,
        phone: user.phone,
        onboardingComplete: user.onboardingComplete,
      },
      accessToken,
      refreshToken,
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Login failed' })
  }
})

// Get session
router.get('/session', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }
    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    res.json({
      session: {
        user: {
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.role,
          roles: user.roles,
          status: user.status,
          rejectionReason: user.rejectionReason,
          isRootAdmin: user.isRootAdmin,
          profilePhoto: user.profilePhoto,
          phone: user.phone,
          onboardingComplete: user.onboardingComplete,
        },
      },
    })
  } catch (err: any) {
    res.status(401).json({ message: 'Invalid token' })
  }
})

// Update profile
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, profilePhoto } = req.body
    if (!name && !phone && !profilePhoto) {
      return res.status(400).json({ message: 'Nothing to update' })
    }
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    const updates: any = {}
    if (typeof name === 'string' && name.trim().length >= 2) updates.username = name.trim()
    if (typeof phone === 'string') updates.phone = phone
    if (typeof profilePhoto === 'string') updates.profilePhoto = profilePhoto
    const updatedUser = await prisma.user.update({ where: { id: req.user!.userId }, data: updates })

    res.json({
      message: 'Profile updated',
      user: {
        id: updatedUser.id,
        name: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        roles: updatedUser.roles,
        status: updatedUser.status,
        rejectionReason: updatedUser.rejectionReason,
        isRootAdmin: updatedUser.isRootAdmin,
        profilePhoto: updatedUser.profilePhoto,
        onboardingComplete: updatedUser.onboardingComplete,
      },
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update profile' })
  }
})

// Change password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' })
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    const valid = await comparePassword(currentPassword, user.password)
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }
    const hashedPassword = await hashPassword(newPassword)
    await prisma.user.update({ where: { id: req.user!.userId }, data: { password: hashedPassword } })
    res.json({ message: 'Password changed successfully' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to change password' })
  }
})

// Forgot password: send a reset OTP to the user's email
router.post('/forgot-password', otpLimiter, async (req, res) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'A valid email is required' })
    }

    const normalizedEmail = normalizeEmail(parsed.data.email)
    const user = await prisma.user.findFirst({ where: emailFilter(normalizedEmail) })

    // Always respond the same way whether or not the account exists to avoid
    // leaking which emails are registered.
    if (!user) {
      return res.json({ message: 'If an account exists for that email, a reset code has been sent.' })
    }

    const otp = generateOtp()
    const expiresAt = otpExpiresAt()
    await prisma.user.update({ where: { id: user.id }, data: { otp, otpExpiresAt: expiresAt } })

    sendResetPasswordEmail(normalizedEmail, user.username, otp).catch((err) => {
      console.error('Failed to send reset password email:', err)
    })

    res.json({
      message: 'If an account exists for that email, a reset code has been sent.',
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to send reset code' })
  }
})

// Reset password: verify OTP + set new password
router.post('/reset-password', otpLimiter, async (req, res) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Email, reset code and a new password (min 8 characters) are required' })
    }

    const { email, otp, newPassword } = parsed.data
    const normalizedEmail = normalizeEmail(email)
    const user = await prisma.user.findFirst({ where: emailFilter(normalizedEmail) })
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' })
    }

    const bypass = !!OTP_BYPASS_CODE && String(otp).trim() === OTP_BYPASS_CODE
    const storedOtp = user.otp
    if (!bypass && (!storedOtp || String(storedOtp).trim() !== String(otp).trim())) {
      return res.status(400).json({ message: 'Invalid reset code' })
    }
    if (!bypass && (!user.otpExpiresAt || new Date(user.otpExpiresAt).getTime() < Date.now())) {
      return res.status(400).json({ message: 'Reset code has expired. Please request a new one.' })
    }

    const hashedPassword = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, otp: null, otpExpiresAt: null },
    })

    res.json({ message: 'Password reset successfully. You can now sign in.' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to reset password' })
  }
})

// Signout
router.post('/signout', (_req, res) => {
  res.json({ message: 'Signed out successfully' })
})

export default router
