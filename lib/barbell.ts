/**
 * Plate-loading math for the barbell schematic.
 *
 * The gym profile decides the bar and the available plates; these are the platform defaults used
 * before that setting is configured. A plate set is per side, and equal plates load on both sides,
 * so the per-side target is (total - bar) / 2.
 */

export type WeightUnit = 'kg' | 'lb'

export const DEFAULT_BAR_WEIGHT: Record<WeightUnit, number> = {
  kg: 20,
  lb: 45,
}

export const DEFAULT_PLATES: Record<WeightUnit, number[]> = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25],
  lb: [45, 35, 25, 10, 5, 2.5],
}

export interface LoadedPlate {
  weight: number
  count: number
}

export interface BarbellLoad {
  /** Total weight asked for, in the unit. */
  target: number
  barWeight: number
  /** Plates on ONE side, heaviest first. */
  perSide: LoadedPlate[]
  /** Weight that could not be loaded with the available plates. */
  remainder: number
  /** Total actually loaded (bar + both sides). */
  loaded: number
  /** True when the target is below the bar itself. */
  belowBar: boolean
}

const round2 = (value: number) => Math.round(value * 100) / 100

/**
 * Greedy plate loading. `plates` is a set of per-side plate weights, largest first; each weight is
 * used as many times as it fits. Greedy is exact for the standard sets above because each plate is
 * at most half of the next heavier one.
 */
export function loadBarbell(
  target: number,
  barWeight: number,
  plates: number[] = DEFAULT_PLATES.kg,
): BarbellLoad {
  const total = Math.max(0, target)
  const bar = Math.max(0, barWeight)

  if (total < bar) {
    return {
      target: total,
      barWeight: bar,
      perSide: [],
      remainder: total,
      loaded: 0,
      belowBar: true,
    }
  }

  let perSideWeight = round2((total - bar) / 2)
  const available = [...plates]
    .filter((plate) => Number.isFinite(plate) && plate > 0)
    .sort((a, b) => b - a)

  const perSide: LoadedPlate[] = []

  for (const plate of available) {
    const count = Math.floor(round2(perSideWeight) / plate)

    if (count > 0) {
      perSide.push({ weight: plate, count })
      perSideWeight = round2(perSideWeight - plate * count)
    }
  }

  const loadedPerSide = perSide.reduce(
    (sum, entry) => sum + entry.weight * entry.count,
    0,
  )

  return {
    target: total,
    barWeight: bar,
    perSide,
    remainder: round2(perSideWeight),
    loaded: round2(bar + loadedPerSide * 2),
    belowBar: false,
  }
}

/**
 * Dumbbells are loaded per hand: the entered weight is the pair total in the app, so the helper
 * shows what each hand carries. Odd totals are reported as-is rather than silently rounded.
 */
export function loadDumbbells(target: number): {
  total: number
  perHand: number
  uneven: boolean
} {
  const total = Math.max(0, target)
  const perHand = round2(total / 2)

  return { total, perHand, uneven: round2(perHand * 2) !== round2(total) }
}

/** Text form of one side, e.g. "۲۵ + ۱۰ + ۲.۵" (fa digits handled by the caller's formatter). */
export function describePlateLoad(load: BarbellLoad, format: (value: number) => string): string {
  if (load.belowBar) return 'وزن از خود هالتر کمتر است'

  if (load.perSide.length === 0) return `${format(load.barWeight)} (فقط میله)`

  const plates = load.perSide
    .flatMap((entry) => Array.from({ length: entry.count }, () => format(entry.weight)))
    .join(' + ')

  return `${plates} در هر طرف`
}
