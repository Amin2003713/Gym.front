import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { fetchSite } from '@/features/platform/api'
import { fallbackSite } from '@/features/platform/fallback'

import { JsonLd } from './_components/json-ld'
import { SiteFooter } from './_components/site-footer'
import { SiteHeader } from './_components/site-header'

const siteBase = (site: typeof fallbackSite): string =>
  site.settings.canonicalBaseUrl?.replace(/\/$/, '') ||
  (site.baseDomain ? `https://${site.baseDomain}` : 'http://localhost:3000')

export async function generateMetadata(): Promise<Metadata> {
  const site = (await fetchSite()) ?? fallbackSite
  const { settings, baseDomain } = site
  const url = settings.canonicalBaseUrl?.replace(/\/$/, '') ||
    (baseDomain ? `https://${baseDomain}` : undefined)

  return {
    metadataBase: url ? new URL(url) : undefined,
    title: {
      default: settings.metaTitle || `${settings.brandName} | ${settings.tagline ?? ''}`,
      template: `%s | ${settings.brandName}`,
    },
    description: settings.metaDescription ?? undefined,
    keywords: settings.metaKeywords?.split(',').map((keyword) => keyword.trim()).filter(Boolean),
    alternates: { canonical: '/' },
    robots: {
      index: settings.allowIndexing,
      follow: settings.allowIndexing,
      googleBot: { index: settings.allowIndexing, follow: settings.allowIndexing },
    },
    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      siteName: settings.brandName,
      title: settings.metaTitle || settings.heroTitle,
      description: settings.metaDescription ?? undefined,
      url,
      images: settings.ogImageUrl ? [{ url: settings.ogImageUrl, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: settings.metaTitle || settings.heroTitle,
      description: settings.metaDescription ?? undefined,
      images: settings.ogImageUrl ? [settings.ogImageUrl] : undefined,
    },
    verification: {
      google: settings.googleSiteVerification ?? undefined,
      other: settings.bingSiteVerification
        ? { 'msvalidate.01': settings.bingSiteVerification }
        : undefined,
    },
    category: 'business',
  }
}

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The marketing site belongs to the bare domain only. A gym subdomain has its own app at `/`,
  // so rendering this layout there would leak the platform's homepage into the gym portal.
  const host = (await headers()).get('host')?.split(':')[0].toLowerCase() ?? ''
  const baseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN ?? '').split(':')[0].toLowerCase()

  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')
  const isPlatformHost = host === baseDomain || host === `www.${baseDomain}`

  if (baseDomain && host && !isLocalHost && !isPlatformHost) {
    notFound()
  }

  const site = (await fetchSite()) ?? fallbackSite
  const { settings } = site
  const base = siteBase(site)

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.brandName,
    url: base,
    email: settings.contactEmail ?? undefined,
    telephone: settings.contactPhone ?? undefined,
    sameAs: [settings.instagramUrl, settings.telegramUrl].filter(Boolean),
  }

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: settings.brandName,
    url: base,
    inLanguage: 'fa-IR',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${base}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <div className="bg-background text-foreground flex min-h-svh flex-col">
      <a
        href="#main"
        className="bg-foreground text-background sr-only rounded-md px-4 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:right-3 focus:z-50"
      >
        پرش به محتوا
      </a>

      <SiteHeader site={site} />

      <main id="main" className="flex-1">
        {children}
      </main>

      <SiteFooter site={site} />

      <JsonLd data={organization} />
      <JsonLd data={website} />
    </div>
  )
}
