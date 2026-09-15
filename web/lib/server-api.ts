

export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '')
}



export function resolveApiImage(url: string): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const base = getApiBaseUrl()
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`
}