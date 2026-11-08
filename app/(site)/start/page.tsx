import type { Metadata } from 'next'

import { fetchSite } from '@/features/platform/api'
import { fallbackSite } from '@/features/platform/fallback'

import { StartForm } from './_components/start-form'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'ساخت پورتال باشگاه',
  description:
    'پلن را انتخاب کنید، نام باشگاه و نشانی دلخواه را وارد کنید و پورتال اختصاصی خود را بسازید.',
  alternates: { canonical: '/start' },
  robots: { index: false, follow: true },
}

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; cycle?: string }>
}) {
  const site = (await fetchSite()) ?? fallbackSite
  const { plan, cycle } = await searchParams
  const plans = [...site.plans].filter((item) => item.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  const selected = plans.find((item) => item.code === plan) ?? plans.find((item) => item.isPopular) ?? plans[0]

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="text-muted-foreground text-xs font-bold">پرداخت و ساخت پورتال</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            پورتال اختصاصی باشگاهتان را بسازید
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-7 sm:text-base">
            پس از ثبت، پورتال و پایگاه‌داده مستقل شما ساخته می‌شود و اطلاعات ورود مدیر به ایمیل
            شما ارسال می‌شود. صورتحساب پلن انتخاب‌شده نیز برای تسویه صادر می‌شود.
          </p>

          <StartForm
            plans={plans}
            baseDomain={site.baseDomain}
            initialPlanCode={selected?.code}
            initialCycle={cycle === 'yearly' ? 1 : 0}
          />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border-border bg-card rounded-2xl border p-6">
            <p className="text-xs font-bold">در این پلن چه چیزی می‌گیرید؟</p>
            <p className="mt-2 text-2xl font-extrabold">{selected?.name ?? 'پلن دلخواه'}</p>
            <p className="text-muted-foreground mt-1 text-sm">{selected?.description ?? ''}</p>

            <ul className="mt-5 grid gap-2.5 text-sm">
              {(selected?.features ?? []).map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="bg-primary mt-2 size-1.5 shrink-0 rounded-full" aria-hidden="true" />
                  <span className="leading-6">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="border-border mt-6 grid gap-2 border-t pt-4 text-xs leading-6">
              <p className="text-muted-foreground">
                پرداخت آنلاین درگاه پلتفرم در حال فعال‌سازی است؛ سفارش شما ثبت و برای تسویه به
                پشتیبانی ارجاع می‌شود.
              </p>
              <p className="text-muted-foreground">
                برای تغییر پلن یا فاکتور رسمی، به {site.settings.contactEmail ?? 'پشتیبانی'} پیام بدهید.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
