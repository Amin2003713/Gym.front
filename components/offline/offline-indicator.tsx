'use client'

import { WifiOff } from '@/components/icons'
import { useOfflineStatus } from '@/lib/offline/use-offline-status'
import { cn } from '@/lib/utils'

/**
 * Compact connectivity pill for the app headers. It is rendered next to the account menu and is
 * intentionally invisible while the device is online: the app already tells the user when queued
 * changes are sent (toast), so a permanent "you have internet" banner is only noise.
 */
export function OfflineIndicator({ className }: { className?: string }) {
  const { online, pending } = useOfflineStatus()

  if (online) return null

  return (
    <span
      role="status"
      aria-live="polite"
      dir="rtl"
      title={
        pending > 0
          ? `${pending.toLocaleString('fa-IR')} تغییر ذخیره‌شده در انتظار اتصال`
          : 'بدون اتصال به اینترنت؛ داده‌های دیده‌شده از حافظه دستگاه باز می‌شوند.'
      }
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 text-xs font-bold text-amber-700 dark:text-amber-400',
        className,
      )}
    >
      <WifiOff className="size-3.5" aria-hidden />
      <span>آفلاین</span>
      {pending > 0 && (
        <span className="rounded-full bg-amber-500/20 px-1.5 text-[10px] leading-4 tabular-nums">
          {pending.toLocaleString('fa-IR')}
        </span>
      )}
    </span>
  )
}
