import jwt from 'jsonwebtoken'
import 'dotenv/config'

const DEFAULT_SECRET = 'dev-insecure-secret-change-me'
const DEFAULT_REFRESH_SECRET = 'dev-insecure-refresh-secret-change-me'

const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || DEFAULT_REFRESH_SECRET

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || JWT_SECRET === DEFAULT_SECRET) {
    throw new Error('JWT_SECRET must be set to a strong value in production')
  }
  if (!process.env.JWT_REFRESH_SECRET || JWT_REFRESH_SECRET === DEFAULT_REFRESH_SECRET) {
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

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload
}
