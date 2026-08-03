import { Router } from 'express'
import crypto from 'crypto'
import { registerSchema, buyerRegisterSchema, loginSchema } from '../utils/validation.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { signAccessToken, signRefreshToken, verifyAccessToken } from '../utils/jwt.js'
import { UserModel } from '../models/index.js'
import { sendVerificationEmail } from '../services/email.js'
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

    const existingUser = await UserModel.findOne({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const hashedPassword = await hashPassword(password)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const user = await UserModel.create({
      username,
      email,
      password: hashedPassword,
      role: 'agent',
      roles: ['agent'],
      status: 'Pending',
      verificationToken,
    } as any)

    // Send verification email in background (don't block response)
    sendVerificationEmail(email, username, verificationToken).catch((err) => {
      console.error('Failed to send verification email:', err.message)
    })

    notifyAdmins(
      'New Agent Registration',
      `${username} (${email}) has registered and is awaiting verification.`,
      'info',
      { type: 'agent', id: user.getDataValue('id') }
    ).catch(() => {})

    res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' })
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

    const existingUser = await UserModel.findOne({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const hashedPassword = await hashPassword(password)
    const user = await UserModel.create({
      username: name,
      email,
      phone,
      password: hashedPassword,
      role: 'user',
      roles: ['user'],
      status: 'Approved',
      emailVerified: true,
      profilePhoto,
      onboardingComplete: true,
    } as any)

    const userId = user.getDataValue('id')
    const accessToken = signAccessToken({ userId, email, role: 'user' })
    const refreshToken = signRefreshToken({ userId, email, role: 'user' })

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: userId,
        name,
        email,
        phone,
        role: 'user',
        roles: ['user'],
        status: 'Approved',
        isRootAdmin: false,
        profilePhoto: profilePhoto || null,
      },
      accessToken,
      refreshToken,
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Registration failed' })
  }
})

// Verify email
router.get('/verify-email', async (req, res) => {
  try {
    const token = req.query.token as string
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' })
    }

    const user = await UserModel.findOne({ where: { verificationToken: token } as any })
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' })
    }

    await user.update({ verificationToken: null, emailVerified: true })
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
    const user = await UserModel.findOne({ where: { email } })

    if (!user || !(await comparePassword(password, user.getDataValue('password')))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const status = user.getDataValue('status')
    if (status === 'Rejected') {
      return res.status(403).json({ message: 'Your account has been rejected', rejectionReason: user.getDataValue('rejectionReason') })
    }

    if (status === 'Suspended') {
      return res.status(403).json({ message: 'Your account has been suspended' })
    }

    const userId = user.getDataValue('id')
    const emailVal = user.getDataValue('email')
    const role = user.getDataValue('role')

    const accessToken = signAccessToken({ userId, email: emailVal, role })
    const refreshToken = signRefreshToken({ userId, email: emailVal, role })

    res.json({
      message: 'Login successful',
      user: {
        id: userId,
        name: user.getDataValue('username'),
        email: emailVal,
        role,
        roles: user.getDataValue('roles'),
        status,
        rejectionReason: user.getDataValue('rejectionReason'),
        isRootAdmin: user.getDataValue('isRootAdmin'),
        profilePhoto: user.getDataValue('profilePhoto'),
        phone: user.getDataValue('phone'),
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
    const user = await UserModel.findByPk(decoded.userId)

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    res.json({
      session: {
        user: {
          id: user.getDataValue('id'),
          name: user.getDataValue('username'),
          email: user.getDataValue('email'),
          role: user.getDataValue('role'),
          roles: user.getDataValue('roles'),
          status: user.getDataValue('status'),
          rejectionReason: user.getDataValue('rejectionReason'),
          isRootAdmin: user.getDataValue('isRootAdmin'),
          profilePhoto: user.getDataValue('profilePhoto'),
          phone: user.getDataValue('phone'),
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
    const user = await UserModel.findByPk(req.user!.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    const updates: any = {}
    if (typeof name === 'string' && name.trim().length >= 2) updates.username = name.trim()
    if (typeof phone === 'string') updates.phone = phone
    if (typeof profilePhoto === 'string') updates.profilePhoto = profilePhoto
    await user.update(updates)

    res.json({
      message: 'Profile updated',
      user: {
        id: user.getDataValue('id'),
        name: user.getDataValue('username'),
        email: user.getDataValue('email'),
        phone: user.getDataValue('phone'),
        role: user.getDataValue('role'),
        roles: user.getDataValue('roles'),
        status: user.getDataValue('status'),
        rejectionReason: user.getDataValue('rejectionReason'),
        isRootAdmin: user.getDataValue('isRootAdmin'),
        profilePhoto: user.getDataValue('profilePhoto'),
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
    const user = await UserModel.findByPk(req.user!.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    const { comparePassword, hashPassword } = await import('../utils/password.js')
    const valid = await comparePassword(currentPassword, user.getDataValue('password'))
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }
    const hashedPassword = await hashPassword(newPassword)
    await user.update({ password: hashedPassword })
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
