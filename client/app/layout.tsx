import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { ToastProvider } from '@/components/ui/toast-provider'
import { AuthProvider } from '@/components/auth/auth-guard'
import { SmoothScroll } from '@/components/smooth-scroll'
import { CapacitorInit } from '@/components/capacitor-init'
import { AnalyticsOnWeb } from '@/components/analytics-on-web'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DawoLife — Ethiopia\'s Digital Real Estate Marketplace',
  description:
    'Find homes for sale and rent across Ethiopia. Browse verified listings in Oromia, Addis Ababa, Shaggar and beyond on DawoLife.',
  generator: 'v0.app',
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#F97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} bg-background`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-sans antialiased overflow-x-hidden">
        <ToastProvider />
        <AuthProvider>
          <CapacitorInit />
          <SmoothScroll>{children}</SmoothScroll>
        </AuthProvider>
        <AnalyticsOnWeb />
      </body>
    </html>
  )
}
