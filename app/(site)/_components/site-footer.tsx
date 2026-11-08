import Link from 'next/link'

import type { SitePayload } from '@/features/platform/types'

export function SiteFooter({ site }: { site: SitePayload }) {
  const { settings } = site
  const pages = site.pages.filter((page) => page.showInFooter)

  return (
    <footer className="border-border/70 mt-20 border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <p className="text-lg font-extrabold">{settings.brandName}</p>
          <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-7">
            {settings.footerNote ?? settings.tagline ?? ''}
          </p>

          {settings.contactEmail && (
            <a
              href={`mailto:${settings.contactEmail}`}
              className="text-foreground mt-4 inline-block text-sm font-semibold underline underline-offset-4"
              dir="ltr"
            >
              {settings.contactEmail}
            </a>
          )}
        </div>

        <nav aria-label="صفحه‌های سایت" className="grid content-start gap-3">
          <p className="text-muted-foreground text-xs font-bold">صفحه‌ها</p>
          <Link href="/pricing" className="hover:text-primary text-sm transition-colors">
            قیمت‌ها و پلن‌ها
          </Link>
          <Link href="/start" className="hover:text-primary text-sm transition-colors">
            ساخت پورتال
          </Link>
          {pages.map((page) => (
            <Link
              key={page.slug}
              href={`/p/${page.slug}`}
              className="hover:text-primary text-sm transition-colors"
            >
              {page.title}
            </Link>
          ))}
        </nav>

        <div className="grid content-start gap-3">
          <p className="text-muted-foreground text-xs font-bold">دسترسی</p>
          <Link href="/signin" className="hover:text-primary text-sm transition-colors">
            ورود به پورتال باشگاه
          </Link>
          <Link href="/signup" className="hover:text-primary text-sm transition-colors">
            ثبت‌نام باشگاه
          </Link>
          <Link href="/admin" className="text-muted-foreground hover:text-primary text-sm transition-colors">
            پنل مدیریت پلتفرم
          </Link>
        </div>
      </div>

      <div className="border-border/70 border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs sm:px-6">
          <span>
            © {new Date().getFullYear()} {settings.brandName} — همه حقوق محفوظ است.
          </span>
          <span>{settings.tagline ?? ''}</span>
        </div>
      </div>
    </footer>
  )
}
