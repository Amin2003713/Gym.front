'use client'

import { Button } from '@/components/ui/button'

/**
 * Route-level boundary for the whole tenant area. A failed read (or a flaky mobile connection)
 * must never leave a blank page: the shell stays, the user gets the reason and one retry.
 */
export default function TenantError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main
      dir="rtl"
      className="flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center"
    >
      <h1 className="text-lg font-bold">این بخش بارگذاری نشد</h1>
      <p className="text-muted-foreground max-w-sm text-sm leading-7">
        اتصال اینترنت را بررسی کنید و دوباره تلاش کنید. اگر مشکل ادامه داشت با پشتیبانی تماس
        بگیرید.
      </p>
      <Button type="button" onClick={reset} className="mt-2">
        تلاش دوباره
      </Button>
    </main>
  )
}
