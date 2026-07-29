import { Router } from 'express'
import { registerSchema, loginSchema } from '../utils/validation.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { signAccessToken, signRefreshToken, verifyAccessToken } from '../utils/jwt.js'
import { UserModel } from '../models/index.js'

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
    const user = await UserModel.create({
      username,
      email,
      password: hashedPassword,
      role: 'agent',
      roles: ['agent'],
      status: 'Pending',
    } as any)

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

    const accessToken = signAccessToken({
      userId,
      email: emailVal,
      role,
    })
    const refreshToken = signRefreshToken({
      userId,
      email: emailVal,
      role,
    })

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
