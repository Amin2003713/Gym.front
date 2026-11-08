'use client'

import Link from 'next/link'
import { useState } from 'react'

import { ArrowLeft, Check, ShieldCheck } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { checkout } from '@/features/platform/api'
import { formatNumber, formatToman, slugify } from '@/features/platform/format'
import type { CheckoutResponse, PlatformPlan } from '@/features/platform/types'

type Props = {
  plans: PlatformPlan[]
  baseDomain: string
  initialPlanCode?: string
  initialCycle: number
}

type FormState = {
  planCode: string
  cycle: number
  gymName: string
  slug: string
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
  password: string
  accepted: boolean
}

export function StartForm({ plans, baseDomain, initialPlanCode, initialCycle = 0 }: Props) {
  const [form, setForm] = useState<FormState>({
    planCode: initialPlanCode ?? plans[0]?.code ?? '',
    cycle: initialCycle,
    gymName: '',
    slug: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    accepted: false,
  })

  const [slugTouched, setSlugTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CheckoutResponse | null>(null)

  const plan = plans.find((item) => item.code === form.planCode) ?? plans[0]

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const onGymNameChange = (value: string) => {
    setForm((current) => ({
      ...current,
      gymName: value,
      slug: slugTouched ? current.slug : slugify(value),
    }))
  }

  const validate = (): string | null => {
    if (!plan) return 'پلن انتخاب نشده است.'
    if (form.gymName.trim().length < 2) return 'نام باشگاه را کامل وارد کنید.'
    if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(form.slug))
      return 'نشانی پورتال باید ۳ تا ۶۳ نویسه شامل حروف کوچک انگلیسی، رقم و خط تیره باشد.'
    if (!form.firstName.trim() || !form.lastName.trim()) return 'نام و نام خانوادگی مدیر را وارد کنید.'
    if (!/^[0-9+\-\s]{8,20}$/.test(form.phoneNumber.trim())) return 'شماره همراه معتبر وارد کنید.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'ایمیل معتبر وارد کنید.'
    if (form.password.length < 8) return 'گذرواژه باید حداقل ۸ نویسه باشد.'
    if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password))
      return 'گذرواژه باید شامل حرف بزرگ و کوچک انگلیسی، رقم و نماد باشد.'
    if (!form.accepted) return 'برای ادامه، قوانین استفاده را بپذیرید.'
    return null
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)

    try {
      const response = await checkout({
        planCode: form.planCode,
        gymName: form.gymName.trim(),
        slug: form.slug.trim().toLowerCase(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim(),
        password: form.password,
        billingCycle: form.cycle,
      })

      setResult(response)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ساخت پورتال انجام نشد.')
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <div className="border-success/30 bg-success/5 mt-8 rounded-2xl border p-6">
        <p className="text-success inline-flex items-center gap-2 text-sm font-extrabold">
          <Check className="size-5" aria-hidden="true" />
          {result.message ?? 'پورتال شما ساخته شد.'}
        </p>

        <div className="mt-4 grid gap-2 text-sm">
          <p className="text-muted-foreground">
            شماره سفارش: <bdi dir="ltr" className="text-foreground font-bold">{result.orderId}</bdi>
          </p>
          <p className="text-muted-foreground">
            مبلغ صورتحساب: <span className="text-foreground font-bold">{formatToman(result.amountToman)}</span>
          </p>
          <p className="text-muted-foreground">
            وضعیت: <span className="text-foreground font-bold">در انتظار تسویه</span>
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {result.portalUrl && (
            <a
              href={result.portalUrl}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center gap-2 rounded-md px-5 text-sm font-bold transition-colors"
            >
              ورود به پورتال
              <ArrowLeft className="size-4" aria-hidden="true" />
            </a>
          )}
          <Link
            href="/"
            className="border-input hover:bg-accent inline-flex h-11 items-center rounded-md border px-5 text-sm font-bold transition-colors"
          >
            بازگشت به سایت
          </Link>
        </div>

        <p className="text-muted-foreground mt-4 text-xs leading-6">
          اطلاعات ورود مدیر به ایمیل شما ارسال شد. برای تسویه صورتحساب و فعال‌سازی کامل پلن،
          با پشتیبانی تماس بگیرید.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 grid gap-6">
      <fieldset>
        <legend className="text-sm font-bold">۱. پلن و دوره پرداخت</legend>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {plans.map((item) => (
            <label
              key={item.code}
              className={
                form.planCode === item.code
                  ? 'border-primary bg-primary/5 cursor-pointer rounded-xl border-2 p-3'
                  : 'border-border hover:border-primary/40 cursor-pointer rounded-xl border p-3'
              }
            >
              <input
                type="radio"
                name="planCode"
                value={item.code}
                checked={form.planCode === item.code}
                onChange={() => update('planCode', item.code)}
                className="sr-only"
              />
              <span className="block text-sm font-extrabold">{item.name}</span>
              <span className="text-muted-foreground mt-1 block text-[11px]">
                {formatToman(item.monthlyPriceToman)} / ماه
              </span>
            </label>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          {[
            { value: 0, label: 'ماهانه' },
            { value: 1, label: 'سالانه (۲ ماه هدیه)' },
          ].map((option) => (
            <label
              key={option.value}
              className={
                form.cycle === option.value
                  ? 'bg-foreground text-background cursor-pointer rounded-md px-3 py-2 text-xs font-bold'
                  : 'border-border text-muted-foreground cursor-pointer rounded-md border px-3 py-2 text-xs font-semibold'
              }
            >
              <input
                type="radio"
                name="cycle"
                value={option.value}
                checked={form.cycle === option.value}
                onChange={() => update('cycle', option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>

        {plan && (
          <p className="text-muted-foreground mt-2 text-xs">
            مبلغ صورتحساب:{' '}
            <span className="text-foreground font-bold">
              {formatToman(form.cycle === 1 ? plan.yearlyPriceToman : plan.monthlyPriceToman)}
            </span>
          </p>
        )}
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="text-sm font-bold">۲. مشخصات باشگاه</legend>

        <div className="grid gap-2">
          <Label htmlFor="gymName">نام باشگاه یا گروه ورزشی</Label>
          <Input
            id="gymName"
            value={form.gymName}
            onChange={(event) => onGymNameChange(event.target.value)}
            placeholder="مثلاً باشگاه اوج"
            autoComplete="organization"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="slug">نشانی پورتال</Label>
          <div className="flex items-center gap-2">
            <Input
              id="slug"
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true)
                update('slug', slugify(event.target.value))
              }}
              placeholder="eoj-gym"
              dir="ltr"
              className="text-start"
              required
            />
            <span className="text-muted-foreground shrink-0 text-xs" dir="ltr">
              .{baseDomain || 'hamowj.ir'}
            </span>
          </div>
          <p className="text-muted-foreground text-xs">
            فقط حروف کوچک انگلیسی، رقم و خط تیره. بعداً قابل تغییر نیست.
          </p>
        </div>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="text-sm font-bold">۳. حساب مدیر</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="firstName">نام</Label>
            <Input
              id="firstName"
              value={form.firstName}
              onChange={(event) => update('firstName', event.target.value)}
              autoComplete="given-name"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lastName">نام خانوادگی</Label>
            <Input
              id="lastName"
              value={form.lastName}
              onChange={(event) => update('lastName', event.target.value)}
              autoComplete="family-name"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phoneNumber">شماره همراه</Label>
            <Input
              id="phoneNumber"
              value={form.phoneNumber}
              onChange={(event) => update('phoneNumber', event.target.value)}
              inputMode="tel"
              dir="ltr"
              className="text-start"
              autoComplete="tel"
              placeholder="09120000000"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">ایمیل</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              dir="ltr"
              className="text-start"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">گذرواژه مدیر</Label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(event) => update('password', event.target.value)}
            autoComplete="new-password"
            required
          />
          <p className="text-muted-foreground text-xs leading-6">
            حداقل ۸ نویسه، شامل حرف بزرگ و کوچک انگلیسی، رقم و نماد.
          </p>
        </div>
      </fieldset>

      <label className="text-muted-foreground flex items-start gap-2 text-xs leading-6">
        <input
          type="checkbox"
          checked={form.accepted}
          onChange={(event) => update('accepted', event.target.checked)}
          className="accent-primary mt-1 size-4"
          required
        />
        <span>
          قوانین استفاده و سیاست حریم خصوصی را خوانده‌ام و می‌پذیرم.
        </span>
      </label>

      {error && (
        <p role="alert" aria-live="assertive" className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" isLoading={busy} loadingText="در حال ساخت پورتال…" className="h-11 px-6 font-bold">
          ثبت و ساخت پورتال
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Button>

        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
          <ShieldCheck className="size-4" aria-hidden="true" />
          داده شما در پایگاه‌داده اختصاصی باشگاه ذخیره می‌شود
        </span>
      </div>

      <p className="text-muted-foreground text-xs">
        تعداد نویسه نشانی:{' '}
        <span className="text-foreground font-bold">{formatNumber(form.slug.length)}</span>
      </p>
    </form>
  )
}
