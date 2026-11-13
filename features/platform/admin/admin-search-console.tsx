'use client'

import { useCallback, useEffect, useState } from 'react'

import { AlertTriangle, ArrowUpRight, CheckCircle2, RefreshCw, Search, XCircle } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlatformAuthError, platformAdmin } from '@/features/platform/api'
import { formatDateTime } from '@/features/platform/format'
import type { SearchConsole } from '@/features/platform/types'
import { cn } from '@/lib/utils'

import { Notice, Panel } from './admin-ui'

const statusMeta = {
  reachable: { label: 'در دسترس', icon: CheckCircle2, className: 'text-success' },
  partial: { label: 'ناقص', icon: AlertTriangle, className: 'text-warning' },
  unreachable: { label: 'در دسترس نیست', icon: XCircle, className: 'text-destructive' },
  unchecked: { label: 'بررسی نشده', icon: Search, className: 'text-muted-foreground' },
} as const

type Draft = {
  propertyUrl: string
  sitemapUrl: string
  notes: string
}

const toDraft = (data: SearchConsole): Draft => ({
  propertyUrl: data.propertyUrl ?? '',
  sitemapUrl: data.sitemapUrl ?? '',
  notes: data.notes ?? '',
})

export function AdminSearchConsole({ onAuthError }: { onAuthError: () => void }) {
  const [data, setData] = useState<SearchConsole | null>(null)
  const [draft, setDraft] = useState<Draft>({ propertyUrl: '', sitemapUrl: '', notes: '' })
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setBusy(true)
    setError(null)

    try {
      const result = await platformAdmin.searchConsole()
      setData(result)
      setDraft(toDraft(result))
    } catch (cause) {
      if (cause instanceof PlatformAuthError) {
        onAuthError()
        return
      }

      setError(cause instanceof Error ? cause.message : 'دریافت وضعیت کنسول جستجو انجام نشد.')
    } finally {
      setBusy(false)
    }
  }, [onAuthError])

  useEffect(() => {
    let cancelled = false

    platformAdmin
      .searchConsole()
      .then((result) => {
        if (cancelled) return
        setData(result)
        setDraft(toDraft(result))
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        if (cause instanceof PlatformAuthError) return onAuthError()
        setError(cause instanceof Error ? cause.message : 'دریافت وضعیت کنسول جستجو انجام نشد.')
      })
      .finally(() => {
        if (!cancelled) setBusy(false)
      })

    return () => {
      cancelled = true
    }
  }, [onAuthError])

  const save = async () => {
    setSaving(true)
    setError(null)
    setNotice(null)

    try {
      const result = await platformAdmin.saveSearchConsole({
        propertyUrl: draft.propertyUrl.trim() || null,
        sitemapUrl: draft.sitemapUrl.trim() || null,
        notes: draft.notes.trim() || null,
      })
      setData(result)
      setDraft(toDraft(result))
      setNotice('تنظیمات کنسول جستجو ذخیره و وضعیت دوباره بررسی شد.')
    } catch (cause) {
      if (cause instanceof PlatformAuthError) {
        onAuthError()
        return
      }

      setError(cause instanceof Error ? cause.message : 'ذخیره تنظیمات انجام نشد.')
    } finally {
      setSaving(false)
    }
  }

  const check = async () => {
    setBusy(true)
    setError(null)
    setNotice(null)

    try {
      const result = await platformAdmin.checkSearchConsole()
      setData(result)
      setNotice('وضعیت کنسول جستجو دوباره بررسی شد.')
    } catch (cause) {
      if (cause instanceof PlatformAuthError) {
        onAuthError()
        return
      }

      setError(cause instanceof Error ? cause.message : 'بررسی وضعیت انجام نشد.')
    } finally {
      setBusy(false)
    }
  }

  const meta = statusMeta[(data?.status as keyof typeof statusMeta) ?? 'unchecked'] ?? statusMeta.unchecked
  const StatusIcon = meta.icon

  return (
    <div className="grid gap-4">
      {notice && <Notice tone="success">{notice}</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}

      <Panel
        title="کنسول جستجوی گوگل"
        description="نشانی ملک ثبت‌شده در Search Console و نقشه سایت را اینجا نگه دارید. وضعیت دسترسی نقشه سایت و robots.txt به‌صورت زنده بررسی می‌شود."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" isLoading={busy} onClick={() => void check()}>
              <RefreshCw className="size-3.5" aria-hidden="true" />
              بررسی دوباره
            </Button>
            <Button size="sm" isLoading={saving} onClick={() => void save()}>
              ذخیره
            </Button>
          </div>
        }
      >
        {!data ? (
          <div className="bg-muted h-48 animate-pulse rounded-lg" />
        ) : (
          <div className="grid gap-5">
            <div
              className={cn(
                'flex flex-wrap items-start gap-3 rounded-xl border p-3',
                data.status === 'reachable'
                  ? 'border-success/30 bg-success/5'
                  : data.status === 'partial'
                    ? 'border-warning/30 bg-warning/5'
                    : data.status === 'unreachable'
                      ? 'border-destructive/30 bg-destructive/5'
                      : 'border-border',
              )}
            >
              <StatusIcon className={cn('mt-0.5 size-5 shrink-0', meta.className)} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-bold', meta.className)}>{meta.label}</p>
                <p className="text-muted-foreground mt-1 text-xs leading-6">
                  {data.detail ?? 'هنوز بررسی‌ای انجام نشده است.'}
                </p>
                {data.lastCheckedAtUtc && (
                  <p className="text-muted-foreground mt-1 text-[11px]">
                    آخرین بررسی: {formatDateTime(data.lastCheckedAtUtc)}
                  </p>
                )}
                <a
                  href={data.manageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary mt-2 inline-flex items-center gap-1 text-[11px] font-semibold underline underline-offset-4"
                >
                  مدیریت در Google Search Console
                  <ArrowUpRight className="size-3" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-semibold">
                نشانی ملک (Property URL)
                <Input
                  dir="ltr"
                  value={draft.propertyUrl}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, propertyUrl: event.target.value }))
                  }
                  placeholder="https://example.com/"
                />
                <span className="text-muted-foreground block text-[10px] font-normal leading-5">
                  همان نشانی‌ای که در Search Console ثبت کرده‌اید.
                </span>
              </label>

              <label className="space-y-1 text-xs font-semibold">
                نقشه سایت (Sitemap)
                <Input
                  dir="ltr"
                  value={draft.sitemapUrl}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, sitemapUrl: event.target.value }))
                  }
                  placeholder="/sitemap.xml"
                />
                <span className="text-muted-foreground block text-[10px] font-normal leading-5">
                  خالی بگذارید تا sitemap.xml خودکار استفاده شود.
                </span>
              </label>
            </div>

            <label className="space-y-1 text-xs font-semibold">
              یادداشت مدیریت
              <textarea
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                rows={3}
                maxLength={1000}
                className="border-input bg-background focus-visible:ring-ring w-full rounded-md border p-2 text-sm outline-none focus-visible:ring-2"
                placeholder="مثلاً: تأیید مالکیت با رکورد DNS انجام شده است."
              />
            </label>
          </div>
        )}
      </Panel>

      <Panel title="چک‌لیست" description="این موارد بیشترین اثر را در دیده‌شدن سریع صفحه‌های جدید دارند.">
        <ol className="grid gap-2 text-xs leading-6">
          {[
            'نشانی ملک را در Search Console ثبت و مالکیت را تأیید کنید.',
            'نقشه سایت را در بخش Sitemaps همان ملک ارسال کنید.',
            'برای صفحه‌های مهم، درخواست ایندکس فوری بدهید.',
            'خطاهای پوشش (Coverage) را هر هفته بررسی کنید.',
          ].map((item, index) => (
            <li key={item} className="flex gap-2">
              <span className="border-border text-muted-foreground mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  )
}
