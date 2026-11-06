'use client'

import { useEffect, useState } from 'react'

import { Download, X } from '@/components/icons'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISS_KEY = 'hamowj-pwa-install-dismissed'

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (window.localStorage.getItem(DISMISS_KEY) === '1') return
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const onPrompt = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)

    // iOS Safari never fires beforeinstallprompt; show the manual Add to Home Screen hint.
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const timer = isIos
      ? window.setTimeout(() => setVisible(true), 8_000)
      : undefined

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  const install = async () => {
    if (!deferred) return

    setInstalling(true)
    try {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') {
        window.localStorage.setItem(DISMISS_KEY, '1')
      }
      setVisible(false)
    } finally {
      setInstalling(false)
      setDeferred(null)
    }
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-x-3 bottom-36 z-[69] md:inset-x-auto md:right-4 md:bottom-4 md:w-80"
      dir="rtl"
    >
      <div className="bg-card rounded-xl border p-3 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Download className="size-4" aria-hidden />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">نصب هم‌اوج روی دستگاه</p>
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              {deferred
                ? 'نسخه نصبی سریع‌تر باز می‌شود و تمرین‌های آفلاین را نگه می‌دارد.'
                : 'در مرورگر، منوی اشتراک‌گذاری را باز کنید و «افزودن به صفحه اصلی» را بزنید.'}
            </p>
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label="بستن پیشنهاد نصب"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring -m-1 inline-flex size-8 items-center justify-center rounded-lg outline-none focus-visible:ring-[3px]"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          {deferred ? (
            <button
              type="button"
              onClick={() => void install()}
              disabled={installing}
              className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 disabled:opacity-60"
            >
              <Download className="size-4" aria-hidden />
              {installing ? 'در حال نصب...' : 'نصب برنامه'}
            </button>
          ) : (
            <button
              type="button"
              onClick={dismiss}
              className="focus-visible:ring-ring inline-flex h-10 flex-1 items-center justify-center rounded-lg border px-3 text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2"
            >
              متوجه شدم
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
