import type { MetadataRoute } from 'next'

import { fetchSite } from '@/features/platform/api'
import { fallbackSite } from '@/features/platform/fallback'

export const revalidate = 3600

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = (await fetchSite()) ?? fallbackSite

  const base =
    site.settings.canonicalBaseUrl?.replace(/\/$/, '') ||
    (site.baseDomain ? `https://${site.baseDomain}` : 'http://localhost:3000')

  const privatePaths = [
    '/admin',
    '/admin/',
    '/api/',
    '/signin',
    '/signup',
    '/verify-account',
    '/forget-password',
    '/reset-password',
    '/dashboard/',
    '/settings/',
  ]

  if (!site.settings.allowIndexing) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: privatePaths,
      },
    ],

    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
