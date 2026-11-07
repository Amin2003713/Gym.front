'use client'

import { useEffect, useState } from 'react'

import { Check, LoaderCircle, RefreshCw, WifiOff } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  listQueuedMutations,
  type QueuedMutation,
} from '@/lib/offline/mutation-queue'
import { useOfflineStatus } from '@/lib/offline/use-offline-status'
import { cn } from '@/lib/utils'

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  })

/**
 * Connectivity + offline-queue status for the app headers.
 *
 * Online with an empty queue stays invisible. Offline - or with changes still waiting on the
 * device - it shows a small pill next to the account menu that opens a panel with what is queued,
 * a manual "send now" action and the result of the last sync. Workout writes are the only queued
 * operations, so nothing here can touch payments or access.
 */
export function OfflineIndicator({ className }: { className?: string }) {
  const { online, pending, syncing, syncNow, lastSyncedAt } = useOfflineStatus()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<QueuedMutation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    let active = true

    void listQueuedMutations()
      .then((rows) => {
        if (active) {
          setItems(rows)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [open, pending])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) setLoading(true)
  }

  if (online && pending === 0 && !syncing) return null

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          dir="rtl"
          aria-label={
            online
              ? `${pending.toLocaleString('fa-IR')} تغییر در انتظار ارسال`
              : 'بدون اتصال به اینترنت'
          }
          className={cn(
            'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
            online
              ? 'border-[var(--warning)]/40 bg-[var(--warning)]/10 text-[var(--warning)]'
              : 'border-[var(--warning)]/40 bg-[var(--warning)]/10 text-[var(--warning)]',
            className,
          )}
        >
          {syncing ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
          ) : online ? (
            <RefreshCw className="size-3.5" aria-hidden />
          ) : (
            <WifiOff className="size-3.5" aria-hidden />
          )}
          {/* The long label is what overflows a 320px header; phones keep the icon and count. */}
          <span className={online ? 'hidden sm:inline' : 'inline'}>
            {online ? 'در انتظار ارسال' : 'آفلاین'}
          </span>
          {pending > 0 && (
            <span className="rounded-full bg-[var(--warning)]/20 px-1.5 text-[10px] leading-4 tabular-nums">
              {pending.toLocaleString('fa-IR')}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        dir="rtl"
        collisionPadding={8}
        className="w-[min(22rem,calc(100vw-1rem))] p-0"
      >
        <div className="border-border space-y-1 border-b p-3">
          <p className="text-sm font-extrabold">
            {online ? 'تغییرهای ذخیره‌شده در دستگاه' : 'حالت آفلاین'}
          </p>
          <p className="text-muted-foreground text-xs leading-5">
            {online
              ? 'این تغییرها روی همین دستگاه امن مانده‌اند و به‌ترتیب به سرور فرستاده می‌شوند.'
              : 'همین صفحه و داده‌های قبلی بدون اینترنت باز می‌شوند. ست‌های تمرین در صف می‌مانند.'}
          </p>
        </div>

        <div className="max-h-60 space-y-1.5 overflow-y-auto p-2">
          {loading ? (
            <p className="text-muted-foreground flex items-center gap-2 p-2 text-xs">
              <LoaderCircle className="size-3.5 animate-spin" /> در حال خواندن صف…
            </p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground p-2 text-xs">صف خالی است.</p>
          ) : (
            items.slice(0, 40).map((item) => (
              <div
                key={item.id}
                className="bg-muted/50 flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-xs"
              >
                <span className="min-w-0 truncate">{item.label}</span>
                <span className="text-muted-foreground shrink-0 text-[10px] tabular-nums">
                  {formatTime(item.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="border-border flex items-center justify-between gap-2 border-t p-2">
          <p className="text-muted-foreground text-[11px]">
            {lastSyncedAt
              ? `آخرین همگام‌سازی: ${formatTime(lastSyncedAt)}`
              : 'هنوز همگام‌سازی‌ای انجام نشده'}
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={!online || syncing || pending === 0}
            onClick={() => void syncNow()}
          >
            {syncing ? (
              <LoaderCircle className="me-1 size-3.5 animate-spin" />
            ) : (
              <Check className="me-1 size-3.5" />
            )}
            ارسال اکنون
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
