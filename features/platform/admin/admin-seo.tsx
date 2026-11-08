'use client'

import { useCallback, useEffect, useState } from 'react'

import { AlertTriangle, CheckCircle2, RefreshCw, Search, XCircle } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { PlatformAuthError, platformAdmin } from '@/features/platform/api'
import { formatDateTime } from '@/features/platform/format'
import type { SeoAudit, SeoCheck } from '@/features/platform/types'
import { cn } from '@/lib/utils'

import { Notice, Panel } from './admin-ui'

const statusMeta = {
  pass: { label: 'درست', icon: CheckCircle2, className: 'text-success', border: 'border-success/30 bg-success/5' },
  warning: { label: 'بهبود بده', icon: AlertTriangle, className: 'text-warning', border: 'border-warning/30 bg-warning/5' },
  fail: { label: 'ناقص', icon: XCircle, className: 'text-destructive', border: 'border-destructive/30 bg-destructive/5' },
} as const

export function AdminSeo({ onAuthError }: { onAuthError: () => void }) {
  const [audit, setAudit] = useState<SeoAudit | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setBusy(true)
    setError(null)

    try {
      setAudit(await platformAdmin.seoAudit())
    } catch (cause) {
      if (cause instanceof PlatformAuthError) {
        onAuthError()
        return
      }

      setError(cause instanceof Error ? cause.message : 'بررسی سئو انجام نشد.')
    } finally {
      setBusy(false)
    }
  }, [onAuthError])

  useEffect(() => {
    let cancelled = false

    platformAdmin
      .seoAudit()
      .then((result) => {
        if (!cancelled) setAudit(result)
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        if (cause instanceof PlatformAuthError) return onAuthError()
        setError(cause instanceof Error ? cause.message : 'بررسی سئو انجام نشد.')
      })
      .finally(() => {
        if (!cancelled) setBusy(false)
      })

    return () => {
      cancelled = true
    }
  }, [onAuthError])

  const counts = {
    pass: audit?.checks.filter((check) => check.status === 'pass').length ?? 0,
    warning: audit?.checks.filter((check) => check.status === 'warning').length ?? 0,
    fail: audit?.checks.filter((check) => check.status === 'fail').length ?? 0,
  }

  return (
    <div className="grid gap-4">
      {error && <Notice tone="danger">{error}</Notice>}

      <Panel
        title="سلامت سئوی سایت"
        description="این بررسی بر اساس همان محتوایی انجام می‌شود که ربات گوگل می‌بیند: عنوان، توضیح متا، داده ساختاریافته، نقشه سایت و صفحه‌های واقعی."
        actions={
          <Button size="sm" variant="outline" isLoading={busy} onClick={() => void load()}>
            <RefreshCw className="size-3.5" aria-hidden="true" />
            بررسی دوباره
          </Button>
        }
      >
        {!audit ? (
          <div className="bg-muted h-48 animate-pulse rounded-lg" />
        ) : (
          <div className="grid items-center gap-6 md:grid-cols-[190px_1fr]">
            <div className="mx-auto grid size-40 place-items-center rounded-full p-3" style={{ background: `conic-gradient(var(--primary) ${audit.score * 3.6}deg, var(--muted) 0deg)` }}>
              <div className="bg-card grid size-full place-items-center rounded-full text-center">
                <span className="text-3xl font-extrabold tabular-nums">{audit.score}</span>
                <span className="text-muted-foreground -mt-8 text-[10px]">از ۱۰۰</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold">
                {audit.score >= 85
                  ? 'پایه سئو کامل است؛ روی محتوای صفحه‌ها تمرکز کنید.'
                  : audit.score >= 60
                    ? 'پایه خوب است، اما چند مورد مهم جا افتاده.'
                    : 'چند مورد پایه‌ای باید همین امروز درست شود.'}
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'درست', value: counts.pass, className: 'text-success' },
                  { label: 'بهبود', value: counts.warning, className: 'text-warning' },
                  { label: 'ناقص', value: counts.fail, className: 'text-destructive' },
                ].map((item) => (
                  <div key={item.label} className="border-border rounded-lg border p-2">
                    <p className={cn('text-lg font-extrabold', item.className)}>{item.value}</p>
                    <p className="text-muted-foreground text-[10px]">{item.label}</p>
                  </div>
                ))}
              </div>

              <p className="text-muted-foreground mt-3 text-[11px]">
                آخرین بررسی: {formatDateTime(audit.checkedAtUtc)}
              </p>
            </div>
          </div>
        )}
      </Panel>

      <Panel
        title="فهرست بررسی‌ها"
        description="موارد «ناقص» بیشترین اثر را دارند. هر مورد به بخش مربوط به خودش در همین پنل اشاره می‌کند."
      >
        {!audit ? (
          <div className="bg-muted h-64 animate-pulse rounded-lg" />
        ) : (
          <ul className="grid gap-2">
            {audit.checks.map((check) => (
              <SeoRow key={check.key} check={check} />
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="روش‌های تکمیلی" description="بعد از تکمیل موارد بالا، این‌ها بیشترین اثر را در جذب مخاطب محلی دارند.">
        <ol className="grid gap-3 text-xs leading-6">
          {[
            'ثبت دامنه در Google Search Console و ارسال sitemap.xml تا صفحه‌های جدید سریع ایندکس شوند.',
            'ساخت پروفایل Google Business برای باشگاه با نشانی و شماره تماس واقعی؛ بیشتر جستجوی باشگاه محلی است.',
            'نوشتن یک صفحه برای هر خدمت یا محله (مثلاً «برنامه تمرینی» و «باشگاه در تهرانپارس») تا دامنه با کلمات بیشتری دیده شود.',
            'افزودن تصویر واقعی با متن جایگزین توصیفی؛ تصویر بدون alt عملاً برای گوگل وجود ندارد.',
            'دریافت لینک از سایت باشگاه‌های همکار و انجمن‌های ورزشی، نه خرید بک‌لینک انبوه.',
          ].map((item, index) => (
            <li key={item} className="flex gap-3">
              <span className="border-border text-muted-foreground mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border text-[10px] font-bold">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>

        <p className="text-muted-foreground mt-4 flex items-start gap-2 text-[11px] leading-6">
          <Search className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          نقشه سایت در <bdi dir="ltr">/sitemap.xml</bdi> و قواعد ربات‌ها در <bdi dir="ltr">/robots.txt</bdi> به‌صورت خودکار ساخته می‌شوند.
        </p>
      </Panel>
    </div>
  )
}

function SeoRow({ check }: { check: SeoCheck }) {
  const meta = statusMeta[check.status] ?? statusMeta.warning
  const Icon = meta.icon

  return (
    <li className={cn('rounded-lg border p-3', meta.border)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 size-4 shrink-0', meta.className)} aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-xs font-bold">{check.title}</p>
          <p className="text-muted-foreground mt-0.5 text-[11px] leading-5">{check.detail}</p>
          {check.status !== 'pass' && (
            <p className="text-muted-foreground mt-1 text-[11px] leading-5">
              <span className="text-foreground font-semibold">راهکار: </span>
              {check.hint}
            </p>
          )}
        </div>
      </div>
    </li>
  )
}
