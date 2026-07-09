import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

import { getUserById } from '@/lib/auth-store'
import { readSessionCookie } from '@/lib/session-cookie'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
  roles?: string[]
  status: string
  rejectionReason?: string
  isRootAdmin?: boolean
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
      roles: user.roles,
      status: user.status,
      rejectionReason: user.rejectionReason || '',
      isRootAdmin: user.isRootAdmin,
    } as SessionUser,
  }
}

export async function getSessionFromRequest(_req?: NextRequest | Request) {
  const cookieStore = await cookies()
  const sessionValue = cookieStore.get('delaharme-session')?.value
  return await readSessionCookie(sessionValue)
}
