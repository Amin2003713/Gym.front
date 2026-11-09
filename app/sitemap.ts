import type { MetadataRoute } from 'next'

import { fetchSite } from '@/features/platform/api'
import { fallbackSite } from '@/features/platform/fallback'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = (await fetchSite()) ?? fallbackSite

  if (!site.settings.allowIndexing) {
    return []
  }

  const base =
    site.settings.canonicalBaseUrl?.replace(/\/$/, '') ||
    (site.baseDomain ? `https://${site.baseDomain}` : 'http://localhost:3000')

  const now = new Date()

  const pages: MetadataRoute.Sitemap = (site.pages ?? []).map((page) => ({
    url: `${base}/p/${page.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${base}/pricing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...pages,
  ]
}
