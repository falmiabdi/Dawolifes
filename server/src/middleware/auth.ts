import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt.js'
import { prisma } from '../lib/prisma.js'

interface RequestUser {
  userId: string
  email: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user?: RequestUser
}

/** Resolves the authenticated user from the Authorization header without rejecting the request. */
export function getRequestUserId(req: Request): RequestUser | null {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) return null
  try {
    const decoded = verifyAccessToken(header.split(' ')[1])
    return { userId: decoded.userId, email: decoded.email, role: decoded.role }
  } catch {
    return null
  }
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = verifyAccessToken(token)
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    }
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export function adminMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}

export function agentMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'agent' && req.user.role !== 'admin')) {
    return res.status(403).json({ message: 'Agent access required' })
  }
  next()
}

export async function requireActiveUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No token provided' })
    }
    if (req.user.role === 'admin') {
      return next()
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true, rejectionReason: true, onboardingComplete: true, emailVerified: true },
    })
    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    if (!user.emailVerified) {
      return res.status(403).json({ message: 'Please verify your email address before continuing.' })
    }

    const { status } = user
    if (status === 'Rejected') {
      return res.status(403).json({
        message: 'Your account has been rejected and cannot post listings.',
        rejectionReason: user.rejectionReason,
      })
    }
    if (status === 'Suspended') {
      return res.status(403).json({ message: 'Your account has been suspended and cannot post listings.' })
    }
    if (!user.onboardingComplete) {
      return res.status(403).json({ message: 'Please complete your profile before posting listings.' })
    }
    if (status !== 'Approved') {
      return res.status(403).json({ message: 'Your account is awaiting admin approval and cannot post listings yet.' })
    }

    next()
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify account status' })
  }
}

export async function requireVerifiedEmail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No token provided' })
    }
    if (req.user.role === 'admin') {
      return next()
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, emailVerified: true },
    })
    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    if (!user.emailVerified) {
      return res.status(403).json({ message: 'Please verify your email address first.' })
    }

    next()
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify email status' })
  }
}
