import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { ToastProvider } from '@/components/ui/toast-provider'
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
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#F97316',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} bg-background`}>
      <body className="font-sans antialiased">
        <ToastProvider />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
