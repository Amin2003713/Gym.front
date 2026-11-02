'use client'

import { useMemo } from 'react'

import {
  DEFAULT_BAR_WEIGHT,
  DEFAULT_PLATES,
  describePlateLoad,
  loadBarbell,
  type WeightUnit,
} from '@/lib/barbell'

/** Classic plate colours; the numbers stay readable in both themes. */
const PLATE_COLOR: Record<number, string> = {
  45: '#c0392b',
  35: '#1f6feb',
  25: '#c0392b',
  20: '#1f6feb',
  15: '#d4a017',
  10: '#2e7d32',
  5: '#9aa0a6',
  2.5: '#2b2b2b',
  1.25: '#8d8d8d',
}

const HEIGHT: Record<number, string> = {
  45: 'h-20',
  35: 'h-[4.25rem]',
  25: 'h-20',
  20: 'h-[4.25rem]',
  15: 'h-16',
  10: 'h-14',
  5: 'h-11',
  2.5: 'h-9',
  1.25: 'h-8',
}

const fa = (value: number) =>
  value.toLocaleString('fa-IR', { maximumFractionDigits: 2 })

export interface BarbellLoadProps {
  /** Target total weight. */
  weight: number
  unit?: WeightUnit
  /** Gym-level bar weight; falls back to 20 kg / 45 lb. */
  barWeight?: number
  /** Gym-level plate set (per side). */
  plates?: number[]
  size?: 'sm' | 'md'
  className?: string
}

/**
 * A plate-loading schematic: bar with the plates for one side, mirrored for the other.
 * Decorative drawing with a text alternative, so screen readers get the same information.
 */
export function BarbellLoad({
  weight,
  unit = 'kg',
  barWeight,
  plates,
  size = 'md',
  className = '',
}: BarbellLoadProps) {
  const load = useMemo(
    () =>
      loadBarbell(
        weight,
        barWeight ?? DEFAULT_BAR_WEIGHT[unit],
        plates?.length ? plates : DEFAULT_PLATES[unit],
      ),
    [barWeight, plates, unit, weight],
  )

  const description = `${fa(weight)} ${unit} · ${describePlateLoad(load, fa)}${
    load.remainder > 0
      ? ` · ${fa(load.remainder)} ${unit} بدون صفحه`
      : ''
  }`

  const platesForOneSide = load.perSide.flatMap((entry) =>
    Array.from({ length: entry.count }, (_, index) => ({
      key: `${entry.weight}-${index}`,
      weight: entry.weight,
    })),
  )

  const scale = size === 'sm' ? 'scale-90 origin-center' : ''

  return (
    <figure
      className={`space-y-1 ${className}`}
      aria-label={`نمای هالتر: ${description}`}
    >
      <div
        dir="ltr"
        className={`bg-muted/40 flex items-center justify-center gap-0.5 overflow-hidden rounded-xl border px-2 py-2 ${scale}`}
      >
        <span className="bg-muted-foreground/60 h-1 w-4 rounded-full" aria-hidden />

        {platesForOneSide
          .slice()
          .reverse()
          .map((plate) => (
            <span
              key={`left-${plate.key}`}
              aria-hidden
              className={`w-2 rounded-[2px] ${HEIGHT[plate.weight] ?? 'h-9'}`}
              style={{
                backgroundColor: PLATE_COLOR[plate.weight] ?? 'var(--muted-foreground)',
              }}
            />
          ))}

        <span
          className="bg-foreground/70 h-1 flex-1 rounded-full"
          aria-hidden
          style={{ minWidth: 32 }}
        />

        {platesForOneSide.map((plate) => (
          <span
            key={`right-${plate.key}`}
            aria-hidden
            className={`w-2 rounded-[2px] ${HEIGHT[plate.weight] ?? 'h-9'}`}
            style={{
              backgroundColor: PLATE_COLOR[plate.weight] ?? 'var(--muted-foreground)',
            }}
          />
        ))}

        <span className="bg-muted-foreground/60 h-1 w-4 rounded-full" aria-hidden />
      </div>

      <figcaption className="text-muted-foreground text-center text-[10px] leading-4 tabular-nums">
        {load.belowBar
          ? 'وزن کمتر از میله است'
          : load.perSide.length === 0
            ? `${fa(load.barWeight)} ${unit} · فقط میله`
            : `${load.perSide
                .map((entry) => `${fa(entry.count)}×${fa(entry.weight)}`)
                .join(' + ')} در هر طرف`}
        {load.remainder > 0 && !load.belowBar
          ? ` · ${fa(load.remainder)} ${unit} باقی‌مانده`
          : ''}
      </figcaption>
    </figure>
  )
}
