import { getApiUrl } from '@/lib/get-api-url'

export async function serverFetch(path: string, options: RequestInit = {}) {
  const url = `${getApiUrl()}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response
}

export async function serverFetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await serverFetch(path, options)
  return response.json()
}
