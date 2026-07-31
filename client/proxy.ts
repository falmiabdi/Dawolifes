import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/', '/login', '/register', '/listings', '/pay']
const onboardingRoute = '/agent/onboarding'
const agentOnlyRoutes = ['/post']

function getTokenFromRequest(req: NextRequest): string | null {
  // Check Authorization header first (Bearer token)
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Fall back to cookie
  return req.cookies.get('token')?.value || null
}

async function verifySession(token: string): Promise<any> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const response = await fetch(`${API_URL}/api/auth/session`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

export async function proxy(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const pathname = req.nextUrl.pathname

  // For admin routes, verify session
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const session = await verifySession(token)
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const user = session.user
    const isAdmin = user.role === 'admin' || user.roles?.includes('admin')
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  }

  if (pathname === onboardingRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/agent')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const session = await verifySession(token)
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  }

  if (agentOnlyRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  }

  if (publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/agent/:path*', '/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

