import { Router } from 'express'
import { registerSchema, loginSchema } from '../utils/validation.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js'
import { UserModel } from '../models/User.js'

const router = Router()

// Register
router.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() })
    }

    const { username, email, password } = parsed.data

    const existingUser = await UserModel.findOne({ email })
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const hashedPassword = await hashPassword(password)
    const user = new UserModel({
      username,
      email,
      password: hashedPassword,
      role: 'agent',
      roles: ['agent'],
      status: 'Pending',
    })
    await user.save()

    res.status(201).json({ message: 'Registration successful. Please sign in.' })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Registration failed' })
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
    const user = await UserModel.findOne({ email })

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (user.status === 'Rejected') {
      return res.status(403).json({ message: 'Your account has been rejected', rejectionReason: user.rejectionReason })
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({ message: 'Your account has been suspended' })
    }

    const accessToken = signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    })
    const refreshToken = signRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    res.json({
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        name: user.username,
        email: user.email,
        role: user.role,
        roles: user.roles,
        status: user.status,
        rejectionReason: user.rejectionReason,
        isRootAdmin: user.isRootAdmin,
        profilePhoto: user.profilePhoto,
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
    const user = await UserModel.findById(decoded.userId)

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    res.json({
      session: {
        user: {
          id: user._id.toString(),
          name: user.username,
          email: user.email,
          role: user.role,
          roles: user.roles,
          status: user.status,
          rejectionReason: user.rejectionReason,
          isRootAdmin: user.isRootAdmin,
          profilePhoto: user.profilePhoto,
        },
      },
    })
  } catch (err: any) {
    res.status(401).json({ message: 'Invalid token' })
  }
})

// Signout
router.post('/signout', (_req, res) => {
  res.json({ message: 'Signed out successfully' })
})

export default router
