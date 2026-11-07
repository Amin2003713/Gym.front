import type { NextConfig } from 'next'

/**
 * Static files (build assets under `/_next/static`) can be served from a CDN or MinIO bucket
 * without changing any component: set NEXT_PUBLIC_CDN_URL to the origin that mirrors the build.
 * Media uploaded through the API is already served from MinIO in WebP form.
 */
const cdnBase = process.env.NEXT_PUBLIC_CDN_URL?.trim().replace(/\/$/, '')

/** Public images/fonts keep their name across deploys; a month is a safe middle ground. */
const PUBLIC_ASSET = 'public, max-age=2592000, stale-while-revalidate=86400'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,

  // Build assets are fetched from the CDN when one is configured; the app still works without it.
  ...(cdnBase ? { assetPrefix: cdnBase } : {}),

  images: {
    // AVIF first (smallest), WebP fallback, then the original — chosen per browser via Accept.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [360, 414, 480, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Exercise media and avatars come from the API/MinIO host, which can change per tenant.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Turns barrel imports (one giant index per package) into per-icon/per-module imports, so a
    // page that uses five icons does not ship the whole icon set.
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'date-fns-jalali',
      'recharts',
      'react-day-picker',
      '@tanstack/react-table',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
    ],
  },

  async headers() {
    return [
      {
        // Next already marks hashed /_next/static files immutable in production; only public
        // files with stable names need an explicit policy here.
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: PUBLIC_ASSET }],
      },
      {
        // Static images/svg shipped from /public.
        source: '/:path*.(svg|png|jpg|jpeg|webp|avif|ico|woff2)',
        headers: [{ key: 'Cache-Control', value: PUBLIC_ASSET }],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ]
  },
}

export default nextConfig
