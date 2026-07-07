import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { readSessionCookie } from '@/lib/session-cookie'

const publicRoutes = ['/', '/login', '/register']
const onboardingRoute = '/agent/onboarding'

export async function middleware(req: NextRequest) {
  const cookieValue = req.cookies.get('delaharme-session')?.value
  const sessionPayload = await readSessionCookie(cookieValue)
  const pathname = req.nextUrl.pathname

  if (pathname.startsWith('/admin')) {
    if (!sessionPayload?.userId || sessionPayload.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  }

  if (pathname === onboardingRoute) {
    if (!sessionPayload?.userId) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/agent')) {
    if (!sessionPayload?.userId || sessionPayload.role !== 'agent') {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  }

  if (publicRoutes.some((route) => route === pathname)) {
    return NextResponse.next()
  }

  if (!sessionPayload?.userId) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/agent/:path*', '/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
