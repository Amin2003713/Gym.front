import type { Metadata } from 'next'
import Link from 'next/link'

import { WifiOff } from '@/components/icons'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'آفلاین | هم‌اوج',
  description: 'اتصال اینترنت قطع است؛ هم‌اوج در حالت آفلاین کار می‌کند.',
}

export default function OfflinePage() {
  return (
    <main
      dir="rtl"
      className="mx-auto flex min-h-svh w-full max-w-lg flex-col items-center justify-center gap-5 px-5 text-center"
    >
      <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 flex size-16 items-center justify-center rounded-2xl">
        <WifiOff className="size-8" aria-hidden />
      </span>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight">فعلاً آفلاین هستید</h1>
        <p className="text-muted-foreground text-sm leading-7">
          صفحه‌هایی که قبلاً باز کرده‌اید و ست‌های ذخیره‌شده در همین دستگاه باقی مانده‌اند.
          به‌محض برگشت اینترنت، تغییرها خودکار همگام می‌شوند.
        </p>
      </div>

      <Button asChild className="h-11 px-5">
        <Link href="/">تلاش دوباره</Link>
      </Button>

      <p className="text-muted-foreground text-xs leading-6">
        اگر صفحه همچنان باز نشد، اتصال Wi‑Fi یا داده موبایل را بررسی کنید.
      </p>
    </main>
  )
}
