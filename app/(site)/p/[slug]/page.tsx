import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ArrowLeft } from '@/components/icons'
import { fetchPage, fetchSite } from '@/features/platform/api'
import { fallbackSite } from '@/features/platform/fallback'

import { JsonLd } from '../../_components/json-ld'

type Params = { slug: string }

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await fetchPage(slug)

  if (!page) return { title: 'صفحه پیدا نشد', robots: { index: false, follow: false } }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription ?? page.summary ?? undefined,
    alternates: { canonical: `/p/${page.slug}` },
    openGraph: {
      type: 'article',
      title: page.metaTitle || page.title,
      description: page.metaDescription ?? page.summary ?? undefined,
      url: `/p/${page.slug}`,
    },
  }
}

export default async function CmsPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const page = await fetchPage(slug)

  if (!page) notFound()

  const site = (await fetchSite()) ?? fallbackSite
  const base = site.settings.canonicalBaseUrl?.replace(/\/$/, '') ||
    (site.baseDomain ? `https://${site.baseDomain}` : 'http://localhost:3000')

  const blocks = (page.body ?? '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'خانه', item: base },
      { '@type': 'ListItem', position: 2, name: page.title, item: `${base}/p/${page.slug}` },
    ],
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
      <nav aria-label="مسیر صفحه" className="text-muted-foreground flex items-center gap-2 text-xs">
        <Link href="/" className="hover:text-foreground transition-colors">
          خانه
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">{page.title}</span>
      </nav>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
        {page.title}
      </h1>

      {page.summary && (
        <p className="text-muted-foreground mt-4 text-base leading-8 sm:text-lg">{page.summary}</p>
      )}

      <div className="mt-8 grid gap-5">
        {blocks.length === 0 ? (
          <p className="text-muted-foreground text-sm">محتوای این صفحه در حال آماده‌سازی است.</p>
        ) : (
          blocks.map((block, index) =>
            block.startsWith('## ') ? (
              <h2 key={index} className="mt-4 text-xl font-extrabold tracking-tight">
                {block.slice(3)}
              </h2>
            ) : (
              <p key={index} className="text-muted-foreground text-sm leading-8 sm:text-base">
                {block}
              </p>
            ),
          )
        )}
      </div>

      <div className="border-border mt-12 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <p className="text-muted-foreground text-sm">
          سؤالی دارید؟ به {site.settings.contactEmail ?? 'پشتیبانی'} پیام بدهید.
        </p>

        <Link
          href="/start"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center gap-2 rounded-md px-5 text-sm font-bold transition-colors"
        >
          ساخت پورتال باشگاه
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <JsonLd data={breadcrumb} />
    </article>
  )
}
