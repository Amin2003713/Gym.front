'use client'

import { BadgeCheck, CreditCard, Sparkles } from '@/components/icons'
import { useCallback, useEffect, useState } from 'react'

import { checkout, listMySubscriptions, listProducts } from '@/app/(tenant)/_api/billing-api'
import {
  BILLING_PERIOD_LABELS,
  PRODUCT_KIND_LABELS,
  ProductFeature,
  SUBSCRIPTION_STATUS_LABELS,
  SubscriptionStatus,
  formatPrice,
  type BillingProduct,
  type MemberSubscription,
} from '@/app/(tenant)/_model/billing.types'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'

const FEATURE_LABELS: Array<{ flag: ProductFeature; label: string }> = [
  { flag: ProductFeature.WorkoutTracking, label: 'ثبت تمرین' },
  { flag: ProductFeature.ExerciseLibrary, label: 'کتابخانه حرکات' },
  { flag: ProductFeature.ProgressTracking, label: 'پیگیری پیشرفت' },
  { flag: ProductFeature.AdvancedStats, label: 'آمار پیشرفته' },
  { flag: ProductFeature.ProgressPhotos, label: 'عکس پیشرفت' },
  { flag: ProductFeature.PersonalizedPlans, label: 'برنامه اختصاصی' },
  { flag: ProductFeature.CoachFeedback, label: 'بازخورد مربی' },
]

/**
 * The member shop: what the gym/coach sells, what the member already owns, and one checkout button.
 * Money never leaves the server: the browser only follows the gateway URL the backend returns.
 */
export function MemberMembership() {
  const [products, setProducts] = useState<BillingProduct[]>([])
  const [subscriptions, setSubscriptions] = useState<MemberSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const [catalog, mine] = await Promise.all([listProducts(), listMySubscriptions()])

        if (cancelled) return

        setProducts(catalog)
        setSubscriptions(mine)
      } catch (error) {
        if (!cancelled)
          toast.error('دریافت محصولات ناموفق بود', {
            description: error instanceof Error ? error.message : undefined,
          })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [version])

  const reload = useCallback(() => {
    setLoading(true)
    setVersion((current) => current + 1)
  }, [])

  const buy = async (product: BillingProduct) => {
    setBuyingId(product.id)

    try {
      const result = await checkout(product.id)

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl
        return
      }

      toast.warning(result.message ?? 'خرید در انتظار پرداخت است.', {
        description: 'برای تکمیل، با مدیر باشگاه هماهنگ کنید.',
      })
      reload()
    } catch (error) {
      toast.error('شروع خرید ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBuyingId(null)
    }
  }

  const active = subscriptions.filter((item) => item.status === SubscriptionStatus.Active)
  const featured = active[0]

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">اشتراک من</h1>
        <p className="text-muted-foreground text-sm leading-6">
          پکیج‌های باشگاه یا مربی شما، با قیمت و امکانات خودشان.
        </p>
      </header>

      {featured && (
        <section className="border-primary/30 bg-primary/5 space-y-2 rounded-2xl border p-4">
          <p className="text-primary inline-flex items-center gap-1.5 text-xs font-bold">
            <BadgeCheck className="size-4" />
            اشتراک فعال
          </p>
          <p className="text-lg font-extrabold">{featured.productName}</p>
          <p className="text-muted-foreground text-xs">
            از {featured.startsOn}
            {featured.endsOn ? ` تا ${featured.endsOn}` : ' · بدون تاریخ انقضا'}
          </p>
        </section>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">در حال بارگذاری…</p>
      ) : products.length === 0 ? (
        <div className="bg-muted/40 rounded-2xl border border-dashed p-6 text-sm">
          <p className="font-semibold">هنوز محصولی برای فروش ثبت نشده است.</p>
          <p className="text-muted-foreground mt-1">
            باشگاه می‌تواند عضویت، پکیج مربیگری یا مشاوره را از بخش «مالی» اضافه کند.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {products.map((product) => {
            const owned = active.some((item) => item.billingProductId === product.id)

            return (
              <article key={product.id} className="bg-card flex flex-col gap-3 rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-muted-foreground text-xs">
                      {PRODUCT_KIND_LABELS[product.kind]} ·{' '}
                      {BILLING_PERIOD_LABELS[product.billingPeriod]}
                    </p>
                    <h2 className="mt-1 text-base font-extrabold">{product.name}</h2>
                  </div>
                  {owned && (
                    <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-[10px] font-bold">
                      فعال
                    </span>
                  )}
                </div>

                {product.description && (
                  <p className="text-muted-foreground text-xs leading-6">{product.description}</p>
                )}

                <p className="text-lg font-extrabold tabular-nums">
                  {formatPrice(product.price, product.currency)}
                </p>

                <ul className="text-muted-foreground flex flex-wrap gap-1.5 text-[10px]">
                  {FEATURE_LABELS.filter((item) => product.features & item.flag).map((item) => (
                    <li key={item.label} className="bg-muted rounded-full px-2 py-1">
                      {item.label}
                    </li>
                  ))}
                </ul>

                <p className="text-muted-foreground text-[11px]">
                  {product.durationDays > 0 ? `${product.durationDays} روز اعتبار` : 'بدون انقضا'}
                  {product.includedSessions ? ` · ${product.includedSessions} جلسه` : ''}
                  {product.trialDays > 0 ? ` · ${product.trialDays} روز آزمایشی` : ''}
                </p>

                <Button
                  className="mt-auto"
                  onClick={() => buy(product)}
                  disabled={owned || buyingId === product.id}
                >
                  {owned ? (
                    <>
                      <Sparkles className="size-4" />
                      فعال است
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-4" />
                      {buyingId === product.id ? 'در حال انتقال…' : 'خرید'}
                    </>
                  )}
                </Button>
              </article>
            )
          })}
        </div>
      )}

      {subscriptions.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold">تاریخچه خریدها</h2>
          <ul className="divide-y rounded-2xl border">
            {subscriptions.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 p-3 text-xs">
                <span className="font-semibold">{item.productName}</span>
                <span className="text-muted-foreground">
                  {SUBSCRIPTION_STATUS_LABELS[item.status]} · {formatPrice(item.amountPaid, item.currency)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
