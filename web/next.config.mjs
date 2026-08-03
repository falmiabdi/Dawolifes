/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development'

const nextConfig = {
  // Only use static export for production Capacitor builds — not in dev
  ...(isDev ? {} : { output: 'export' }),

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  trailingSlash: true,

  // Tell Turbopack the correct project root to avoid confusion with parent lockfiles
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig
