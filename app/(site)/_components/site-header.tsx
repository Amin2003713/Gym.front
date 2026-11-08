import Link from 'next/link'

import { HamOwjBrand } from '@/components/branding/hamowj-mark'
import { ArrowLeft } from '@/components/icons'
import type { SitePayload } from '@/features/platform/types'

const navItems = [
  { href: '/#features', label: 'امکانات' },
  { href: '/#how', label: 'چطور کار می‌کند' },
  { href: '/pricing', label: 'قیمت‌ها' },
  { href: '/#faq', label: 'پرسش‌ها' },
]

export function SiteHeader({ site }: { site: SitePayload }) {
  return (
    <header className="border-border/70 bg-background/85 supports-[backdrop-filter]:bg-background/65 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={site.settings.brandName}>
          <span className="bg-foreground text-background flex size-9 items-center justify-center rounded-lg">
            <HamOwjBrand className="size-6" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-base font-extrabold">{site.settings.brandName}</span>
            <span className="text-muted-foreground mt-1 hidden text-[10px] font-medium sm:block">
              {site.settings.tagline ?? 'مدیریت باشگاه'}
            </span>
          </span>
        </Link>

        <nav aria-label="ناوبری اصلی" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md px-3 py-2 text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <Link
            href="/signin"
            className="text-muted-foreground hover:text-foreground hidden rounded-md px-3 py-2 text-sm font-semibold transition-colors sm:block"
          >
            ورود به پورتال
          </Link>

          <Link
            href={site.settings.primaryCtaHref || '/start'}
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-bold transition-colors focus-visible:ring-[3px] focus-visible:ring-offset-2"
          >
            شروع رایگان
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* The mobile menu is a details element: it works without JavaScript and keeps this file a server component. */}
      <details className="group border-border/70 border-t md:hidden">
        <summary className="text-muted-foreground flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          منوی سایت
          <span aria-hidden="true" className="group-open:rotate-180 transition-transform">⌄</span>
        </summary>
        <nav aria-label="ناوبری موبایل" className="bg-background grid gap-1 px-4 pb-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:bg-muted rounded-md px-3 py-2 text-sm font-medium"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/signin" className="hover:bg-muted rounded-md px-3 py-2 text-sm font-medium">
            ورود به پورتال
          </Link>
        </nav>
      </details>
    </header>
  )
}
