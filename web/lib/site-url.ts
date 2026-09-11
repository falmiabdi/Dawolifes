// Server-safe site URL used for canonical links, share links and og tags.
// The published frontend lives on the custom domain, NOT the Vercel preview,
// so shares always point at the real page.
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://dawolife.jebugeneraltrading.com').replace(/\/+$/, '')
}