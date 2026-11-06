'use client'

import { useEffect } from 'react'

import { toast } from '@/lib/toast'

import { PwaInstallPrompt } from './pwa-install-prompt'

const SYNC_INTERVAL_MS = 30_000

export function OfflineProvider() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        const register = () => {
          void navigator.serviceWorker.register('/sw.js').catch(() => {
            // A blocked service worker must not break the app; online behaviour is unchanged.
          })
        }

        if (document.readyState === 'complete') register()
        else window.addEventListener('load', register, { once: true })
      } else {
        // A development server plus an old production worker is a classic stale-cache trap.
        void navigator.serviceWorker
          .getRegistrations()
          .then((rows) => rows.forEach((row) => void row.unregister()))
          .catch(() => {})
      }
    }

    const flush = async () => {
      if (navigator.onLine === false) return
      const { queuedMutationCount } = await import('@/lib/offline/mutation-queue')
      if ((await queuedMutationCount()) === 0) return
      const { flushOfflineQueue } = await import('@/lib/offline/sync')
      await flushOfflineQueue()
    }

    const onOnline = () => void flush()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void flush()
    }
    const onSynced = (event: Event) => {
      const detail = (
        event as CustomEvent<{ state: string; sent?: number; discarded?: number }>
      ).detail
      if (detail?.state !== 'finished') return
      if ((detail.sent ?? 0) > 0) {
        toast.success('تغییرهای آفلاین همگام‌سازی شد', {
          description: `${detail.sent?.toLocaleString('fa-IR')} تغییر با سرور هماهنگ شد.`,
        })
      }
      if ((detail.discarded ?? 0) > 0) {
        toast.warning('بعضی تغییرهای آفلاین پذیرفته نشد', {
          description: 'این موارد از صف حذف شدند؛ لطفاً دوباره ثبت کنید.',
        })
      }
    }

    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('hamowj:sync', onSynced)
    const timer = window.setInterval(() => void flush(), SYNC_INTERVAL_MS)

    // An app opened after a previous offline session drains the queue immediately.
    void flush()

    return () => {
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('hamowj:sync', onSynced)
      window.clearInterval(timer)
    }
  }, [])

  // Connectivity is shown as a pill beside the account menu (see OfflineIndicator), so this
  // provider only owns background sync and the install prompt.
  return <PwaInstallPrompt />
}
