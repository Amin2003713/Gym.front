'use client'

import { Scale } from '@/components/icons'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { listMyMeasurements, upsertMeasurement } from '@/app/(tenant)/_api/training-api'
import type { BodyMeasurement } from '@/app/(tenant)/_model/training.types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'

const fa = (value: number) => value.toLocaleString('fa-IR')
const today = () => new Date().toISOString().slice(0, 10)

const SUMMARY_FIELDS: Array<{ key: keyof BodyMeasurement; label: string; unit: string }> = [
  { key: 'weightKg', label: 'وزن', unit: 'kg' },
  { key: 'bodyFatPercent', label: 'چربی', unit: '٪' },
  { key: 'waistCm', label: 'کمر', unit: 'cm' },
  { key: 'chestCm', label: 'سینه', unit: 'cm' },
  { key: 'restingHeartRateBpm', label: 'ضربان', unit: 'bpm' },
]

/**
 * Session check-in: body weight is asked once per session (skippable) and every other measurement
 * is shown prefilled from the latest record, so the member can confirm what the coach would see
 * without opening the measurements screen. Skipping never blocks the workout.
 */
export function SessionStartSheet({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const [latest, setLatest] = useState<BodyMeasurement | null>(null)
  const [weight, setWeight] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return

    let alive = true

    void (async () => {
      setLoading(true)

      try {
        const rows = await listMyMeasurements(1, 1)
        if (!alive) return

        const entry = rows[0] ?? null
        setLatest(entry)
        setWeight(entry?.weightKg != null ? String(entry.weightKg) : '')
      } catch {
        /* The check-in is optional; a failed read only means no prefill. */
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [open])

  const save = async () => {
    const value = Number(weight.replace(',', '.'))

    if (!Number.isFinite(value) || value <= 0) {
      toast.error('وزن معتبر وارد کن یا رد کن.')
      return
    }

    setSaving(true)
    try {
      // Upsert replaces the day, so an existing today-entry keeps its other values.
      const sameDay = latest?.date === today()
      await upsertMeasurement({
        date: today(),
        weightKg: value,
        ...(sameDay && latest
          ? {
              bodyFatPercent: latest.bodyFatPercent,
              waistCm: latest.waistCm,
              chestCm: latest.chestCm,
              restingHeartRateBpm: latest.restingHeartRateBpm,
              sleepHours: latest.sleepHours,
              energyLevel: latest.energyLevel,
            }
          : {}),
      })
      toast.success('وزن امروز ثبت شد')
      onDone()
    } catch (error) {
      toast.error('ثبت وزن ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  const shown = SUMMARY_FIELDS.filter((field) => {
    const value = latest?.[field.key]
    return typeof value === 'number'
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="text-primary size-5" aria-hidden />
            ثبت سریع قبل از تمرین
          </DialogTitle>
          <DialogDescription>
            وزن امروز اختیاری است؛ بقیه اندازه‌گیری‌ها از آخرین ثبت نمایش داده می‌شوند.
          </DialogDescription>
        </DialogHeader>

        <label className="space-y-1">
          <span className="text-muted-foreground text-xs">وزن امروز (kg)</span>
          <Input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="20"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            disabled={loading}
            placeholder="—"
          />
        </label>

        {shown.length > 0 && (
          <div className="bg-muted/40 grid grid-cols-2 gap-2 rounded-xl border p-3">
            {shown.map((field) => (
              <div key={field.key}>
                <p className="text-muted-foreground text-[10px]">{field.label}</p>
                <p className="text-xs font-bold tabular-nums">
                  {fa(Number(latest?.[field.key]))} {field.unit}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void save()} disabled={saving || loading}>
            {saving ? 'در حال ذخیره…' : 'ذخیره و شروع'}
          </Button>
          <Button variant="ghost" onClick={onDone}>
            رد کردن
          </Button>
        </div>

        <Link
          href="/measurements"
          className="text-muted-foreground hover:text-foreground text-center text-[11px] underline-offset-4 hover:underline"
        >
          مشاهده و ثبت همه اندازه‌گیری‌ها
        </Link>
      </DialogContent>
    </Dialog>
  )
}
