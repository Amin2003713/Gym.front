'use client'

import { Info } from '@/components/icons'

import { BarbellLoad } from '@/components/barbell-load'
import { loadDumbbells, type WeightUnit } from '@/lib/barbell'

const fa = (value: number) =>
  value.toLocaleString('fa-IR', { maximumFractionDigits: 2 })

/** Barbell family gets a plate schematic; dumbbells are described per hand. */
const isDumbbell = (equipment: string | null | undefined) =>
  !!equipment && /dumbbell|دمبل/i.test(equipment)

const isBarbell = (equipment: string | null | undefined) =>
  !!equipment && /barbell|هالتر|olympic/i.test(equipment)

export interface ExerciseLoadHelperProps {
  equipment?: string | null
  minWeightKg?: number | null
  maxWeightKg?: number | null
  /** Today's engine suggestion; falls back to the last logged set. */
  suggestionWeightKg?: number | null
  lastWeightKg?: number | null
  unit?: WeightUnit
  barWeight?: number
  plates?: number[]
}

/**
 * The one place the workout says "what should the bar hold". It answers three questions at once:
 * the coach's allowed window, the suggested weight for today, and how to load it with this gym's
 * bar/plates (or how much each hand carries for dumbbells).
 */
export function ExerciseLoadHelper({
  equipment,
  minWeightKg,
  maxWeightKg,
  suggestionWeightKg,
  lastWeightKg,
  unit = 'kg',
  barWeight,
  plates,
}: ExerciseLoadHelperProps) {
  const weight = suggestionWeightKg ?? lastWeightKg ?? null
  const hasWindow = minWeightKg != null || maxWeightKg != null
  const dumbbell = isDumbbell(equipment)
  const barbell = isBarbell(equipment) || (!dumbbell && weight != null)
  const dumbbells = weight != null ? loadDumbbells(weight) : null

  return (
    <section
      aria-label="وزن هدف و بارگذاری"
      className="bg-muted/30 space-y-2 rounded-xl border p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold">
          <Info className="text-primary size-3.5" aria-hidden />
          وزن هدف
        </p>
        <span className="text-muted-foreground text-[11px] tabular-nums">
          {hasWindow
            ? `بازه مجاز ${minWeightKg != null ? fa(minWeightKg) : '—'}–${
                maxWeightKg != null ? fa(maxWeightKg) : '—'
              } ${unit}`
            : 'بازه‌ای تعیین نشده؛ وزن پیشنهادی را استفاده کن'}
        </span>
      </div>

      {weight == null ? (
        <p className="text-muted-foreground text-xs leading-6">
          هنوز ستی برای این حرکت ثبت نشده. اولین وزن را محافظه‌کارانه انتخاب کن؛ ست‌های بعد
          پیشنهاد دقیق‌تری می‌دهند.
        </p>
      ) : dumbbell && dumbbells ? (
        <div className="space-y-1">
          <p className="text-sm font-semibold tabular-nums">
            {fa(dumbbells.total)} {unit} در مجموع
          </p>
          <p className="text-muted-foreground text-xs leading-6 tabular-nums">
            هر دست {fa(dumbbells.perHand)} {unit} (دو دمبل)
            {dumbbells.uneven ? ' · وزن به‌طور مساوی بین دو دست تقسیم نمی‌شود' : ''}
          </p>
        </div>
      ) : barbell ? (
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-center">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold tabular-nums">
              {fa(weight)} {unit}
              {suggestionWeightKg != null ? ' (پیشنهاد امروز)' : ' (آخرین وزن ثبت‌شده)'}
            </p>
            <p className="text-muted-foreground text-[11px] leading-5">
              میله {fa(barWeight ?? (unit === 'lb' ? 45 : 20))} {unit} است؛ صفحه‌ها برای یک
              طرف محاسبه شده‌اند.
            </p>
          </div>
          <BarbellLoad weight={weight} unit={unit} barWeight={barWeight} plates={plates} size="sm" />
        </div>
      ) : (
        <p className="text-sm font-semibold tabular-nums">
          {fa(weight)} {unit}
          {suggestionWeightKg != null ? ' (پیشنهاد امروز)' : ' (آخرین وزن ثبت‌شده)'}
        </p>
      )}
    </section>
  )
}
