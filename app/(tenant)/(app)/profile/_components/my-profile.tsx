'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { listMyPlans } from '@/app/(tenant)/(console)/plans/_api/plan-api'
import type { PlanSummary } from '@/app/(tenant)/(console)/plans/_model/plan.types'
import { getUserInfo, updateUser } from '@/app/(tenant)/(console)/users/_api/user-api'
import { ClipboardList, LoaderCircle, Save } from '@/components/icons'
import AvatarUploader from '@/components/ui/avatar-uploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { USER_ROLES, normalizeApiUserRole } from '@/constants/user-role'
import { toast } from '@/lib/toast'

interface ProfileForm {
  firstName: string
  lastName: string
  email: string
  gender: string
  avatar: string
  imageUrl?: string | null
}

const EMPTY: ProfileForm = {
  firstName: '',
  lastName: '',
  email: '',
  gender: '',
  avatar: '',
}

/** The signed-in user's own profile; the phone number is the login username and cannot change here. */
export function MyProfile() {
  const [form, setForm] = useState<ProfileForm>(EMPTY)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [role, setRole] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [plans, setPlans] = useState<PlanSummary[]>([])
  const [plansLoading, setPlansLoading] = useState(true)

  const setField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((old) => ({ ...old, [key]: value }))

  useEffect(() => {
    let active = true

    void getUserInfo()
      .then((user) => {
        if (!active) return

        const rawRole = Array.isArray(user.role) ? user.role[0] : user.role
        const normalized = normalizeApiUserRole(rawRole)

        setForm({
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          email: user.email ?? '',
          gender: user.gender == null ? '' : String(user.gender),
          avatar: user.avatar ?? (user as { imageUrl?: string | null }).imageUrl ?? '',
        })
        setPhoneNumber(user.phoneNumber ?? '')
        setRole(normalized ?? null)
      })
      .catch(() => {
        if (active) toast.error('اطلاعات پروفایل دریافت نشد.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  // Owned plans are part of the member's profile: a self-started plan previously had nowhere
  // to appear for a member who never opened the staff console.
  useEffect(() => {
    let active = true

    void listMyPlans(1, 30)
      .then((rows) => {
        if (active) setPlans(Array.isArray(rows) ? rows : [])
      })
      .catch(() => {
        if (active) setPlans([])
      })
      .finally(() => {
        if (active) setPlansLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const save = async () => {
    if (form.firstName.trim().length < 2 || form.lastName.trim().length < 2) {
      toast.error('نام و نام خانوادگی را کامل کنید.')
      return
    }

    setSaving(true)

    try {
      const current = await getUserInfo()

      await updateUser({
        id: current.id,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phoneNumber,
        avatar: form.avatar.trim() || null,
        gender: form.gender === '' ? null : Number(form.gender),
        role: role ?? current.role,
      })

      toast.success('پروفایل به‌روزرسانی شد')
    } catch (error) {
      toast.error('ذخیره پروفایل ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <LoaderCircle className="text-primary size-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="text-xl font-extrabold tracking-tight">پروفایل من</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          تصویر، نام و اطلاعات تماس شما در همه‌ی بخش‌های هم‌اوج نمایش داده می‌شود.
        </p>
      </header>

      <section className="bg-card space-y-4 rounded-2xl border p-4">
        <AvatarUploader
          value={form.avatar}
          onChange={(url) => setField('avatar', url)}
          disabled={saving}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="block">نام</span>
            <Input
              className="mt-1"
              value={form.firstName}
              onChange={(event) => setField('firstName', event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="block">نام خانوادگی</span>
            <Input
              className="mt-1"
              value={form.lastName}
              onChange={(event) => setField('lastName', event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="block">شماره همراه (نام کاربری)</span>
            <Input className="mt-1" dir="ltr" value={phoneNumber} readOnly disabled />
          </label>
          <label className="text-sm">
            <span className="block">ایمیل</span>
            <Input
              className="mt-1"
              type="email"
              dir="ltr"
              value={form.email}
              onChange={(event) => setField('email', event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="block">جنسیت</span>
            <select
              className="border-input bg-background mt-1 h-10 w-full rounded-lg border px-3 outline-none focus-visible:ring-[3px]"
              value={form.gender}
              onChange={(event) => setField('gender', event.target.value)}
            >
              <option value="">انتخاب نشده</option>
              <option value="0">مرد</option>
              <option value="1">زن</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="block">نقش</span>
            <Input
              className="mt-1"
              value={role == null ? '—' : USER_ROLES[role as keyof typeof USER_ROLES]}
              readOnly
              disabled
            />
          </label>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {saving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {saving ? 'در حال ذخیره…' : 'ذخیره پروفایل'}
          </Button>
        </div>
      </section>

      <section className="bg-card space-y-3 rounded-2xl border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-1.5 text-sm font-extrabold">
              <ClipboardList className="text-primary size-4" />
              برنامه‌های من
            </h2>
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              برنامه‌هایی که به نام شما ساخته شده‌اند؛ شامل برنامه‌ای که مربی داده و برنامهٔ شخصی خودتان.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link href="/plan">صفحهٔ برنامه</Link>
          </Button>
        </div>

        {plansLoading ? (
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <LoaderCircle className="size-3.5 animate-spin" /> در حال دریافت برنامه‌ها…
          </p>
        ) : plans.length === 0 ? (
          <p className="bg-muted/40 text-muted-foreground rounded-lg p-3 text-xs leading-6">
            هنوز برنامه‌ای به نام شما ثبت نشده است. از مربی خود بخواهید برنامه‌ای تخصیص دهد.
          </p>
        ) : (
          <ul className="divide-border divide-y">
            {plans.map((plan) => (
              <li key={plan.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{plan.title}</span>
                  <span className="text-muted-foreground mt-0.5 block text-[11px]">
                    {plan.totalSessions
                      ? `${plan.totalSessions.toLocaleString('fa-IR')} جلسه`
                      : plan.durationWeeks
                        ? `${plan.durationWeeks.toLocaleString('fa-IR')} هفته`
                        : 'بدون مدت'}
                    {' · '}نسخهٔ {plan.currentVersion?.toLocaleString('fa-IR') ?? '۱'}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {plan.isArchived && (
                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-bold">
                      بایگانی
                    </span>
                  )}
                  <Link
                    href="/plan"
                    className="text-primary text-xs font-bold underline underline-offset-4"
                  >
                    مشاهده
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
