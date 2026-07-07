import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

import { getUserById } from '@/lib/auth-store'
import { readSessionCookie } from '@/lib/session-cookie'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  rejectionReason?: string
}

import { createSessionCookie } from '@/lib/session-cookie'

export async function getServerSession() {
  const cookieStore = await cookies()
  const session = await readSessionCookie(cookieStore.get('delaharme-session')?.value)
  if (!session) {
    return null
  }

  const user = await getUserById(session.userId)
  if (!user) {
    return null
  }

  return {
    user: {
      id: user.id,
      name: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      rejectionReason: user.rejectionReason || '',
    } as SessionUser,
  }
}

export async function getSessionFromRequest(req: NextRequest | Request) {
  const cookieHeader = req.headers.get('cookie') || ''
  const cookie = cookieHeader.split(';').map((entry) => entry.trim()).find((entry) => entry.startsWith('delaharme-session='))
  const sessionValue = cookie?.split('=').slice(1).join('=')
  return await readSessionCookie(sessionValue)
}
