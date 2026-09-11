/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',

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
