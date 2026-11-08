import type { Metadata } from 'next'
import Link from 'next/link'

import { Check, Sparkles } from '@/components/icons'
import { fetchSite } from '@/features/platform/api'
import { fallbackSite } from '@/features/platform/fallback'
import { formatToman } from '@/features/platform/format'

import { PricingCards } from '../_components/pricing-cards'

export const revalidate = 60

const title = 'پلن‌ها و قیمت‌ها'
const description =
  'قیمت اشتراک هم‌اوج برای باشگاه‌ها: پلن پایه، حرفه‌ای و سازمانی، ماهانه یا سالانه، با پرونده عضو، برنامه تمرینی، حضور و غیاب و گزارش درآمد.'

export async function generateMetadata(): Promise<Metadata> {
  const site = (await fetchSite()) ?? fallbackSite

  return {
    title,
    description,
    alternates: { canonical: '/pricing' },
    openGraph: {
      title: `${title} | ${site.settings.brandName}`,
      description,
      url: '/pricing',
    },
  }
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>
}) {
  const site = (await fetchSite()) ?? fallbackSite
  const { cycle: cycleParam } = await searchParams
  const cycle = cycleParam === 'yearly' ? 'yearly' : 'monthly'
  const plans = [...site.plans].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-4 pt-14 pb-8 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-muted-foreground text-xs font-bold">قیمت‌گذاری</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            پلنی که اندازه باشگاه شما باشد
          </h1>
          <p className="text-muted-foreground mt-5 text-base leading-8">
            همه پلن‌ها پورتال اختصاصی، پایگاه‌داده مستقل و دسترسی مدیر دارند. با ارتقا،
            محدودیت عضو و مربی بیشتر می‌شود و داده‌هایتان دست‌نخورده می‌ماند.
          </p>
        </div>

        <nav aria-label="دوره پرداخت" className="border-border mt-8 inline-flex rounded-lg border p-1">
          <Link
            href="/pricing?cycle=monthly"
            aria-current={cycle === 'monthly' ? 'page' : undefined}
            className={
              cycle === 'monthly'
                ? 'bg-foreground text-background rounded-md px-4 py-2 text-sm font-bold'
                : 'text-muted-foreground hover:text-foreground rounded-md px-4 py-2 text-sm font-semibold'
            }
          >
            ماهانه
          </Link>
          <Link
            href="/pricing?cycle=yearly"
            aria-current={cycle === 'yearly' ? 'page' : undefined}
            className={
              cycle === 'yearly'
                ? 'bg-foreground text-background rounded-md px-4 py-2 text-sm font-bold'
                : 'text-muted-foreground hover:text-foreground rounded-md px-4 py-2 text-sm font-semibold'
            }
          >
            سالانه
            <span className="bg-primary/20 text-primary ms-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
              ۲ ماه هدیه
            </span>
          </Link>
        </nav>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <PricingCards plans={plans} cycle={cycle} />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="border-border grid gap-8 rounded-2xl border p-6 sm:p-8 md:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-muted-foreground text-xs font-bold">مقایسه سریع</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">پرداخت سالانه چطور کار می‌کند؟</h2>
            <p className="text-muted-foreground mt-3 text-sm leading-7">
              با انتخاب سالانه، معادل ده ماه پرداخت می‌کنید و دو ماه هدیه می‌گیرید. صورتحساب
              یک‌جا صادر می‌شود و می‌توانید هر زمان برای ارتقا درخواست بدهید.
            </p>
          </div>

          <ul className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              'تغییر پلن در هر زمان',
              'نگه‌داشتن داده‌ها پس از ارتقا',
              'صورتحساب رسمی برای باشگاه',
              'پشتیبانی فارسی در روزهای کاری',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span className="leading-6">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <div className="border-border bg-card/50 rounded-2xl border p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-primary inline-flex items-center gap-2 text-xs font-bold">
                <Sparkles className="size-4" aria-hidden="true" />
                پلن سازمانی
              </p>
              <h2 className="mt-2 text-xl font-extrabold">مجموعه زنجیره‌ای دارید؟</h2>
              <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-7">
                برای چند شعبه، دسترسی API و قرارداد اختصاصی با ما صحبت کنید. مهاجرت داده‌ها هم
                انجام می‌شود.
              </p>
            </div>

            <a
              href={`mailto:${site.settings.contactEmail ?? 'hello@hamowj.ir'}`}
              className="border-input hover:bg-accent inline-flex h-11 items-center rounded-md border px-5 text-sm font-bold transition-colors"
            >
              گفت‌وگو با تیم
            </a>
          </div>

          <p className="text-muted-foreground mt-5 text-xs">
            قیمت پلن سازمانی:{' '}
            {formatToman(
              plans.find((plan) => plan.code === 'enterprise')?.monthlyPriceToman ?? 0,
            )}{' '}
            در ماه
          </p>
        </div>
      </section>
    </>
  )
}
