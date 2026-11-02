'use client'

import { Download, RotateCcw } from 'lucide-react'
import { useState } from 'react'

import {
  getMeasurementSummary,
  listMyMeasurements,
} from '@/app/(tenant)/_api/training-api'
import { listMyWorkouts } from '@/app/(tenant)/_api/workout-api'
import { START_TOUR_EVENT } from '@/app/(tenant)/_components/onboarding/onboarding-tour'
import { DEFAULT_PREFERENCES } from '@/app/(tenant)/_model/preferences'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'

import type { PanelProps } from './types'

/** Raw view of the settings object plus the one-click return to defaults. */
export function AdvancedPanel({ draft, replace }: PanelProps) {
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs leading-6">
        این همان چیزی است که با دکمه ذخیره به سرور می‌رود. اگر چیزی خراب شد، «بازگردانی پیش‌فرض»
        همه تنظیمات را به حالت اول برمی‌گرداند و بعد ذخیره کن.
      </p>

      <pre
        dir="ltr"
        className="bg-muted/50 max-h-72 overflow-auto rounded-xl p-3 text-[11px] leading-5"
      >
        {JSON.stringify(draft, null, 2)}
      </pre>

      <Button variant="outline" size="sm" onClick={() => replace(DEFAULT_PREFERENCES)}>
        <RotateCcw className="size-4" />
        بازگردانی پیش‌فرض
      </Button>
    </div>
  )
}

/** Everything the member has logged, as one JSON file they can keep or hand to a coach. */
export function DataPanel({ draft }: PanelProps) {
  const [exporting, setExporting] = useState(false)

  const download = async () => {
    setExporting(true)

    try {
      const [measurements, summary, workouts] = await Promise.all([
        listMyMeasurements(1, 365),
        getMeasurementSummary(),
        listMyWorkouts('', null, 100).catch(() => null),
      ])

      const payload = {
        exportedAt: new Date().toISOString(),
        preferences: draft,
        measurementSummary: summary,
        measurements,
        workouts,
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `hamowj-data-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)

      toast.success('فایل داده‌ها آماده شد')
    } catch (error) {
      toast.error('دریافت داده‌ها ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs leading-6">
        فایل شامل جلسات تمرین، ست‌ها، اندازه‌گیری‌ها و تنظیمات توست. می‌توانی آن را نگه داری یا
        برای مربی بفرستی.
      </p>

      <Button variant="outline" size="sm" onClick={() => void download()} disabled={exporting}>
        <Download className="size-4" />
        {exporting ? 'در حال آماده‌سازی…' : 'دریافت فایل JSON'}
      </Button>
    </div>
  )
}

/** Static facts about the app; no settings are edited here. */
export function AboutPanel() {
  return (
    <div className="space-y-3 text-sm leading-7">
      <p>
        <span className="font-bold">هم‌اوج</span> دفترچه تمرین و همراه برنامه‌ریزی توست: کتابخانه
        حرکات، برنامه هفتگی، ثبت ست‌ها، تحلیل عضلات و اندازه‌گیری بدن در یک جا.
      </p>
      <p className="text-muted-foreground text-xs leading-6">
        داده‌های تمرین در پایگاه‌داده همین باشگاه نگه‌داری می‌شود؛ مربی فقط چیزهایی را می‌بیند که
        برای نوشتن برنامه لازم است. برای پیشنهاد یا مشکل با مربی باشگاه حرف بزن.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.dispatchEvent(new Event(START_TOUR_EVENT))}
      >
        <RotateCcw className="size-4" />
        نمایش دوباره راهنمای صفحه
      </Button>

      <p className="text-muted-foreground text-xs">نسخه ۱.۰</p>
    </div>
  )
}
