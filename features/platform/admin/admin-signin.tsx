'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { HamOwjBrand } from '@/components/branding/hamowj-mark'
import { ArrowLeft, ShieldCheck } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { adminLogin, readAdminToken } from '@/features/platform/api'

export function AdminSignin() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (readAdminToken()) router.replace('/admin')
  }, [router])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setBusy(true)

    try {
      await adminLogin(userName.trim(), password)
      router.replace('/admin')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ورود انجام نشد.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-6 flex items-center gap-3">
        <span className="bg-foreground text-background flex size-11 items-center justify-center rounded-xl">
          <HamOwjBrand className="size-7" />
        </span>
        <div>
          <p className="text-lg font-extrabold">پنل پلتفرم</p>
          <p className="text-muted-foreground text-xs">مدیریت سایت، پلن‌ها و پورتال‌ها</p>
        </div>
      </div>

      <form onSubmit={submit} className="border-border bg-card grid gap-5 rounded-2xl border p-6">
        <div className="grid gap-2">
          <Label htmlFor="userName">نام کاربری یا ایمیل مدیر</Label>
          <Input
            id="userName"
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
            dir="ltr"
            className="text-start"
            autoComplete="username"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">گذرواژه</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <p role="alert" className="bg-destructive/10 text-destructive rounded-md p-3 text-xs">
            {error}
          </p>
        )}

        <Button type="submit" isLoading={busy} loadingText="در حال ورود…" className="font-bold">
          ورود به پنل
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Button>

        <p className="text-muted-foreground flex items-start gap-2 text-[11px] leading-6">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          این حساب به هیچ باشگاهی وابسته نیست و فقط از دامنه اصلی کار می‌کند.
        </p>
      </form>

      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground mt-6 text-center text-xs underline underline-offset-4"
      >
        بازگشت به سایت
      </Link>
    </div>
  )
}
