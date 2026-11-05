'use client'

import { CreditCard, Plus, RefreshCw, ShieldCheck, Trash2 } from '@/components/icons'
import { useCallback, useEffect, useState } from 'react'

import {
  applyPlan,
  archiveProduct,
  createProduct,
  getEntitlements,
  getGatewaySettings,
  listPayments,
  listProducts,
  saveGatewaySettings,
  updateProduct,
} from '@/app/(tenant)/_api/billing-api'
import {
  BILLING_PERIOD_LABELS,
  BillingPeriod,
  FEATURE_LABELS,
  PAYMENT_STATUS_LABELS,
  PLAN_LABELS,
  PRODUCT_KIND_LABELS,
  ProductFeature,
  ProductKind,
  TenantPlan,
  formatPrice,
  type BillingProduct,
  type BillingProductInput,
  type Entitlements,
  type GatewaySettings,
  type Payment,
} from '@/app/(tenant)/_model/billing.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/lib/toast'

const fa = (value: number | undefined | null): string =>
  (value ?? 0).toLocaleString('fa-IR')

const FEATURE_FLAGS: Array<{ flag: ProductFeature; label: string }> = [
  { flag: ProductFeature.WorkoutTracking, label: 'ثبت تمرین' },
  { flag: ProductFeature.ExerciseLibrary, label: 'کتابخانه حرکات' },
  { flag: ProductFeature.ProgressTracking, label: 'پیگیری پیشرفت' },
  { flag: ProductFeature.AdvancedStats, label: 'آمار پیشرفته' },
  { flag: ProductFeature.ProgressPhotos, label: 'عکس پیشرفت' },
  { flag: ProductFeature.PersonalizedPlans, label: 'برنامه اختصاصی' },
  { flag: ProductFeature.CoachFeedback, label: 'بازخورد مربی' },
]

const emptyProduct = {
  name: '',
  description: '',
  kind: ProductKind.CoachingPackage,
  price: 0,
  billingPeriod: BillingPeriod.Monthly,
  durationDays: 30,
  includedSessions: 0,
  capacity: 0,
  trialDays: 0,
  features:
    ProductFeature.WorkoutTracking |
    ProductFeature.ExerciseLibrary |
    ProductFeature.ProgressTracking,
  isPublished: true,
}

/**
 * The gym/coach commercial console: what is sold, who bought what, the tenant's own merchant account,
 * and the HamOwj plan with its seat limits. Two money flows, one screen, never mixed.
 */
export function BillingConsole() {
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null)
  const [products, setProducts] = useState<BillingProduct[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [gateway, setGateway] = useState<GatewaySettings | null>(null)
  const [form, setForm] = useState(emptyProduct)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [merchantId, setMerchantId] = useState('')
  const [callbackUrl, setCallbackUrl] = useState('')
  const [isSandbox, setIsSandbox] = useState(true)
  const [isEnabled, setIsEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const [usage, catalog, ledger, settings] = await Promise.all([
          getEntitlements(),
          listProducts(),
          listPayments(1, 25),
          getGatewaySettings(),
        ])

        if (cancelled) return

        setEntitlements(usage)
        setProducts(catalog)
        setPayments(ledger)
        setGateway(settings)
        setCallbackUrl(settings.callbackUrl ?? '')
        setIsSandbox(settings.isSandbox)
        setIsEnabled(settings.isEnabled)
      } catch (error) {
        if (!cancelled)
          toast.error('دریافت اطلاعات مالی ناموفق بود', {
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

  const run = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true)

    try {
      await action()
      toast.success(message)
      reload()
    } catch (error) {
      toast.error('عملیات ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  const toPayload = (): BillingProductInput => ({
    name: form.name.trim(),
    description: form.description || null,
    kind: form.kind,
    price: form.price,
    currency: 'IRT',
    billingPeriod: form.billingPeriod,
    durationDays: form.durationDays,
    includedSessions: form.includedSessions > 0 ? form.includedSessions : null,
    capacity: form.capacity > 0 ? form.capacity : null,
    trialDays: form.trialDays,
    features: form.features,
    commissionPercent: null,
    isPublished: form.isPublished,
    sortOrder: 0,
  })

  const saveProduct = () =>
    run(
      () =>
        editingId
          ? updateProduct(editingId, toPayload())
          : createProduct(toPayload()),
      editingId ? 'محصول به‌روزرسانی شد' : 'محصول ثبت شد',
    ).then(() => {
      setForm(emptyProduct)
      setEditingId(null)
    })

  const editProduct = (product: BillingProduct) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      description: product.description ?? '',
      kind: product.kind,
      price: product.price,
      billingPeriod: product.billingPeriod,
      durationDays: product.durationDays,
      includedSessions: product.includedSessions ?? 0,
      capacity: product.capacity ?? 0,
      trialDays: product.trialDays,
      features: product.features,
      isPublished: product.isPublished,
    })
  }

  const toggleFeature = (flag: ProductFeature) =>
    setForm((current) => ({
      ...current,
      features:
        current.features & flag
          ? current.features & ~flag
          : current.features | flag,
    }))

  if (loading) {
    return <p className="text-muted-foreground p-4 text-sm">در حال بارگذاری…</p>
  }

  return (
    <div className="space-y-5 p-1">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            مالی و اشتراک
          </h1>
          <p className="text-muted-foreground text-sm leading-6">
            محصولات، پرداخت‌ها، درگاه اختصاصی و پلن هم‌اوج.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
          <RefreshCw className="size-4" />
          به‌روزرسانی
        </Button>
      </header>

      {entitlements && (
        <section className="bg-card space-y-3 rounded-2xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-xs">پلن فعلی هم‌اوج</p>
              <p className="text-lg font-extrabold">
                {PLAN_LABELS[entitlements.plan]}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  TenantPlan.Starter,
                  TenantPlan.Pro,
                  TenantPlan.Enterprise,
                ] as TenantPlan[]
              ).map((plan) => (
                <button
                  key={plan}
                  type="button"
                  disabled={busy || plan === entitlements.plan}
                  onClick={() =>
                    run(() => applyPlan(plan), 'پلن به‌روزرسانی شد')
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                    plan === entitlements.plan
                      ? 'bg-primary text-primary-foreground border-primary'
                      : ''
                  }`}
                >
                  {PLAN_LABELS[plan]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {entitlements.limits.map((limit) => (
              <div key={limit.key} className="bg-muted/40 rounded-xl p-3">
                <p className="text-muted-foreground text-xs">{limit.label}</p>
                <p className="mt-1 text-sm font-bold tabular-nums">
                  {limit.used === null ? '—' : fa(limit.used)}
                  {limit.limit !== null
                    ? ` از ${fa(limit.limit)}`
                    : ' · نامحدود'}
                </p>
                {limit.isExceeded && (
                  <p className="text-destructive text-[11px]">
                    سقف پلن پر شده است
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {entitlements.features.map((feature) => (
              <span
                key={feature}
                className="bg-primary/10 text-primary rounded-full px-2 py-1 text-[10px] font-semibold"
              >
                {FEATURE_LABELS[feature] ?? feature}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="bg-card space-y-3 rounded-2xl border p-4">
          <h2 className="text-sm font-bold">
            {editingId ? 'ویرایش محصول' : 'محصول جدید'}
          </h2>

          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              placeholder="نام محصول"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
            <label className="text-xs">
              <span className="text-muted-foreground">نوع</span>
              <select
                className="border-input mt-1 h-9 w-full rounded-md border px-2 text-xs"
                value={form.kind}
                onChange={(event) =>
                  setForm({
                    ...form,
                    kind: Number(event.target.value) as ProductKind,
                  })
                }
              >
                {Object.entries(PRODUCT_KIND_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <NumberField
              label="قیمت (تومان)"
              value={form.price}
              onChange={(price) => setForm({ ...form, price })}
            />
            <label className="text-xs">
              <span className="text-muted-foreground">دوره پرداخت</span>
              <select
                className="border-input mt-1 h-9 w-full rounded-md border px-2 text-xs"
                value={form.billingPeriod}
                onChange={(event) =>
                  setForm({
                    ...form,
                    billingPeriod: Number(event.target.value) as BillingPeriod,
                  })
                }
              >
                {Object.entries(BILLING_PERIOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <NumberField
              label="مدت اعتبار (روز، ۰ = بدون انقضا)"
              value={form.durationDays}
              onChange={(durationDays) => setForm({ ...form, durationDays })}
            />
            <NumberField
              label="جلسات شامل (۰ = ندارد)"
              value={form.includedSessions}
              onChange={(includedSessions) =>
                setForm({ ...form, includedSessions })
              }
            />
            <NumberField
              label="ظرفیت (۰ = نامحدود)"
              value={form.capacity}
              onChange={(capacity) => setForm({ ...form, capacity })}
            />
            <NumberField
              label="روزهای آزمایشی"
              value={form.trialDays}
              onChange={(trialDays) => setForm({ ...form, trialDays })}
            />
          </div>

          <Input
            placeholder="توضیح کوتاه"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />

          <div className="flex flex-wrap gap-1.5">
            {FEATURE_FLAGS.map((item) => (
              <button
                key={item.flag}
                type="button"
                aria-pressed={(form.features & item.flag) !== 0}
                onClick={() => toggleFeature(item.flag)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  form.features & item.flag
                    ? 'bg-primary text-primary-foreground border-primary'
                    : ''
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs">
              <Switch
                checked={form.isPublished}
                onCheckedChange={(isPublished) =>
                  setForm({ ...form, isPublished })
                }
                aria-label="نمایش در فروشگاه"
              />
              نمایش در فروشگاه
            </label>

            <div className="flex gap-2">
              {editingId && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingId(null)
                    setForm(emptyProduct)
                  }}
                >
                  انصراف
                </Button>
              )}
              <Button
                onClick={saveProduct}
                disabled={busy || form.name.trim().length < 2}
              >
                <Plus className="size-4" />
                {editingId ? 'ذخیره تغییرات' : 'افزودن محصول'}
              </Button>
            </div>
          </div>
        </article>

        <article className="bg-card space-y-3 rounded-2xl border p-4">
          <h2 className="text-sm font-bold">درگاه پرداخت اختصاصی</h2>
          <p className="text-muted-foreground text-xs leading-6">
            پرداخت‌ها مستقیم به حساب پذیرنده خودتان می‌رود. شناسه پذیرنده فقط در
            سرور ذخیره می‌شود.
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              placeholder={
                gateway?.maskedMerchantId ?? 'شناسه پذیرنده زرین‌پال'
              }
              value={merchantId}
              onChange={(event) => setMerchantId(event.target.value)}
            />
            <Input
              placeholder="آدرس بازگشت (Callback URL)"
              value={callbackUrl}
              onChange={(event) => setCallbackUrl(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-4 text-xs">
            <label className="flex items-center gap-2">
              <Switch
                checked={isSandbox}
                onCheckedChange={setIsSandbox}
                aria-label="حالت آزمایشی"
              />
              حالت آزمایشی (Sandbox)
            </label>
            <label className="flex items-center gap-2">
              <Switch
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
                aria-label="فعال"
              />
              درگاه فعال باشد
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() =>
                run(
                  () =>
                    saveGatewaySettings({
                      provider: 0,
                      merchantId: merchantId || null,
                      isSandbox,
                      isEnabled,
                      callbackUrl: callbackUrl || null,
                    }),
                  'تنظیمات درگاه ذخیره شد',
                ).then(() => setMerchantId(''))
              }
              disabled={busy}
            >
              <ShieldCheck className="size-4" />
              ذخیره درگاه
            </Button>
            {gateway?.isEnabled && (
              <span className="text-muted-foreground text-xs">
                وضعیت: فعال {gateway.isSandbox ? '(آزمایشی)' : ''}
              </span>
            )}
          </div>

          {gateway?.lastError && (
            <p className="text-destructive text-xs">{gateway.lastError}</p>
          )}
        </article>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">محصولات</h2>

        {products.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            هنوز محصولی ثبت نشده است.
          </p>
        ) : (
          <ul className="divide-y rounded-2xl border">
            {products.map((product) => (
              <li
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {product.name}
                    {!product.isPublished && (
                      <span className="text-muted-foreground mr-2 text-[10px]">
                        (مخفی)
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {PRODUCT_KIND_LABELS[product.kind]} ·{' '}
                    {formatPrice(product.price, product.currency)} ·{' '}
                    {product.activeSubscribers > 0
                      ? `${fa(product.activeSubscribers)} مشترک فعال`
                      : 'بدون مشترک'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editProduct(product)}
                  >
                    ویرایش
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      run(() => archiveProduct(product.id), 'محصول حذف شد')
                    }
                  >
                    <Trash2 className="size-4" />
                    حذف
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">آخرین پرداخت‌ها</h2>

        {payments.length === 0 ? (
          <p className="text-muted-foreground text-xs">تراکنشی ثبت نشده است.</p>
        ) : (
          <ul className="divide-y rounded-2xl border">
            {payments.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3 text-xs"
              >
                <span className="inline-flex items-center gap-2">
                  <CreditCard className="text-muted-foreground size-4" />
                  {payment.description ?? 'پرداخت'}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {formatPrice(payment.amount, payment.currency)} ·{' '}
                  {PAYMENT_STATUS_LABELS[payment.status]}
                  {payment.referenceId ? ` · ${payment.referenceId}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="text-xs">
      <span className="text-muted-foreground">{label}</span>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1"
      />
    </label>
  )
}
