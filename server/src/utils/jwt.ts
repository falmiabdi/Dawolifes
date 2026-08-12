import jwt from 'jsonwebtoken'
import 'dotenv/config'

const DEFAULT_SECRET = 'dev-insecure-secret-change-me'
const DEFAULT_REFRESH_SECRET = 'dev-insecure-refresh-secret-change-me'

const isProduction = process.env.NODE_ENV === 'production'
const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? '' : DEFAULT_SECRET)
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (isProduction ? '' : DEFAULT_REFRESH_SECRET)

if (isProduction) {
  if (!JWT_SECRET || JWT_SECRET === DEFAULT_SECRET) {
    throw new Error('JWT_SECRET must be set to a strong value in production')
  }
  if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET === DEFAULT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET must be set to a strong value in production')
  }
}

export interface JwtPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

export interface EmailVerifyTokenPayload {
  email: string
  purpose: 'verify-email'
  iat?: number
  exp?: number
}

// Stateless email-link verification token (signed JWT, no DB column needed).
export function signEmailVerifyToken(email: string): string {
  return jwt.sign({ email, purpose: 'verify-email' }, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyEmailToken(token: string): EmailVerifyTokenPayload {
  const payload = jwt.verify(token, JWT_SECRET) as EmailVerifyTokenPayload
  if (payload.purpose !== 'verify-email' || !payload.email) {
    throw new Error('Invalid email verification token')
  }
  return payload
}
