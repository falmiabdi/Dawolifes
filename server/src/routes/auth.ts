import { Router } from 'express'
import { registerSchema, buyerRegisterSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validation.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { signAccessToken, signRefreshToken, verifyAccessToken, signEmailVerifyToken, verifyEmailToken } from '../utils/jwt.js'
import { generateOtp, otpExpiresAt } from '../utils/otp.js'
import { prisma } from '../lib/prisma.js'
import { notifyAdmins } from '../utils/notifications.js'
import { authMiddleware } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { sendOtpEmail, sendResetPasswordEmail } from '../services/email.js'
import { verifyFirebaseIdToken } from '../utils/firebase.js'

const router = Router()

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 })

const emailFilter = (email: string) => ({ email: { equals: email, mode: 'insensitive' as const } })
const normalizeEmail = (email: string) => email.trim().toLowerCase()

// Accounts are created immediately in the DB at registration with
// emailVerified=false, so a user with a correct password can always sign in
// (the account survives server restarts) and OTP codes are persisted on the
// user record instead of living in memory.
const OTP_BYPASS_CODE = process.env.OTP_BYPASS_CODE

function createUserWithOtp(data: {
  username: string
  email: string
  phone?: string
  passwordHash: string
  profilePhoto?: string
  role: 'agent' | 'user'
}) {
  const otp = generateOtp()
  const expiresAt = otpExpiresAt()
  const verifyToken = signEmailVerifyToken(data.email)
  return prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      phone: data.phone,
      password: data.passwordHash,
      profilePhoto: data.profilePhoto,
      role: data.role,
      roles: [data.role],
      status: data.role === 'agent' ? 'Pending' : 'Approved',
      emailVerified: false,
      onboardingComplete: data.role === 'user',
      otp,
      otpExpiresAt: expiresAt,
    },
  }).then((user) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[OTP] Verification code for ${data.email}: ${otp} (expires in 60 minutes)`)
    }
    sendOtpEmail(data.email, data.username, otp, verifyToken).catch((err) => {
      console.error('Failed to send OTP email:', err)
    })
    return user
  })
}

// Register (Agent)
router.post('/register', authLimiter, async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten() })
    }

    const { username, email, password } = parsed.data
    const normalizedEmail = normalizeEmail(email)

    const existingUser = await prisma.user.findFirst({ where: emailFilter(normalizedEmail) })
    if (existingUser && existingUser.emailVerified) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    if (existingUser && !existingUser.emailVerified) {
      const otp = generateOtp()
      const expiresAt = otpExpiresAt()
      const verifyToken = signEmailVerifyToken(normalizedEmail)
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { otp, otpExpiresAt: expiresAt },
      })
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[OTP] Verification code for ${normalizedEmail}: ${otp} (expires in 60 minutes)`)
      }
      sendOtpEmail(normalizedEmail, username, otp, verifyToken).catch((err) => {
        console.error('Failed to send OTP email:', err)
      })
      return res.status(200).json({
        message: 'An account already exists for this email. A new verification code has been sent.',
        ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
      })
    }

    const hashedPassword = await hashPassword(password)
    const user = await createUserWithOtp({
      username,
      email: normalizedEmail,
      passwordHash: hashedPassword,
      role: 'agent',
    })

    res.status(201).json({
      message: 'Registration successful. Please verify your email to continue.',
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: user.otp } : {}),
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
    if (existingUser && existingUser.emailVerified) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    if (existingUser && !existingUser.emailVerified) {
      const otp = generateOtp()
      const expiresAt = otpExpiresAt()
      const verifyToken = signEmailVerifyToken(normalizedEmail)
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { otp, otpExpiresAt: expiresAt },
      })
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[OTP] Verification code for ${normalizedEmail}: ${otp} (expires in 60 minutes)`)
      }
      sendOtpEmail(normalizedEmail, name, otp, verifyToken).catch((err) => {
        console.error('Failed to send OTP email:', err)
      })
      return res.status(200).json({
        message: 'An account already exists for this email. A new verification code has been sent.',
        pending: true,
        ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
      })
    }

    const hashedPassword = await hashPassword(password)
    const user = await createUserWithOtp({
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
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: user.otp } : {}),
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
    let user: any = await prisma.user.findFirst({ where: emailFilter(normalizedEmail) })

    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' })
    }

    if (!user.emailVerified) {
      const bypass = !!OTP_BYPASS_CODE && String(otp).trim() === OTP_BYPASS_CODE
      const storedOtp = user.otp
      if (!bypass && (!storedOtp || String(storedOtp).trim() !== String(otp).trim())) {
        return res.status(400).json({ message: 'Invalid OTP code' })
      }
      if (!bypass && (!user.otpExpiresAt || new Date(user.otpExpiresAt).getTime() < Date.now())) {
        return res.status(400).json({ message: 'OTP code has expired. Please request a new one.' })
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: { otp: null, otpExpiresAt: null, emailVerified: true, emailVerifiedAt: new Date() },
      })

      if (user.role === 'agent') {
        notifyAdmins(
          'New Agent Registration',
          `${user.username} (${user.email}) has verified their email and is awaiting approval.`,
          'info',
          { type: 'agent', id: user.id }
        ).catch(() => {})
      }
    }

    const { id: userId, email: emailVal, role } = user

    const payload = { userId, email: emailVal, role }
    const response: any = { message: 'Email verified successfully' }

    if (role === 'user' || role === 'agent') {
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
    const user = await prisma.user.findFirst({ where: emailFilter(normalizedEmail) })
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' })
    }

    const otp = generateOtp()
    const expiresAt = otpExpiresAt()
    const verifyToken = signEmailVerifyToken(String(email))
    await prisma.user.update({ where: { id: user.id }, data: { otp, otpExpiresAt: expiresAt } })

    sendOtpEmail(normalizeEmail(String(email)), user.username, otp, verifyToken).catch((err) => {
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

// Email-link verification
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query
    if (!token || typeof token !== 'string') {
      return res.status(400).send('Missing verification token')
    }

    let email: string
    try {
      email = verifyEmailToken(token).email
    } catch {
      return res.status(400).send('This verification link is invalid or has expired. Please request a new code.')
    }

    const normalizedEmail = normalizeEmail(email)
    const user = await prisma.user.findFirst({ where: emailFilter(normalizedEmail) })
    if (!user) {
      return res.status(404).send('User not found. Please register first.')
    }
    if (user.emailVerified) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?verified=1`)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifiedAt: new Date(), otp: null, otpExpiresAt: null },
    })

    if (user.role === 'agent') {
      notifyAdmins(
        'New Agent Registration',
        `${user.username} (${user.email}) has verified their email and is now approved.`,
        'info',
        { type: 'agent', id: user.id }
      ).catch(() => {})
    }

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?verified=1`)
  } catch (err: any) {
    res.status(500).send(err.message || 'Verification failed')
  }
})

// Check verification status
router.post('/check-verification', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    const normalizedEmail = normalizeEmail(String(email))
    const user = await prisma.user.findFirst({ where: emailFilter(normalizedEmail) })
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' })
    }
    if (!user.emailVerified) {
      return res.json({ verified: false, message: 'Email not verified yet. Check your inbox and click the link, or enter the code below.' })
    }

    const { id: userId, email: emailVal, role } = user
    const response: any = { verified: true, message: 'Email verified successfully' }

    if (role === 'user' || role === 'agent') {
      const payload = { userId, email: emailVal, role }
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
        emailVerified: user.emailVerified,
        isRootAdmin: user.isRootAdmin,
        profilePhoto: user.profilePhoto,
        phone: user.phone,
        onboardingComplete: user.onboardingComplete,
      }
    }

    res.json(response)
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to check verification' })
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
    let user = await prisma.user.findFirst({ where: emailFilter(normalizeEmail(email)) })

    if (!user || !user.password || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Auto-verify if user logs in with valid password
    if (!user.emailVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, emailVerifiedAt: user.emailVerifiedAt || new Date(), otp: null, otpExpiresAt: null },
      })
    }

    const { status } = user
    // Agents may only sign in after their application has been approved.
    if (user.role === 'agent' && status !== 'Approved') {
      return res.status(403).json({
        message:
          status === 'Rejected'
            ? 'Your account has been rejected'
            : status === 'Suspended'
              ? 'Your account has been suspended'
              : 'Your application is under review. You can sign in once your account is approved.',
      })
    }

    // Backwards-compatible guards for non-agent accounts.
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
        emailVerified: user.emailVerified,
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

// Firebase Authentication (Google OAuth & Firebase Email/Password)
router.post('/firebase', authLimiter, async (req, res) => {
  try {
    const { idToken, role: requestedRole, name: providedName, phone: providedPhone } = req.body
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ message: 'idToken is required' })
    }

    // 1. Verify token signature, audience, issuer, expiration via Firebase Admin SDK
    let verifiedFirebaseUser
    try {
      verifiedFirebaseUser = await verifyFirebaseIdToken(idToken)
    } catch (tokenErr: any) {
      console.error('Firebase token verification error:', tokenErr.message)
      return res.status(401).json({ message: 'Invalid or expired Firebase token', error: tokenErr.message })
    }

    const { uid, email, emailVerified, name, picture, phoneNumber } = verifiedFirebaseUser

    // 2. Look up existing user by firebaseUid or normalized email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { firebaseUid: uid },
          emailFilter(email),
        ],
      },
    })

    const targetRole = requestedRole === 'agent' ? 'agent' : 'user'
    const finalName = providedName || name || email.split('@')[0]
    const finalPhone = providedPhone || phoneNumber || null

    if (!user) {
      // 3. Create new user with verification strictly synced from Firebase token
      user = await prisma.user.create({
        data: {
          firebaseUid: uid,
          username: finalName,
          email,
          phone: finalPhone,
          profilePhoto: picture || null,
          role: targetRole,
          roles: [targetRole],
          status: targetRole === 'agent' ? 'Pending' : 'Approved',
          emailVerified,
          emailVerifiedAt: emailVerified ? new Date() : null,
          onboardingComplete: targetRole === 'user',
        },
      })
    } else {
      // 4. Update existing user details & synchronize verification status from Firebase
      const updates: any = {}
      if (!user.firebaseUid) {
        updates.firebaseUid = uid
      }
      if (emailVerified && !user.emailVerified) {
        updates.emailVerified = true
        updates.emailVerifiedAt = user.emailVerifiedAt || new Date()
        updates.otp = null
        updates.otpExpiresAt = null
      }
      if (!user.profilePhoto && picture) {
        updates.profilePhoto = picture
      }
      if (!user.phone && finalPhone) {
        updates.phone = finalPhone
      }

      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updates,
        })
      }
    }

    // 5. Check account approval status
    if (user.status === 'Rejected') {
      return res.status(403).json({
        message: 'Your account has been rejected',
        rejectionReason: user.rejectionReason,
      })
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({ message: 'Your account has been suspended' })
    }

    // 6. If email is not yet verified in Firebase, return notice without issuing JWT session
    if (!user.emailVerified) {
      return res.status(200).json({
        message: 'Email verification required. Please verify your email before continuing.',
        requiresEmailVerification: true,
        emailVerified: false,
        user: {
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.role,
          roles: user.roles,
          status: user.status,
          emailVerified: false,
          rejectionReason: user.rejectionReason,
          isRootAdmin: user.isRootAdmin,
          profilePhoto: user.profilePhoto,
          phone: user.phone,
          onboardingComplete: user.onboardingComplete,
        },
      })
    }

    // 7. Issue DawoLife JWT session tokens for verified users
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
    const refreshToken = signRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return res.json({
      message: 'Authentication successful',
      requiresEmailVerification: false,
      emailVerified: true,
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
        role: user.role,
        roles: user.roles,
        status: user.status,
        emailVerified: true,
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
    console.error('POST /api/auth/firebase error:', err)
    return res.status(500).json({ message: err.message || 'Firebase authentication failed' })
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
          emailVerified: user.emailVerified,
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
        emailVerified: updatedUser.emailVerified,
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
    const valid = user.password ? await comparePassword(currentPassword, user.password) : false
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
