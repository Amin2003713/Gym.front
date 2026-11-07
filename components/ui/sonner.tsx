'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from '@/components/icons'
import {
  dismissToast,
  getServerToasts,
  getToasts,
  subscribeToasts,
  type ToastItem,
  type ToastKind,
  type ToastPosition,
} from '@/lib/toast'

const ICON: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const ICON_TONE: Record<ToastKind, string> = {
  success: 'bg-success/10 text-success',
  error: 'bg-destructive/10 text-destructive',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
}

const EDGE: Record<ToastKind, string> = {
  success: 'bg-success',
  error: 'bg-destructive',
  warning: 'bg-warning',
  info: 'bg-info',
}

const POSITION: Record<ToastPosition, string> = {
  'top-left': 'top-3 left-3',
  'top-center': 'top-3 left-1/2 -translate-x-1/2',
  'top-right': 'top-3 right-3',
  'bottom-left': 'bottom-3 left-3',
  'bottom-center': 'bottom-3 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-3 right-3',
}

function ToastCard({ item }: { item: ToastItem }) {
  const [paused, setPaused] = useState(false)
  const Icon = ICON[item.kind]

  // Hovering or focusing a toast holds it long enough to read; leaving restarts the full delay.
  useEffect(() => {
    if (item.duration === null || paused) return

    const timer = window.setTimeout(() => dismissToast(item.id), item.duration)
    return () => window.clearTimeout(timer)
  }, [item.duration, item.id, paused])

  return (
    <div
      role={item.kind === 'error' ? 'alert' : 'status'}
      dir="rtl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="animate-in fade-in slide-in-from-top-2 pointer-events-auto relative overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-[var(--shadow-elevated)] duration-200"
    >
      <span aria-hidden className={`absolute inset-y-0 start-0 w-1 ${EDGE[item.kind]}`} />

      <div className="flex items-start gap-3 py-3 ps-4 pe-11">
        <span
          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${ICON_TONE[item.kind]}`}
        >
          <Icon className="size-[18px]" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-6 font-bold">{item.title}</p>
          {item.description && (
            <p className="text-muted-foreground mt-0.5 text-xs leading-5 break-words">
              {item.description}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => dismissToast(item.id)}
        aria-label="بستن اعلان"
        className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring absolute end-1 top-1 inline-flex size-9 items-center justify-center rounded-lg transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
      >
        <X className="size-3.5" aria-hidden />
      </button>

      {item.duration !== null && (
        <span
          aria-hidden
          data-paused={paused}
          className={`toast-progress absolute inset-x-0 bottom-0 h-0.5 origin-right ${EDGE[item.kind]}`}
          style={{ animationDuration: `${item.duration}ms` }}
        />
      )}
    </div>
  )
}

/**
 * Notifications are rendered per position so a caller can still ask for a corner, while the
 * usual call gets a centred stack. The card is a real surface (not translucent) and carries a
 * close button, so a long error never blocks the header behind it.
 */
const Toaster = () => {
  const items = useSyncExternalStore(subscribeToasts, getToasts, getServerToasts)

  if (items.length === 0) return null

  return (
    <>
      {(Object.keys(POSITION) as ToastPosition[]).map((position) => {
        const group = items.filter((item) => item.position === position)
        if (group.length === 0) return null

        return (
          <div
            key={position}
            role="region"
            aria-label="اعلان‌ها"
            className={`pointer-events-none fixed z-[100] flex w-[min(26rem,calc(100vw-1.5rem))] flex-col gap-2 ${POSITION[position]}`}
          >
            {group.map((item) => (
              <ToastCard key={item.id} item={item} />
            ))}
          </div>
        )
      })}
    </>
  )
}

export { Toaster }
