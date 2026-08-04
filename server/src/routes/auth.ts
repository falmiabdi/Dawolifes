import { Router } from 'express'
import { registerSchema, buyerRegisterSchema, loginSchema } from '../utils/validation.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { signAccessToken, signRefreshToken, verifyAccessToken } from '../utils/jwt.js'
import { generateOtp, otpExpiresAt } from '../utils/otp.js'
import { prisma } from '../lib/prisma.js'
import { sendOtpEmail } from '../services/email.js'
import { notifyAdmins } from '../utils/notifications.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// Register
router.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() })
    }

    const { username, email, password } = parsed.data

    const existingUser = await prisma.user.findFirst({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'agent',
        roles: ['agent'],
        status: 'Pending',
      },
    })

    // Send OTP email in background (don't block response)
    const otp = generateOtp()
    const expiresAt = otpExpiresAt()
    await prisma.user.update({ where: { id: user.id }, data: { otp, otpExpiresAt: expiresAt } })
    sendOtpEmail(email, username, otp).catch((err) => {
      console.error('Failed to send OTP email:', err.message)
    })

    notifyAdmins(
      'New Agent Registration',
      `${username} (${email}) has registered and is awaiting verification.`,
      'info',
      { type: 'agent', id: user.id }
    ).catch(() => {})

    res.status(201).json({ message: 'Registration successful. Please verify your email with the code we sent you.' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Registration failed' })
  }
})

// Buyer / user registration
router.post('/register-buyer', async (req, res) => {
  try {
    const parsed = buyerRegisterSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() })
    }

    const { name, email, phone, password, profilePhoto } = parsed.data

    const existingUser = await prisma.user.findFirst({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        username: name,
        email,
        phone,
        password: hashedPassword,
        role: 'user',
        roles: ['user'],
        status: 'Approved',
        emailVerified: false,
        profilePhoto,
        onboardingComplete: true,
      },
    })

    // Send OTP email in background (don't block response)
    const otp = generateOtp()
    const expiresAt = otpExpiresAt()
    await prisma.user.update({ where: { id: user.id }, data: { otp, otpExpiresAt: expiresAt } })
    sendOtpEmail(email, name, otp).catch((err) => {
      console.error('Failed to send OTP email:', err.message)
    })

    res.status(201).json({
      message: 'Account created successfully. Please verify your email with the code we sent you.',
      user: {
        id: user.id,
        name,
        email,
        phone,
        role: 'user',
        roles: ['user'],
        status: 'Approved',
        emailVerified: false,
        isRootAdmin: false,
        profilePhoto: profilePhoto || null,
      },
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Registration failed' })
  }
})

// Verify email with OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP code are required' })
    }

    const user = await prisma.user.findFirst({ where: { email: String(email).trim().toLowerCase() } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const storedOtp = user.otp
    const expiresAt = user.otpExpiresAt

    if (!storedOtp || String(storedOtp).trim() !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid OTP code' })
    }
    if (!expiresAt || new Date(expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ message: 'OTP code has expired. Please request a new one.' })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { otp: null, otpExpiresAt: null, emailVerified: true },
    })

    const { id: userId, email: emailVal, role } = updatedUser

    const payload = { userId, email: emailVal, role }
    const response: any = { message: 'Email verified successfully' }

    if (role === 'user') {
      const accessToken = signAccessToken(payload)
      const refreshToken = signRefreshToken(payload)
      response.accessToken = accessToken
      response.refreshToken = refreshToken
      response.user = {
        id: userId,
        name: updatedUser.username,
        email: emailVal,
        role,
        roles: updatedUser.roles,
        status: updatedUser.status,
        emailVerified: true,
        isRootAdmin: updatedUser.isRootAdmin,
        profilePhoto: updatedUser.profilePhoto,
        phone: updatedUser.phone,
      }
    }

    res.json(response)
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Verification failed' })
  }
})

// Resend OTP code
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    const user = await prisma.user.findFirst({ where: { email: String(email).trim().toLowerCase() } })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const otp = generateOtp()
    const expiresAt = otpExpiresAt()
    await prisma.user.update({ where: { id: user.id }, data: { otp, otpExpiresAt: expiresAt } })

    sendOtpEmail(user.email, user.username, otp).catch((err) => {
      console.error('Failed to resend OTP email:', err.message)
    })

    res.json({ message: 'A new verification code has been sent to your email.' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to resend OTP' })
  }
})

// Verify email
router.get('/verify-email', async (req, res) => {
  try {
    const token = req.query.token as string
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' })
    }

    const user = await prisma.user.findFirst({ where: { verificationToken: token } })
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' })
    }

    await prisma.user.update({ where: { id: user.id }, data: { verificationToken: null, emailVerified: true } })
    res.json({ message: 'Email verified successfully. You can now sign in.' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Verification failed' })
  }
})

// Login
router.post('/signin', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() })
    }

    const { email, password } = parsed.data
    const user = await prisma.user.findFirst({ where: { email } })

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

    if (role !== 'admin' && !user.emailVerified) {
      return res.status(403).json({ message: 'Please verify your email first. Check your inbox for the OTP code.' })
    }

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
    const { comparePassword, hashPassword } = await import('../utils/password.js')
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

// Signout
router.post('/signout', (_req, res) => {
  res.json({ message: 'Signed out successfully' })
})

export default router
