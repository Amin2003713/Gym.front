'use client'

import { CheckCircle2, RefreshCw, WifiOff } from '@/components/icons'
import { useOfflineStatus } from '@/lib/offline/use-offline-status'

export function OfflineStatusBar() {
  const { online, pending, syncing, syncNow } = useOfflineStatus()

  if (online && pending === 0) return null

  const count = pending.toLocaleString('fa-IR')

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] px-3 md:bottom-4"
      dir="rtl"
    >
      <div className="border-border bg-card/95 pointer-events-auto mx-auto flex max-w-3xl items-center gap-3 rounded-xl border px-3 py-2.5 shadow-lg backdrop-blur">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
            online ? 'bg-primary/10 text-primary' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
          }`}
        >
          {online ? (
            syncing ? (
              <RefreshCw className="size-4 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="size-4" aria-hidden />
            )
          ) : (
            <WifiOff className="size-4" aria-hidden />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {online ? 'تغییرهای آفلاین در انتظار ارسال' : 'حالت آفلاین'}
          </p>
          <p className="text-muted-foreground truncate text-xs leading-5">
            {online
              ? `${count} تغییر ذخیره شده؛ با اتصال پایدار به سرور فرستاده می‌شود.`
              : pending > 0
                ? `${count} تغییر روی همین دستگاه ذخیره شده و پس از اتصال همگام می‌شود.`
                : 'صفحه‌های دیده‌شده از حافظه دستگاه باز می‌شوند.'}
          </p>
        </div>

        {online && pending > 0 && (
          <button
            type="button"
            onClick={() => void syncNow()}
            disabled={syncing}
            className="focus-visible:ring-ring inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 disabled:opacity-60"
          >
            <RefreshCw
              className={`size-3.5 ${syncing ? 'animate-spin' : ''}`}
              aria-hidden
            />
            همگام‌سازی
          </button>
        )}
      </div>
    </div>
  )
}
