'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import {
  getGymEquipment,
  type GymEquipment,
} from '@/app/(tenant)/_api/gym-equipment-api'
import { BarbellLoad } from '@/components/barbell-load'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/toast'

const fa = (value: number) =>
  value.toLocaleString('fa-IR', { maximumFractionDigits: 2 })

/**
 * Gym equipment is a gym-wide fact (everyone trains with the same rack), so this page is read-only
 * for members and coaches; only an administrator can change it. The member's own equipment
 * preference moved to the workout settings.
 */
export function EquipmentPanel() {
  const [equipment, setEquipment] = useState<GymEquipment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const loaded = await getGymEquipment()

        if (!cancelled) setEquipment(loaded)
      } catch (error) {
        if (!cancelled)
          toast.error('دریافت تجهیزات باشگاه ناموفق بود', {
            description: error instanceof Error ? error.message : undefined,
          })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <Skeleton className="h-40 rounded-xl" />

  if (!equipment) {
    return (
      <p className="text-muted-foreground py-6 text-center text-xs leading-6">
        تجهیزات باشگاه در دسترس نیست. بعداً دوباره سر بزن.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted/40 flex items-start gap-3 rounded-xl border p-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">تجهیزات باشگاه</p>
          <p className="text-muted-foreground mt-0.5 text-xs leading-5">
            این تنظیم برای همه اعضا یکی است و فقط مدیر باشگاه می‌تواند آن را تغییر دهد.
          </p>
        </div>
        <span className="bg-background text-muted-foreground ms-auto shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold">
          فقط خواندنی
        </span>
      </div>

      <dl className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border p-3">
          <dt className="text-muted-foreground text-[11px]">وزن متوسط هالتر</dt>
          <dd className="mt-1 text-lg font-extrabold tabular-nums">
            {fa(equipment.barbellWeightKg)} kg
          </dd>
        </div>
        <div className="rounded-xl border p-3">
          <dt className="text-muted-foreground text-[11px]">صفحه‌های موجود (هر طرف)</dt>
          <dd className="mt-1 flex flex-wrap gap-1">
            {equipment.plateSetKg.length ? (
              equipment.plateSetKg.map((plate) => (
                <span
                  key={plate}
                  className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
                >
                  {fa(plate)} kg
                </span>
              ))
            ) : (
              <span className="text-muted-foreground text-xs">ثبت نشده</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="rounded-xl border p-3">
        <p className="text-muted-foreground mb-2 text-[11px] font-semibold">
          نمونه بارگذاری برای ۱۰۰ کیلوگرم
        </p>
        <BarbellLoad
          weight={100}
          barWeight={equipment.barbellWeightKg}
          plates={equipment.plateSetKg}
          className="mx-auto max-w-sm"
        />
      </div>

      <p className="text-muted-foreground text-[11px] leading-5">
        تجهیزات شخصی خودت (مثلاً اگر فقط با دمبل تمرین می‌کنی) در{' '}
        <Link href="/settings/workout" className="text-primary font-semibold">
          تنظیمات تمرین
        </Link>{' '}
        است.
      </p>
    </div>
  )
}
