const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${path}`
  console.log(`[API] ${options.method || 'GET'} ${url}`)

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      console.error(`[API] ❌ ${response.status} ${url} - ${error.message}`)
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    console.log(`[API] ✅ ${response.status} ${url}`)
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

export default API_URL
