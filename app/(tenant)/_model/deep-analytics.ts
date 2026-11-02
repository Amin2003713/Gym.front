import type {
  SessionResponse,
  WorkoutListItem,
} from '@/app/(tenant)/_model/workout.types'

export interface WeeklyPoint {
  weekStart: string
  label: string
  volumeKg: number
  sets: number
  sessions: number
}

export interface RestBucket {
  label: string
  count: number
}

export interface ExerciseProgress {
  exerciseId: string
  name: string
  sets: number
  volumeKg: number
  bestE1Rm: number
  points: Array<{ date: string; e1Rm: number }>
}

export interface DeepAnalytics {
  weekly: WeeklyPoint[]
  rest: {
    buckets: RestBucket[]
    averageSeconds: number
    skippedShare: number
    measuredSets: number
  }
  prTimeline: Array<{ date: string; e1Rm: number; weightKg: number }>
  exercises: ExerciseProgress[]
  duration: Array<{ date: string; minutes: number }>
  totals: { sets: number; volumeKg: number; prs: number; sessions: number }
}

/** Epley with effective reps = reps + RIR (missing RIR counts as 0). */
export const e1Rm = (weightKg: number, reps: number, rir?: number | null) =>
  Math.round(weightKg * (1 + (reps + (rir ?? 0)) / 30) * 10) / 10

const isoDay = (value: string | null | undefined) =>
  value ? value.slice(0, 10) : null

/** Saturday, the first day of the week in the member app. */
export function weekStart(iso: string): string {
  const date = new Date(`${iso}T12:00:00`)
  const offset = (date.getDay() - 6 + 7) % 7

  date.setDate(date.getDate() - offset)

  return date.toISOString().slice(0, 10)
}

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(
    new Date(`${iso}T12:00:00`),
  )

const REST_BUCKETS: Array<{ label: string; max: number }> = [
  { label: 'کمتر از ۳۰ ثانیه', max: 30 },
  { label: '۳۰ تا ۶۰ ثانیه', max: 60 },
  { label: '۶۰ تا ۹۰ ثانیه', max: 90 },
  { label: '۹۰ تا ۱۲۰ ثانیه', max: 120 },
  { label: 'بیشتر از ۲ دقیقه', max: Number.POSITIVE_INFINITY },
]

/**
 * Everything the deeper stats screen shows, derived only from what the session loaders already
 * fetched: no extra request, and the same numbers every time for the same input.
 */
export function buildDeepAnalytics(
  sessions: SessionResponse[],
  listItems: WorkoutListItem[] = [],
  weeks = 8,
): DeepAnalytics {
  const ordered = [...sessions].sort((a, b) =>
    (a.startedAt ?? '').localeCompare(b.startedAt ?? ''),
  )

  const weekly = new Map<string, WeeklyPoint>()
  const restCounts = new Map<string, number>()
  let measuredRest = 0
  let restTotal = 0
  let skipped = 0

  const exerciseMap = new Map<string, ExerciseProgress>()
  const bestByExercise = new Map<string, number>()
  const prTimeline: DeepAnalytics['prTimeline'] = []

  let totalSets = 0
  let totalVolume = 0

  for (const session of ordered) {
    const day = isoDay(session.startedAt)

    if (!day) continue

    const week = weekStart(day)
    const bucket =
      weekly.get(week) ??
      ({
        weekStart: week,
        label: shortDate(week),
        volumeKg: 0,
        sets: 0,
        sessions: 0,
      } satisfies WeeklyPoint)

    bucket.sessions += 1

    for (const exercise of session.exercises ?? []) {
      const progress =
        exerciseMap.get(exercise.exerciseId) ??
        ({
          exerciseId: exercise.exerciseId,
          name: exercise.exerciseName ?? 'حرکت',
          sets: 0,
          volumeKg: 0,
          bestE1Rm: 0,
          points: [],
        } satisfies ExerciseProgress)

      let sessionBest = 0

      for (const set of exercise.sets ?? []) {
        if (set.isWarmup) continue

        const volume = set.reps * set.weightKg
        const estimate = e1Rm(set.weightKg, set.reps, set.rir)

        totalSets += 1
        totalVolume += volume
        bucket.sets += 1
        bucket.volumeKg += volume

        progress.sets += 1
        progress.volumeKg += volume
        sessionBest = Math.max(sessionBest, estimate)

        if (set.restSeconds != null && set.restSeconds > 0) {
          measuredRest += 1
          restTotal += set.restSeconds

          if (set.restSkipped) skipped += 1

          const bucketLabel =
            REST_BUCKETS.find((item) => set.restSeconds! <= item.max)?.label ??
            REST_BUCKETS[REST_BUCKETS.length - 1].label

          restCounts.set(bucketLabel, (restCounts.get(bucketLabel) ?? 0) + 1)
        }
      }

      if (sessionBest > 0) {
        progress.points.push({ date: day, e1Rm: sessionBest })

        const previousBest = bestByExercise.get(exercise.exerciseId) ?? 0

        if (sessionBest > previousBest) {
          bestByExercise.set(exercise.exerciseId, sessionBest)
          prTimeline.push({
            date: day,
            e1Rm: sessionBest,
            weightKg: Math.max(
              ...(exercise.sets ?? []).filter((s) => !s.isWarmup).map((s) => s.weightKg),
            ),
          })
        }
      }

      progress.bestE1Rm = Math.max(progress.bestE1Rm, sessionBest)
      exerciseMap.set(exercise.exerciseId, progress)
    }

    weekly.set(week, bucket)
  }

  const duration = listItems
    .filter((item) => item.startedAt && item.completedAt)
    .map((item) => {
      const minutes = Math.round(
        (new Date(item.completedAt as string).getTime() -
          new Date(item.startedAt as string).getTime()) /
          60000,
      )

      return { date: isoDay(item.startedAt) ?? '', minutes }
    })
    .filter((row) => row.date && row.minutes > 0)
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    weekly: [...weekly.values()]
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
      .slice(-weeks)
      .map((row) => ({ ...row, volumeKg: Math.round(row.volumeKg) })),
    rest: {
      buckets: REST_BUCKETS.map((item) => ({
        label: item.label,
        count: restCounts.get(item.label) ?? 0,
      })),
      averageSeconds: measuredRest ? Math.round(restTotal / measuredRest) : 0,
      skippedShare: measuredRest ? Math.round((skipped / measuredRest) * 100) : 0,
      measuredSets: measuredRest,
    },
    prTimeline: prTimeline.reverse().slice(0, 20),
    exercises: [...exerciseMap.values()]
      .filter((row) => row.sets > 0)
      .sort((a, b) => b.volumeKg - a.volumeKg)
      .slice(0, 12)
      .map((row) => ({ ...row, volumeKg: Math.round(row.volumeKg) })),
    duration,
    totals: {
      sets: totalSets,
      volumeKg: Math.round(totalVolume),
      prs: prTimeline.length,
      sessions: ordered.length,
    },
  }
}
