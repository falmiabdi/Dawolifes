import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { verifyAccessToken } from './jwt-utils'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
  roles?: string[]
  status: string
  rejectionReason?: string
  isRootAdmin?: boolean
  profilePhoto?: string | null
}

export async function getServerSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return null
  }

  try {
    const decoded = verifyAccessToken(token)
    // Fetch full user data from the API
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const response = await fetch(`${API_URL}/api/auth/session`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.session
  } catch {
    return null
  }
}

export async function getSessionFromRequest(req?: NextRequest | Request) {
  const authHeader = req?.headers.get?.('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null

  if (!token) {
    return null
  }

  try {
    const decoded = verifyAccessToken(token)
    return {
      token,
      user: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
    }
  } catch {
    return null
  }
}
