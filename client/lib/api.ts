import { getApiUrlAsync } from '@/lib/get-api-url'
import { Capacitor } from '@capacitor/core'

let cachedToken: string | null = null

export async function getCachedToken(): Promise<string | null> {
  if (cachedToken) return cachedToken
  if (Capacitor.isNativePlatform()) {
    const { Preferences } = await import('@capacitor/preferences')
    const { value } = await Preferences.get({ key: 'auth_token' })
    cachedToken = value || null
    return cachedToken
  } else {
    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
    cachedToken = cookie ? cookie.split('=')[1] : null
    return cachedToken
  }
}

export function clearCachedToken() {
  cachedToken = null
}

export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${await getApiUrlAsync()}${path}`
  const token = await getCachedToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      console.error(`[API] ❌ ${response.status} ${url} - ${error.message}`)
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  } catch (err) {
    console.error(`[API] ❌ Connection failed: ${url}`, err)
    throw err
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: any) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  patch: <T>(path: string, body: any) =>
    request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: 'DELETE',
    }),
}
