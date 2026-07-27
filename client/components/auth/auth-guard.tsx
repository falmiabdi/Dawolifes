'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Capacitor } from '@capacitor/core'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

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

interface AuthContextType {
  user: SessionUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<any>
  register: (data: { username: string; email: string; password: string }) => Promise<any>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, login: async () => {}, register: async () => {}, logout: () => {} })

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuthSession()
  }, [])

  async function fetchAuthSession() {
    try {
      const token = await getToken()
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch(`${API_URL}/api/auth/session`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data?.session?.user) {
          setUser(data.session.user)
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }

  async function getToken(): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences')
      const { value } = await Preferences.get({ key: 'auth_token' })
      return value || null
    } else {
      const cookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
      return cookie ? cookie.split('=')[1] : null
    }
  }

  async function login(email: string, password: string) {
    const response = await fetch(`${API_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }))
      throw new Error(error.message || 'Login failed')
    }

    const data = await response.json()

    // Store token based on platform
    if (Capacitor.isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.set({ key: 'auth_token', value: data.accessToken })
    } else {
      document.cookie = `token=${data.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=strict`
    }

    setUser(data.user)
    return data
  }

  async function register(data: { username: string; email: string; password: string }) {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Registration failed' }))
      throw new Error(error.message || 'Registration failed')
    }

    return response.json()
  }

  function logout() {
    if (Capacitor.isNativePlatform()) {
      const { Preferences } = require('@capacitor/preferences')
      Preferences.remove({ key: 'auth_token' })
    } else {
      document.cookie = 'token=; path=/; max-age=0'
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthGuard({
  children,
  requiredRole,
}: {
  children: React.ReactNode
  requiredRole?: 'admin' | 'agent'
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (loading) return

    if (!user) {
      setRedirecting(true)
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    if (requiredRole === 'admin') {
      const isAdmin = user.role === 'admin' || user.roles?.includes('admin')
      if (!isAdmin) {
        setRedirecting(true)
        router.replace('/login')
      }
    }
  }, [user, loading, requiredRole, router, pathname])

  if (loading || redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  if (requiredRole === 'admin') {
    const isAdmin = user.role === 'admin' || user.roles?.includes('admin')
    if (!isAdmin) return null
  }

  return <>{children}</>
}
