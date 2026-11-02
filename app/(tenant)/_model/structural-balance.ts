import type { MuscleSlug } from '@/lib/muscles'

import type { MuscleUse } from './muscle-balance'

/**
 * Structural balance keeps to a few judgement calls, not a scoring engine:
 * antagonist pairs are compared over the selected window, and every muscle is
 * filed under one movement group so the push/pull/legs/core split can be read
 * at a glance. Both are derived from the same `MuscleUse` map the body map uses.
 */

export type BalanceGroup = 'push' | 'pull' | 'legs' | 'core'

export const BALANCE_GROUP_LABEL: Record<BalanceGroup, string> = {
  push: 'فشار (Push)',
  pull: 'کشش (Pull)',
  legs: 'پا',
  core: 'میان‌تنه',
}

export const MUSCLE_GROUP: Record<MuscleSlug, BalanceGroup> = {
  trapezius: 'pull',
  deltoids: 'push',
  chest: 'push',
  'upper-back': 'pull',
  serratus: 'push',
  biceps: 'pull',
  triceps: 'push',
  forearm: 'pull',
  abs: 'core',
  obliques: 'core',
  'lower-back': 'core',
  gluteal: 'legs',
  quadriceps: 'legs',
  hamstring: 'legs',
  adductors: 'legs',
  'hip-flexors': 'legs',
  calves: 'legs',
  tibialis: 'legs',
}

export const ANTAGONIST_PAIRS: Array<{
  left: MuscleSlug
  right: MuscleSlug
  label: string
}> = [
  { left: 'chest', right: 'upper-back', label: 'سینه / پشت' },
  { left: 'biceps', right: 'triceps', label: 'جلو بازو / پشت بازو' },
  { left: 'quadriceps', right: 'hamstring', label: 'چهارسر / همسترینگ' },
  { left: 'abs', right: 'lower-back', label: 'شکم / کمر' },
  { left: 'gluteal', right: 'hip-flexors', label: 'باسن / خم‌کننده لگن' },
]

export type BalanceStatus = 'none' | 'balanced' | 'mild' | 'imbalanced'

export const BALANCE_STATUS: Record<
  BalanceStatus,
  { label: string; className: string; bar: string }
> = {
  none: { label: 'بدون داده', className: 'text-muted-foreground', bar: 'bg-muted-foreground/30' },
  balanced: { label: 'متعادل', className: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
  mild: { label: 'کمی نامتعادل', className: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
  imbalanced: { label: 'نامتعادل', className: 'text-red-600 dark:text-red-400', bar: 'bg-red-500' },
}

export const setsOf = (use?: MuscleUse) => (use?.primarySets ?? 0) + (use?.secondarySets ?? 0)

export interface PairBalance {
  label: string
  left: { slug: MuscleSlug; sets: number }
  right: { slug: MuscleSlug; sets: number }
  /** The smaller side as a percentage of the larger one: 100 is even, 0 is one-sided. */
  ratio: number
  status: BalanceStatus
}

export function pairBalances(perMuscle: Partial<Record<MuscleSlug, MuscleUse>>): PairBalance[] {
  return ANTAGONIST_PAIRS.map(({ left, right, label }) => {
    const leftSets = setsOf(perMuscle[left])
    const rightSets = setsOf(perMuscle[right])
    const max = Math.max(leftSets, rightSets)
    const ratio = max === 0 ? 0 : Math.round((Math.min(leftSets, rightSets) / max) * 100)

    const status: BalanceStatus =
      max === 0 ? 'none' : ratio >= 80 ? 'balanced' : ratio >= 60 ? 'mild' : 'imbalanced'

    return { label, left: { slug: left, sets: leftSets }, right: { slug: right, sets: rightSets }, ratio, status }
  })
}

export interface GroupWeek {
  group: BalanceGroup
  weekly: number[]
}

/** Folds the per-muscle weekly series into the four movement groups. */
export function groupWeekly(
  weeklyPerMuscle: Partial<Record<MuscleSlug, number[]>> | null | undefined,
): Record<BalanceGroup, number[]> {
  const groups: Record<BalanceGroup, number[]> = { push: [], pull: [], legs: [], core: [] }

  for (const [slug, group] of Object.entries(MUSCLE_GROUP) as Array<[MuscleSlug, BalanceGroup]>) {
    const series = weeklyPerMuscle?.[slug] ?? []

    series.forEach((value, index) => {
      groups[group][index] = (groups[group][index] ?? 0) + value
    })
  }

  return groups
}

/** 100 means the two sides are equal; 0 means only one side was trained. */
export function ratioPercent(a: number, b: number): number {
  const max = Math.max(a, b)

  return max === 0 ? 0 : Math.round((Math.min(a, b) / max) * 100)
}

/** Compares the latest `window` weeks with the `window` weeks before them. */
export function windowTrend(
  series: number[],
  window = 4,
): { recent: number; previous: number; changePct: number } {
  const recent = series.slice(-window).reduce((sum, value) => sum + value, 0)
  const previous = series
    .slice(Math.max(0, series.length - window * 2), Math.max(0, series.length - window))
    .reduce((sum, value) => sum + value, 0)

  return {
    recent,
    previous,
    changePct: previous === 0 ? (recent > 0 ? 100 : 0) : Math.round(((recent - previous) / previous) * 100),
  }
}

export function groupVolumes(perMuscle: Partial<Record<MuscleSlug, MuscleUse>>) {
  const totals: Record<BalanceGroup, number> = { push: 0, pull: 0, legs: 0, core: 0 }

  for (const [slug, group] of Object.entries(MUSCLE_GROUP) as Array<[MuscleSlug, BalanceGroup]>) {
    totals[group] += setsOf(perMuscle[slug])
  }

  const sum = totals.push + totals.pull + totals.legs + totals.core

  return (Object.keys(totals) as BalanceGroup[]).map((group) => ({
    group,
    sets: totals[group],
    share: sum === 0 ? 0 : Math.round((totals[group] / sum) * 100),
  }))
}
