'use client'

import { Analytics } from '@vercel/analytics/next'
import { Capacitor } from '@capacitor/core'

export function AnalyticsOnWeb() {
  if (process.env.NODE_ENV !== 'production') return null
  if (Capacitor.isNativePlatform()) return null
  return <Analytics />
}
