import Link from 'next/link'

import {
  ArrowLeft,
  Clock,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Users,
} from '@/components/icons'
import { fetchSite } from '@/features/platform/api'
import { fallbackSite } from '@/features/platform/fallback'
import { formatNumber, formatToman } from '@/features/platform/format'
import type { SitePayload } from '@/features/platform/types'

import { FaqList } from './_components/faq-list'
import { FeatureIcon } from './_components/feature-icon'
import { JsonLd } from './_components/json-ld'
import { PricingCards } from './_components/pricing-cards'

export const revalidate = 60

const steps = [
  {
    number: '۰۱',
    title: 'پلن را انتخاب کنید',
    body: 'پلن مناسب اندازه باشگاهتان را ببینید؛ همه پلن‌ها با پرونده عضو و برنامه تمرینی شروع می‌شوند.',
  },
  {
    number: '۰۲',
    title: 'پورتال را بسازید',
    body: 'نام باشگاه و نشانی دلخواه را وارد کنید. پورتال و پایگاه‌داده اختصاصی شما همان لحظه ساخته می‌شود.',
  },
  {
    number: '۰۳',
    title: 'اعضا را دعوت کنید',
    body: 'اطلاعات ورود مدیر صادر می‌شود؛ از همان روز اول عضو ثبت کنید، اشتراک بفروشید و برنامه بدهید.',
  },
]

const trustItems = [
  { icon: ShieldCheck, title: 'داده اختصاصی هر باشگاه', body: 'پایگاه‌داده مستقل، بدون اشتراک بین باشگاه‌ها' },
  { icon: Users, title: 'فارسی و راست‌به‌چپ', body: 'طراحی‌شده برای مدیران و مربی‌های ایرانی' },
  { icon: Clock, title: 'شروع در چند دقیقه', body: 'بدون نصب، بدون آموزش طولانی' },
  { icon: CreditCard, title: 'پرداخت شفاف', body: 'صورتحساب ماهانه یا سالانه، بدون هزینه پنهان' },
]

export default async function HomePage() {
  const site: SitePayload = (await fetchSite()) ?? fallbackSite
  const { settings } = site
  const features = site.features.filter((feature) => feature.isActive)
  const faqs = site.faqs.filter((faq) => faq.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  const plans = [...site.plans].sort((a, b) => a.sortOrder - b.sortOrder)
  const base = settings.canonicalBaseUrl?.replace(/\/$/, '') ||
    (site.baseDomain ? `https://${site.baseDomain}` : 'http://localhost:3000')
  const cheapest = plans.reduce(
    (min, plan) => (plan.monthlyPriceToman > 0 && plan.monthlyPriceToman < min ? plan.monthlyPriceToman : min),
    Number.POSITIVE_INFINITY,
  )

  const software = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: settings.brandName,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: base,
    description: settings.metaDescription ?? settings.heroSubtitle ?? undefined,
    inLanguage: 'fa-IR',
    featureList: features.map((feature) => feature.title),
    offers: plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      price: plan.monthlyPriceToman,
      priceCurrency: 'IRR',
      priceValidUntil: undefined,
      availability: plan.isActive ? 'https://schema.org/InStock' : 'https://schema.org/Discontinued',
      url: `${base}/start?plan=${plan.code}`,
    })),
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="bg-primary/10 pointer-events-none absolute -top-40 -left-32 size-[28rem] rounded-full blur-3xl"
        />

        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <p className="border-border bg-card/70 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold">
              <span className="bg-primary size-1.5 rounded-full" aria-hidden="true" />
              {settings.heroEyebrow}
            </p>

            <h1 className="mt-6 text-4xl leading-[1.25] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]">
              {settings.heroTitle}
              {settings.heroHighlight && (
                <>
                  <br />
                  <span className="relative inline-block">
                    <span className="relative z-10">{settings.heroHighlight}</span>
                    <span
                      aria-hidden="true"
                      className="bg-primary/35 absolute inset-x-0 bottom-1 z-0 h-3 -rotate-[0.6deg] rounded-sm"
                    />
                  </span>
                </>
              )}
            </h1>

            <p className="text-muted-foreground mt-6 max-w-xl text-base leading-8 sm:text-lg">
              {settings.heroSubtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={settings.primaryCtaHref || '/start'}
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-12 items-center gap-2 rounded-md px-6 text-sm font-bold transition-colors focus-visible:ring-[3px] focus-visible:ring-offset-2"
              >
                {settings.primaryCtaLabel}
                <ArrowLeft className="size-4" aria-hidden="true" />
              </Link>

              {settings.secondaryCtaLabel && settings.secondaryCtaHref && (
                <Link
                  href={settings.secondaryCtaHref}
                  className="border-input hover:bg-accent focus-visible:ring-ring inline-flex h-12 items-center rounded-md border px-6 text-sm font-bold transition-colors focus-visible:ring-[3px] focus-visible:ring-offset-2"
                >
                  {settings.secondaryCtaLabel}
                </Link>
              )}
            </div>

            {settings.proof && (
              <p className="text-muted-foreground mt-6 flex items-center gap-2 text-xs leading-6">
                <ShieldCheck className="text-primary size-4 shrink-0" aria-hidden="true" />
                {settings.proof}
              </p>
            )}
          </div>

          {/* Illustrative product panel, built from real UI tokens rather than a fake screenshot. */}
          <div className="relative">
            <div className="border-border bg-card shadow-elevated rounded-2xl border p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-primary size-2.5 rounded-full" aria-hidden="true" />
                  <span className="text-xs font-bold">پنل مدیریت باشگاه</span>
                </div>
                <span className="text-muted-foreground border-border rounded-full border px-2 py-0.5 text-[10px]">
                  نمای نمونه
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: 'عضو فعال', value: '۱۲۸' },
                  { label: 'تمدید این ماه', value: '۲۴' },
                  { label: 'درآمد ماه', value: '۴۸٫۲ م' },
                ].map((item) => (
                  <div key={item.label} className="bg-muted/50 rounded-lg p-3">
                    <p className="text-muted-foreground text-[10px]">{item.label}</p>
                    <p className="mt-1 text-lg font-extrabold">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-muted/30 mt-3 rounded-lg p-3">
                <div className="text-muted-foreground flex items-center justify-between text-[10px]">
                  <span>درآمد ۶ ماه گذشته</span>
                  <span className="text-success font-bold">+۱۸٪</span>
                </div>
                <svg viewBox="0 0 260 70" role="img" aria-label="نمودار نمونه درآمد" className="mt-2 h-16 w-full">
                  <g fill="var(--chart-1)" opacity="0.85">
                    {[28, 36, 31, 44, 40, 56].map((height, index) => (
                      <rect
                        key={index}
                        x={index * 42 + 6}
                        y={64 - height}
                        width="26"
                        height={height}
                        rx="4"
                      />
                    ))}
                  </g>
                </svg>
              </div>

              <div className="mt-3 grid gap-2">
                {[
                  { name: 'سارا محمدی', plan: 'اشتراک حرفه‌ای', status: 'فعال' },
                  { name: 'امیر رضایی', plan: 'برنامه ۳ روزه', status: 'تمدید نزدیک' },
                  { name: 'نگار کریمی', plan: 'اشتراک پایه', status: 'فعال' },
                ].map((member) => (
                  <div
                    key={member.name}
                    className="border-border/70 flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-bold">{member.name}</p>
                      <p className="text-muted-foreground text-[10px]">{member.plan}</p>
                    </div>
                    <span
                      className={
                        member.status === 'فعال'
                          ? 'bg-success/10 text-success rounded-full px-2 py-0.5 text-[10px] font-bold'
                          : 'bg-warning/10 text-warning rounded-full px-2 py-0.5 text-[10px] font-bold'
                      }
                    >
                      {member.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- trust */}
      <section aria-label="مزیت‌های کلیدی" className="border-border/70 border-y">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {trustItems.map((item) => (
            <div key={item.title} className="flex gap-3">
              <item.icon className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold">{item.title}</p>
                <p className="text-muted-foreground mt-1 text-xs leading-5">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ features */}
      <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-muted-foreground text-xs font-bold">امکانات</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            هر کاری که پشت میز باشگاه انجام می‌شود، در یک پنل
          </h2>
          <p className="text-muted-foreground mt-4 text-sm leading-7 sm:text-base">
            از ثبت عضو تا گزارش درآمد؛ بدون دفتر کاغذی، بدون فایل‌های پراکنده و بدون کار تکراری.
          </p>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <article key={feature.id} className="bg-card/60 p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <span className="border-border text-primary flex size-10 items-center justify-center rounded-lg border">
                  <FeatureIcon name={feature.icon} className="size-5" />
                </span>
                <span className="text-muted-foreground/60 text-xs font-bold tabular-nums">
                  {formatNumber(index + 1).padStart(2, '۰')}
                </span>
              </div>
              <h3 className="mt-4 text-base font-extrabold">{feature.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-7">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- how */}
      <section id="how" className="bg-muted/30 scroll-mt-20 border-y">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-muted-foreground text-xs font-bold">شروع سریع</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              از تصمیم تا اولین عضو، سه قدم
            </h2>
          </div>

          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.number} className="border-border bg-background rounded-2xl border p-6">
                <span className="text-primary text-3xl font-extrabold tabular-nums">{step.number}</span>
                <h3 className="mt-3 text-base font-extrabold">{step.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-7">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------- pricing */}
      <section id="pricing" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-muted-foreground text-xs font-bold">پلن‌ها</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              قیمت شفاف، بدون هزینه پنهان
            </h2>
            <p className="text-muted-foreground mt-4 text-sm leading-7">
              {cheapest === Number.POSITIVE_INFINITY
                ? 'پلن مناسب باشگاهتان را ببینید.'
                : `شروع از ${formatToman(cheapest)} در ماه؛ هر زمان می‌توانید ارتقا دهید.`}
            </p>
          </div>

          <Link
            href="/pricing"
            className="text-foreground hover:text-primary inline-flex items-center gap-1.5 text-sm font-bold underline underline-offset-4"
          >
            مقایسه کامل پلن‌ها
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-10">
          <PricingCards plans={site.plans} compact />
        </div>
      </section>

      {/* ----------------------------------------------------------------- faq */}
      <section id="faq" className="mx-auto w-full max-w-4xl scroll-mt-20 px-4 pb-16 sm:px-6 lg:pb-24">
        <div className="mb-8 text-center">
          <p className="text-muted-foreground text-xs font-bold">پرسش‌های متداول</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">چیزهایی که قبل از شروع می‌پرسند</h2>
        </div>

        <FaqList faqs={site.faqs} />
      </section>

      {/* ----------------------------------------------------------------- cta */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="bg-foreground text-background relative overflow-hidden rounded-3xl px-6 py-12 sm:px-10">
          <div
            aria-hidden="true"
            className="bg-primary/30 absolute -top-24 -left-20 size-64 rounded-full blur-3xl"
          />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-primary inline-flex items-center gap-2 text-xs font-bold">
                <Sparkles className="size-4" aria-hidden="true" />
                آماده شروع؟
              </p>
              <h2 className="mt-3 max-w-xl text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
                پورتال باشگاهتان را بسازید و امروز اولین عضو را ثبت کنید.
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/start"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center gap-2 rounded-md px-5 text-sm font-bold transition-colors"
              >
                ساخت پورتال
                <ArrowLeft className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/signup"
                className="border-background/25 hover:bg-background/10 inline-flex h-11 items-center rounded-md border px-5 text-sm font-bold transition-colors"
              >
                ثبت‌نام با فرم کامل
              </Link>
            </div>
          </div>
        </div>
      </section>

      <JsonLd data={software} />
      {faqs.length > 0 && <JsonLd data={faqSchema} />}
    </>
  )
}
