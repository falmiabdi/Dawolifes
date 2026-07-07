import { NextResponse } from 'next/server'

import { registerAgent } from '@/lib/auth-store'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const username = String(payload.username || '').trim()
    const email = String(payload.email || '').trim()
    const password = String(payload.password || '').trim()

    if (!username || !email || !password) {
      return NextResponse.json({ message: 'Username, email, and password are required.' }, { status: 400 })
    }

    const user = await registerAgent({ username, email, password })

    return NextResponse.json({
      message: 'Account created successfully.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Registration failed.' }, { status: 400 })
  }
}
