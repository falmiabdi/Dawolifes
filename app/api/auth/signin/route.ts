import { NextResponse } from 'next/server'

import { authenticateUser } from '@/lib/auth-store'
import { createSessionCookie } from '@/lib/session-cookie'

export async function POST(request: Request) {
  const body = await request.json()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const user = await authenticateUser({ email, password })

  if (!user) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: user.role, status: user.status } })
  response.cookies.set('delaharme-session', await createSessionCookie({ userId: user.id, email: user.email, role: user.role, status: user.status }), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
