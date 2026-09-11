// Server-only helpers. Do NOT import get-api-url.ts here — it is a
// "use client" module and cannot be used in Server Components / generateMetadata.
export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '')
}

// Resolves an API-relative image path (e.g. /uploads/abc.jpg) into a full URL
// so crawlers (Facebook/Telegram) can actually reach the image.
export function resolveApiImage(url: string): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const base = getApiBaseUrl()
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`
}