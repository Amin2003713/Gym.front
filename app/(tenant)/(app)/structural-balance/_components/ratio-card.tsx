'use client'

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

import { windowTrend } from '@/app/(tenant)/_model/structural-balance'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

export interface RatioCardProps {
  title: string
  leftLabel: string
  leftSets: number
  rightLabel: string
  rightSets: number
  ratio: number
  weakTrend: ReturnType<typeof windowTrend>
  weakerLabel: string
}

/** One balance ratio with the weaker side's four-week trend. */
export function RatioCard({
  title,
  leftLabel,
  leftSets,
  rightLabel,
  rightSets,
  ratio,
  weakTrend,
  weakerLabel,
}: RatioCardProps) {
  const balanced = ratio >= 80
  const mild = ratio >= 60 && ratio < 80
  const tone = balanced
    ? 'text-emerald-600 dark:text-emerald-400'
    : mild
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400'
  const bar = balanced ? 'bg-emerald-500' : mild ? 'bg-amber-500' : 'bg-red-500'
  const hasTrend = weakTrend.previous > 0 || weakTrend.recent > 0

  return (
    <div className="bg-muted/40 rounded-xl border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold">{title}</p>
        <span className={`text-sm font-extrabold tabular-nums ${tone}`}>
          {fa(ratio)}٪
        </span>
      </div>

      <div className="bg-background mt-2 h-2 overflow-hidden rounded-full">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(100, ratio)}%` }} />
      </div>

      <div className="text-muted-foreground mt-2 flex justify-between text-[11px] tabular-nums">
        <span>
          {leftLabel} · {fa(leftSets)} ست
        </span>
        <span>
          {rightLabel} · {fa(rightSets)} ست
        </span>
      </div>

      <p className="mt-2 flex items-center gap-1 text-[11px] leading-5">
        {!hasTrend ? (
          <span className="text-muted-foreground">برای روند، چهار هفته دیگر تمرین لازم است.</span>
        ) : weakTrend.changePct === 0 ? (
          <>
            <Minus className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
            <span className="text-muted-foreground">
              {weakerLabel} نسبت به چهار هفته قبل ثابت مانده است.
            </span>
          </>
        ) : weakTrend.changePct > 0 ? (
          <>
            <ArrowUpRight className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <span className="text-muted-foreground">
              {weakerLabel} {fa(weakTrend.changePct)}٪ نسبت به چهار هفته قبل بیشتر شده است.
            </span>
          </>
        ) : (
          <>
            <ArrowDownRight className="text-destructive size-3.5 shrink-0" aria-hidden />
            <span className="text-muted-foreground">
              {weakerLabel} {fa(Math.abs(weakTrend.changePct))}٪ نسبت به چهار هفته قبل کمتر شده است.
            </span>
          </>
        )}
      </p>
    </div>
  )
}
