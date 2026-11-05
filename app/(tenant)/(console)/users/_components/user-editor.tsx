'use client'

import { Save } from '@/components/icons'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { FormEvent } from 'react'
import { useState } from 'react'

import AvatarUploader from '@/components/ui/avatar-uploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { USER_ROLES, normalizeApiUserRole } from '@/constants/user-role'
import { ApiUserRole } from '@/features/users/api/users-api'
import { toast } from '@/lib/toast'

import { createUser, updateUser } from '../_api/user-api'
import { userSchema } from '../_model/user.schema'
import type { ApiUser } from '../_model/user.types'

const ROLE_OPTIONS: { value: ApiUserRole; label: string }[] = (
  [ApiUserRole.Admin, ApiUserRole.Trainer, ApiUserRole.Trainee] as const
).map((value) => ({ value, label: USER_ROLES[value] }))

export type UserEditorMode = 'create' | 'edit'

export interface UserEditorProps {
  mode: UserEditorMode
  /** Present when mode === 'edit' (fetched on the server page). */
  user?: ApiUser
}

type EditorForm = {
  firstName: string
  lastName: string
  email: string
  role: ApiUserRole
  phoneNumber: string
  gender: string
  avatar: string
  password: string
  confirmPassword: string
}

function formFromUser(user?: ApiUser): EditorForm {
  const rawRole = (Array.isArray(user?.role) ? user?.role[0] : user?.role) ?? null
  const role = normalizeApiUserRole(rawRole)
  return {
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    role: role ?? ApiUserRole.Trainee,
    phoneNumber: user?.phoneNumber ?? '',
    gender: user?.gender == null ? '' : String(user.gender),
    avatar: user?.avatar ?? '',
    password: '',
    confirmPassword: '',
  }
}

export default function UserEditor({ mode, user }: UserEditorProps) {
  const router = useRouter()

  const searchParams = useSearchParams()
  const urlRole = searchParams.get('role')
  const initialRole =
    urlRole != null
      ? (normalizeApiUserRole(urlRole) ?? undefined)
      : undefined

  const [form, setForm] = useState<EditorForm>(() => ({
    ...formFromUser(user),
    ...(initialRole ? { role: initialRole } : {}),
  }))
  const [saving, setSaving] = useState(false)

  const setField = <K extends keyof EditorForm>(key: K, value: EditorForm[K]) =>
    setForm((old) => ({ ...old, [key]: value }))

  const backHref = '/users'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsed = userSchema.safeParse({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      role: form.role,
      phoneNumber: form.phoneNumber.trim(),
      avatar: form.avatar.trim() || null,
      gender: form.gender === '' ? null : Number(form.gender),
      password: form.password || null,
      confirmPassword: form.confirmPassword || null,
    })

    if (!parsed.success) {
      toast.error('لطفاً اطلاعات را بررسی کنید.', {
        description: parsed.error.issues[0]?.message,
      })
      return
    }
    if (mode === 'create') {
      const entered = form.password
      if (!entered || entered.length < 8) {
        toast.error('رمز عبور اولیه باید حداقل ۸ کاراکتر باشد.')
        return
      }
      if (entered !== form.confirmPassword) {
        toast.error('رمز عبور و تکرار آن یکسان نیستند')
        return
      }
    }

    setSaving(true)
    const payload = {
      ...parsed.data,
      ...(mode === 'edit' && user ? { id: user.id } : {}),
    }
    try {
      if (mode === 'edit') await updateUser(payload)
      else await createUser(payload)
      toast.success(
        mode === 'edit' ? 'اطلاعات کاربر به‌روزرسانی شد' : 'کاربر جدید ایجاد شد',
      )
      router.push(backHref)
      router.refresh()
    } catch (error) {
      toast.error(
        mode === 'edit' ? 'ویرایش کاربر ناموفق بود' : 'ایجاد کاربر ناموفق بود',
        {
          description:
            error instanceof Error
              ? error.message
              : 'لطفاً اطلاعات را بررسی کنید.',
        },
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5" dir="rtl">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === 'edit' ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            اطلاعات را مطابق قرارداد سرویس کاربران وارد کنید.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link
            href={backHref}
            className="focus-visible:ring-ring inline-flex items-center rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2"
          >
            بازگشت به فهرست
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="نام *">
            <Input
              value={form.firstName}
              onChange={(e) => setField('firstName', e.target.value)}
              required
            />
          </Field>
          <Field label="نام خانوادگی *">
            <Input
              value={form.lastName}
              onChange={(e) => setField('lastName', e.target.value)}
              required
            />
          </Field>
          <Field label="شماره همراه (نام کاربری) *">
            <Input
              dir="ltr"
              inputMode="tel"
              maxLength={11}
              placeholder="09xxxxxxxxx"
              value={form.phoneNumber}
              onChange={(e) =>
                setField('phoneNumber', e.target.value.replace(/\D/g, ''))
              }
              required
            />
          </Field>
          <Field label="ایمیل *">
            <Input
              type="email"
              dir="ltr"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              required
            />
          </Field>
          <Field label="نقش در باشگاه *">
            <select
              className="border-input bg-background h-10 w-full rounded-lg border px-3 outline-none focus-visible:ring-[3px]"
              value={form.role}
              onChange={(e) =>
                setField('role', Number(e.target.value) as ApiUserRole)
              }
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="جنسیت">
            <select
              className="border-input bg-background h-10 w-full rounded-lg border px-3 outline-none focus-visible:ring-[3px]"
              value={form.gender}
              onChange={(e) => setField('gender', e.target.value)}
            >
              <option value="">انتخاب نشده</option>
              <option value="0">مرد</option>
              <option value="1">زن</option>
            </select>
          </Field>

          {mode === 'create' && (
            <>
              <Field label="رمز عبور اولیه *">
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  required
                />
              </Field>
              <Field label="تکرار رمز عبور *">
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => setField('confirmPassword', e.target.value)}
                  required
                />
              </Field>
            </>
          )}
        </div>

        <AvatarUploader
          value={form.avatar}
          onChange={(url) => setField('avatar', url)}
          disabled={saving}
        />

        <p className="text-muted-foreground leading-6 text-xs">
          نقش‌ها مطابق سرویس کاربران: Admin (مدیر باشگاه)، Trainer (مربی)، Trainee
          (شاگرد). در حالت ویرایش، رمز عبور از طریق بازنشانی اجباری در فهرست
          کاربران مدیریت می‌شود.
        </p>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={saving}>
            <Save className="size-4" />
            {saving
              ? 'در حال ذخیره…'
              : mode === 'edit'
                ? 'ذخیره تغییرات'
                : 'ایجاد کاربر'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            asChild
          >
            <Link href={backHref} className="inline-flex items-center">
              انصراف
            </Link>
          </Button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm">
      <span className="block">{label}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  )
}
