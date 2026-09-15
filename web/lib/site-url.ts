


export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://dawolife.jebugeneraltrading.com').replace(/\/+$/, '')
}