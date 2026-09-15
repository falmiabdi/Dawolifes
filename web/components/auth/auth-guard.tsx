'use client'

import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import { getApiUrlAsync, patchFetchForCapacitor } from '@/lib/get-api-url'
import { getGoogleRedirectResult, signInWithGoogle } from '@/lib/firebase-auth'

patchFetchForCapacitor()


function authStorage() {
  try {
    if (Capacitor.isNativePlatform()) return window.localStorage
  } catch {}
  return window.sessionStorage
}

function readCachedUser(): SessionUser | null {
  try {
    const cached = authStorage().getItem('auth_user')
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

function writeCachedUser(user: SessionUser | null) {
  try {
    if (user) authStorage().setItem('auth_user', JSON.stringify(user))
    else authStorage().removeItem('auth_user')
  } catch {}
}

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
  phone?: string | null
  onboardingComplete?: boolean
}

export type UserRole = 'buyer' | 'seller' | 'agent' | 'owner' | 'admin'



export function mapUserRole(role?: string): UserRole {
  if (role === 'admin') return 'admin'
  if (role === 'owner') return 'owner'
  if (role === 'agent') return 'seller'
  return 'buyer'
}

interface AuthContextType {
  user: SessionUser | null
  loading: boolean
  isLoggedIn: boolean
  role: UserRole
  isVerified: boolean
  login: (email: string, password: string) => Promise<any>
  googleSignIn: (role?: string) => Promise<any>
  register: (data: { username: string; email: string; password: string }) => Promise<any>
  registerBuyer: (data: { name: string; email: string; phone: string; password: string; profilePhoto?: string }) => Promise<any>
  verifyOtp: (email: string, otp: string) => Promise<any>
  refreshUser: () => Promise<void>
  logout: () => void
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isLoggedIn: false,
  role: 'buyer',
  isVerified: false,
  login: async () => {},
  googleSignIn: async () => {},
  register: async () => {},
  registerBuyer: async () => {},
  verifyOtp: async () => {},
  refreshUser: async () => {},
  logout: () => {},
  getToken: async () => null,
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  
  
  
  const redirectPathRef = useRef<string>('/')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { pathname, search } = window.location
      const params = new URLSearchParams(search)
      const redirect = params.get('redirect')
      if (redirect && redirect.startsWith('/')) {
        redirectPathRef.current = redirect
      } else if (
        pathname !== '/auth/login' &&
        pathname !== '/auth/signup'
      ) {
        redirectPathRef.current = pathname + search
      } else {
        redirectPathRef.current = '/'
      }
    }

    const cached = readCachedUser()
    if (cached) {
      setUser(cached)
      setLoading(false)
    }
    fetchAuthSession()
    resolveRedirectSignIn()
    
  }, [])

  



  async function resolveRedirectSignIn() {
    try {
      const cred = await getGoogleRedirectResult()
      if (!cred) return
      const loc = window.location
      history.replaceState({}, '', loc.pathname + loc.search)
      const response = await fetch(`${await getApiUrlAsync()}/api/auth/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken: cred.idToken }),
      })
      if (!response.ok) return
      const data = await response.json()
      if (data.accessToken) await persistToken(data.accessToken)
      if (data.user) setUserAndCache(data.user)

      
      
      const target =
        data.user?.role === 'admin'
          ? '/admin'
          : data.user?.role === 'agent' || data.user?.role === 'owner'
            ? data.user?.onboardingComplete
              ? '/agent'
              : '/agent/onboarding'
            : redirectPathRef.current || '/'
      router.replace(target)
    } catch {
      
    }
  }

  function setUserAndCache(u: SessionUser | null) {
    setUser(u)
    writeCachedUser(u)
  }

  async function fetchAuthSession() {
    try {
      const token = await getToken()
      if (!token) {
        setLoading(false)
        return
      }

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)

      try {
        const response = await fetch(`${await getApiUrlAsync()}/api/auth/session`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          signal: controller.signal,
        })

        if (response.ok) {
          const data = await response.json()
          if (data?.session?.user) {
            setUserAndCache(data.session.user)
          }
        }
      } finally {
        clearTimeout(timer)
      }
    } catch {
      
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
    const response = await fetch(`${await getApiUrlAsync()}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }))
      throw new Error(error.message || 'Login failed')
    }

    const data = await response.json()

    await persistToken(data.accessToken)
    setUserAndCache(data.user)
    
    
    if (data.user?.role === 'admin') {
      router.replace('/admin')
    }
    return data
  }

  





  async function googleSignIn(role?: string) {
    const cred = await signInWithGoogle()
    if (!cred) return null

    const response = await fetch(`${await getApiUrlAsync()}/api/auth/firebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ idToken: cred.idToken, role }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Google sign in failed' }))
      throw new Error(error.message || 'Google sign in failed')
    }

    const data = await response.json()

    if (data.requiresEmailVerification) {
      return data
    }

    if (data.accessToken) {
      await persistToken(data.accessToken)
    }
    if (data.user) {
      setUserAndCache(data.user)
    }
    return data
  }

  async function persistToken(accessToken: string) {
    if (Capacitor.isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.set({ key: 'auth_token', value: accessToken })
    } else {
      document.cookie = `token=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
    }
  }

  async function registerBuyer(data: { name: string; email: string; phone: string; password: string; profilePhoto?: string }) {
    const response = await fetch(`${await getApiUrlAsync()}/api/auth/register-buyer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Registration failed' }))
      throw new Error(error.message || 'Registration failed')
    }

    return response.json()
  }

  async function verifyOtp(email: string, otp: string) {
    const response = await fetch(`${await getApiUrlAsync()}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, otp }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Verification failed' }))
      throw new Error(error.message || 'Verification failed')
    }

    const data = await response.json()
    if (data.accessToken) {
      await persistToken(data.accessToken)
    }
    if (data.user) {
      setUserAndCache(data.user)
    }
    return data
  }

  async function register(data: { username: string; email: string; password: string }) {
    const response = await fetch(`${await getApiUrlAsync()}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Registration failed' }))
      throw new Error(error.message || 'Registration failed')
    }

    return response.json()
  }

  async function refreshUser() {
    try {
      const token = await getToken()
      if (!token) return
      const response = await fetch(`${await getApiUrlAsync()}/api/auth/session`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        if (data?.session?.user) {
          setUserAndCache(data.session.user)
        }
      }
    } catch {
      
    }
  }

  function logout() {
    
    if (Capacitor.isNativePlatform()) {
      try {
        const { Preferences } = require('@capacitor/preferences')
        Preferences.remove({ key: 'auth_token' })
      } catch {}
    }
    document.cookie = 'token=; path=/; max-age=0'
    
    
    try {
      authStorage().removeItem('auth_user')
      window.sessionStorage.removeItem('auth_user')
      window.localStorage.removeItem('auth_user')
    } catch {}
    setUserAndCache(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoggedIn: !!user,
        role: mapUserRole(user?.role),
        isVerified: !!user,
        login,
        googleSignIn,
        register,
        registerBuyer,
        verifyOtp,
        refreshUser,
        logout,
        getToken,
      }}
    >
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

    const needsRedirect =
      !user ||
      (requiredRole === 'admin' &&
        !(user.role === 'admin' || user.roles?.includes('admin')))

    if (needsRedirect) {
      setRedirecting(true)
      if (requiredRole === 'admin') {
        router.replace('/auth/login')
      } else {
        router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`)
      }
    } else if (redirecting) {
      
      
      
      setRedirecting(false)
    }
  }, [user, loading, requiredRole, router, pathname, redirecting])

  if (loading || redirecting) {
    return (
      <div className="min-h-screen">
        <div className="h-1 w-full bg-primary/10">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
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
