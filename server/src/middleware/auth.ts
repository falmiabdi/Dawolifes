import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt.js'
import { UserModel } from '../models/index.js'

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        email: string
        role: string
      }
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string
    email: string
    role: string
  }
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  } else if (req.query.token) {
    token = req.query.token as string
  } else {
    return res.status(401).json({ message: 'No token provided' })
  }
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

    const user = await UserModel.findByPk(req.user.userId, { attributes: ['id', 'role', 'status', 'rejectionReason'] })
    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    const status = user.getDataValue('status')
    if (status === 'Rejected') {
      return res.status(403).json({
        message: 'Your account has been rejected and cannot post listings.',
        rejectionReason: user.getDataValue('rejectionReason'),
      })
    }
    if (status === 'Suspended') {
      return res.status(403).json({ message: 'Your account has been suspended and cannot post listings.' })
    }

    next()
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify account status' })
  }
}
