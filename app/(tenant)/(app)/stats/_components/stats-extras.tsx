'use client'

import { ChevronLeft, Flame, Gauge, Timer } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { getMeasurementSummary } from '@/app/(tenant)/_api/training-api'
import { InsightEmpty, InsightSection } from '@/app/(tenant)/_components/insight/insight-shell'
import { MUSCLE_LABEL } from '@/app/(tenant)/_model/muscle-labels'
import type { WorkoutMuscleStats } from '@/app/(tenant)/_model/muscle-balance'
import type { SessionResponse } from '@/app/(tenant)/_model/workout.types'
import { useFigureGender } from '@/hooks/use-figure-gender'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')
const fa1 = (value: number) => value.toLocaleString('fa-IR', { maximumFractionDigits: 1 })

/** Working sets only — a warm-up is not an effort set and skews every average here. */
const workSets = (session: SessionResponse) =>
  (session.exercises ?? []).flatMap((exercise) =>
    (exercise.sets ?? []).filter((set) => !set.isWarmup),
  )

/** Tick timestamps in order; a session is timed from its first tick to its last. */
function tickTimes(sets: Array<{ completedAt?: string | null }>): number[] {
  return sets
    .map((set) => (set.completedAt ? new Date(set.completedAt).getTime() : NaN))
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => a - b)
}

const minutesBetween = (times: number[]) =>
  times.length >= 2 ? (times[times.length - 1] - times[0]) / 60_000 : null

/** Epley with effective reps, matching the backend's e1RM so the numbers agree. */
const e1Rm = (weightKg: number, reps: number, rir?: number | null) =>
  weightKg * (1 + (reps + (rir ?? 0)) / 30)

/** The classic strength standards, as multiples of body weight. */
const LIFTS: Array<{
  key: string
  label: string
  test: RegExp
  male: number[]
  female: number[]
}> = [
  {
    key: 'bench',
    label: 'پرس سینه',
    test: /پرس ?سینه|پرس ?سينه|bench/i,
    male: [0.5, 0.75, 1, 1.25, 1.5],
    female: [0.25, 0.5, 0.65, 0.9, 1.1],
  },
  {
    key: 'squat',
    label: 'اسکوات',
    test: /اسکوات|اسکات|squat/i,
    male: [0.75, 1, 1.25, 1.75, 2.25],
    female: [0.5, 0.75, 1, 1.25, 1.75],
  },
  {
    key: 'deadlift',
    label: 'ددلیفت',
    test: /ددلیفت|deadlift/i,
    male: [1, 1.25, 1.75, 2.25, 2.75],
    female: [0.75, 1, 1.25, 1.5, 2],
  },
  {
    key: 'press',
    label: 'پرس سرشانه',
    test: /پرس ?سرشانه|پرس ?نظامی|overhead press|shoulder press|military press/i,
    male: [0.35, 0.5, 0.65, 0.8, 1],
    female: [0.2, 0.35, 0.45, 0.6, 0.75],
  },
  {
    key: 'row',
    label: 'زیربغل قایقی',
    test: /زیر ?بغل|قایقی|barbell row|seated row|\brow\b/i,
    male: [0.5, 0.75, 1, 1.25, 1.5],
    female: [0.35, 0.5, 0.65, 0.8, 1],
  },
]

const LEVEL_LABEL = ['مبتدی', 'تازه‌کار', 'متوسط', 'پیشرفته', 'نخبه']

export function StatsExtras({
  sessions,
  stats,
  loading,
}: {
  sessions: SessionResponse[]
  stats: WorkoutMuscleStats
  loading: boolean
}) {
  const gender = useFigureGender()
  const [bodyWeightKg, setBodyWeightKg] = useState<number | null>(null)
  const [weightDate, setWeightDate] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    void getMeasurementSummary()
      .then((summary) => {
        if (!alive) return
        setBodyWeightKg(summary.weightKg?.latest ?? null)
        setWeightDate(summary.weightKg?.latestDate ?? null)
      })
      .catch(() => {
        /* No measurements yet: the strength section shows its own prompt. */
      })

    return () => {
      alive = false
    }
  }, [])

  /** Muscle chart: effective sets per muscle, longest bar first. */
  const muscleRows = useMemo(() => {
    const rows = Object.entries(stats.perMuscle ?? {}).map(([slug, entry]) => ({
      slug,
      label: MUSCLE_LABEL[slug] ?? slug,
      sets: (entry?.primarySets ?? 0) + (entry?.secondarySets ?? 0),
      volumeKg: entry?.volumeKg ?? 0,
    }))

    rows.sort((a, b) => b.sets - a.sets)

    return rows.filter((row) => row.sets > 0).slice(0, 10)
  }, [stats.perMuscle])

  /** Effort: RIR is reported, RPE is converted, everything else stays unknown. */
  const effort = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0] // ۰–۱، ۲، ۳، ۴، ۵+
    let reported = 0
    let estimated = 0
    let unknown = 0
    let hard = 0
    let sum = 0

    for (const session of sessions) {
      for (const set of workSets(session)) {
        const rir = set.rir ?? (set.rpe != null ? 10 - set.rpe : null)

        if (rir == null) {
          unknown += 1
          continue
        }

        if (set.rir == null) estimated += 1
        else reported += 1

        const clamped = Math.max(0, Math.min(5, Math.round(rir)))
        buckets[clamped <= 1 ? 0 : clamped - 1] += 1
        sum += Math.max(0, Math.min(100, (10 - rir) * 10))
        if (rir <= 1) hard += 1
      }
    }

    const measured = reported + estimated

    return {
      buckets,
      reported,
      estimated,
      unknown,
      measured,
      hard,
      average: measured > 0 ? sum / measured : 0,
      hardShare: measured > 0 ? (hard / measured) * 100 : 0,
    }
  }, [sessions])

  /** Time: session length from the first ticked set to the last, and per exercise. */
  const time = useMemo(() => {
    const sessionMinutes = sessions
      .map((session) => minutesBetween(tickTimes(workSets(session))))
      .filter((value): value is number => value !== null && value > 0)

    const perExercise = new Map<string, { total: number; count: number }>()

    for (const session of sessions) {
      for (const exercise of session.exercises ?? []) {
        const name = exercise.exerciseName?.trim()
        if (!name) continue

        const span = minutesBetween(
          tickTimes((exercise.sets ?? []).filter((set) => !set.isWarmup)),
        )
        if (span === null || span <= 0) continue

        const row = perExercise.get(name) ?? { total: 0, count: 0 }
        row.total += span
        row.count += 1
        perExercise.set(name, row)
      }
    }

    return {
      averageSession:
        sessionMinutes.length > 0
          ? sessionMinutes.reduce((sum, value) => sum + value, 0) / sessionMinutes.length
          : null,
      sessions: sessionMinutes.length,
      exercises: [...perExercise.entries()]
        .map(([name, row]) => ({ name, average: row.total / row.count, count: row.count }))
        .sort((a, b) => b.average - a.average)
        .slice(0, 6),
    }
  }, [sessions])

  /** Strength levels: best e1RM per main lift against body weight. */
  const strength = useMemo(() => {
    const best = new Map<string, number>()

    for (const session of sessions) {
      for (const exercise of session.exercises ?? []) {
        const name = exercise.exerciseName?.trim()
        if (!name) continue

        const lift = LIFTS.find((item) => item.test.test(name))
        if (!lift) continue

        for (const set of exercise.sets ?? []) {
          if (set.isWarmup || set.weightKg <= 0 || set.reps <= 0) continue
          const value = e1Rm(set.weightKg, set.reps, set.rir)
          if (value > (best.get(lift.key) ?? 0)) best.set(lift.key, value)
        }
      }
    }

    return LIFTS.map((lift) => {
      const oneRm = best.get(lift.key) ?? null
      const thresholds = gender === 'female' ? lift.female : lift.male
      const ratio = oneRm && bodyWeightKg ? oneRm / bodyWeightKg : null
      const level =
        ratio === null
          ? null
          : Math.max(0, thresholds.filter((threshold) => ratio >= threshold).length - 1)

      return { ...lift, oneRm, ratio, level }
    }).filter((row) => row.oneRm !== null)
  }, [sessions, bodyWeightKg, gender])

  const maxMuscleSets = Math.max(1, ...muscleRows.map((row) => row.sets))
  const maxBucket = Math.max(1, ...effort.buckets)

  return (
    <div className="space-y-4">
      <InsightSection
        title="نقشه عضلات"
        description="ست‌های مؤثر هر عضله در بازه؛ میله بلندتر یعنی بار بیشتر روی آن عضله."
      >
        {muscleRows.length === 0 ? (
          <InsightEmpty message="در این بازه ستی به عضله‌ای نسبت داده نشده است." />
        ) : (
          <ul className="space-y-2.5">
            {muscleRows.map((row) => (
              <li key={row.slug}>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="font-semibold">{row.label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {fa(row.sets)} ست · {fa(Math.round(row.volumeKg))} kg
                  </span>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${(row.sets / maxMuscleSets) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </InsightSection>

      <InsightSection
        title="سطح قدرت"
        description="بهترین تخمین ۱RM هر حرکت اصلی در همین بازه، نسبت به وزن بدن؛ مرزها تقریبی‌اند."
      >
        {strength.length === 0 ? (
          <InsightEmpty message="هنوز ست سنگینی از حرکات اصلی (پرس سینه، اسکوات، ددلیفت، پرس سرشانه، زیربغل) ثبت نشده است." />
        ) : bodyWeightKg === null ? (
          <div className="text-muted-foreground flex flex-col items-start gap-2 text-xs leading-6">
            <p>برای محاسبه سطح قدرت، اول وزن بدن را ثبت کن؛ مرزها نسبت به وزن بدن سنجیده می‌شوند.</p>
            <Link
              href="/measurements"
              className="text-primary inline-flex items-center gap-1 font-semibold"
            >
              ثبت وزن در اندازه‌گیری‌ها
              <ChevronLeft className="size-3.5" />
            </Link>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground mb-3 text-[11px] tabular-nums">
              وزن بدن {fa1(bodyWeightKg)} کیلوگرم
              {weightDate
                ? ` · آخرین اندازه‌گیری ${new Date(`${weightDate}T12:00:00`).toLocaleDateString('fa-IR')}`
                : ''}
            </p>
            <ul className="space-y-3">
              {strength.map((row) => (
                <li key={row.key} className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{row.label}</p>
                    <p className="text-muted-foreground text-[11px] tabular-nums">
                      ۱RM {fa(Math.round(row.oneRm ?? 0))} kg
                      {row.ratio !== null ? ` · ${fa1(row.ratio)}× وزن بدن` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold">
                      {row.level === null ? '—' : LEVEL_LABEL[row.level]}
                    </span>
                    <span className="flex gap-1" aria-hidden>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <span
                          key={index}
                          className={`h-1.5 w-4 rounded-full ${
                            row.level !== null && index <= row.level ? 'bg-primary' : 'bg-muted'
                          }`}
                        />
                      ))}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </InsightSection>

      <InsightSection
        title="شدت تلاش"
        description="هر ست چقدر به ناتوانی نزدیک بوده؛ از RIR ثبت‌شده، یا تخمین از RPE."
      >
        {effort.measured === 0 ? (
          <InsightEmpty message="هنوز ست کاری با RIR یا RPE ثبت نشده است؛ می‌توانی از انتخابگر شدت در فرم ست استفاده کنی." />
        ) : (
          <>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {[
                { label: 'میانگین شدت', value: `${fa(Math.round(effort.average))}٪` },
                { label: 'ست نزدیک ناتوانی', value: `${fa(Math.round(effort.hardShare))}٪` },
                { label: 'ست‌های سنجیده‌شده', value: fa(effort.measured) },
              ].map((item) => (
                <div key={item.label} className="bg-muted/40 rounded-xl px-2.5 py-2">
                  <p className="text-muted-foreground flex items-center gap-1 text-[10px]">
                    <Gauge className="size-3" aria-hidden />
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold tabular-nums">{item.value}</p>
                </div>
              ))}
            </div>

            <ul className="space-y-2">
              {['RIR ۰–۱', 'RIR ۲', 'RIR ۳', 'RIR ۴', 'RIR ۵+'].map((label, index) => (
                <li key={label}>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span>{label}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {fa(effort.buckets[index])}
                    </span>
                  </div>
                  <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                    <div
                      className={index === 0 ? 'bg-primary h-full rounded-full' : 'bg-primary/40 h-full rounded-full'}
                      style={{ width: `${(effort.buckets[index] / maxBucket) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <p className="text-muted-foreground mt-3 flex items-start gap-1.5 text-[11px] leading-5">
              <Flame className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {fa(effort.reported)} ست از RIR · {fa(effort.estimated)} ست تخمینی از RPE
              {effort.unknown > 0 ? ` · ${fa(effort.unknown)} ست بدون داده` : ''}
            </p>
          </>
        )}
      </InsightSection>

      <InsightSection
        title="زمان هر حرکت"
        description="از اولین ست تیک‌خورده تا آخرین ست همان حرکت؛ میانگین زمان جلسه هم به همین شکل سنجیده می‌شود."
      >
        {time.exercises.length === 0 && time.averageSession === null ? (
          <InsightEmpty message={loading ? 'در حال محاسبه…' : 'هنوز جلسه‌ای با حداقل دو ست تیک‌خورده وجود ندارد.'} />
        ) : (
          <>
            <p className="text-muted-foreground mb-3 flex items-center gap-1.5 text-[11px] tabular-nums">
              <Timer className="size-3.5" aria-hidden />
              میانگین زمان جلسه{' '}
              {time.averageSession === null ? '—' : `${fa(Math.round(time.averageSession))} دقیقه`}
              {time.sessions > 0 ? ` · از ${fa(time.sessions)} جلسه` : ''}
            </p>

            {time.exercises.length > 0 && (
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b text-[11px]">
                    <th className="pb-2 font-medium">حرکت</th>
                    <th className="pb-2 font-medium">میانگین</th>
                    <th className="pb-2 font-medium">جلسه‌ها</th>
                  </tr>
                </thead>
                <tbody>
                  {time.exercises.map((row) => (
                    <tr key={row.name} className="border-b last:border-0">
                      <td className="max-w-40 truncate py-2 font-semibold">{row.name}</td>
                      <td className="py-2 tabular-nums">{fa(Math.round(row.average))} دقیقه</td>
                      <td className="text-muted-foreground py-2 tabular-nums">{fa(row.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </InsightSection>
    </div>
  )
}
