
import type { ExerciseListItem } from '@/app/(tenant)/(console)/exercises/_model/exercise.types'
import type {
  SessionExerciseItem,
  SessionResponse,
} from '@/app/(tenant)/_model/workout.types'
import { MUSCLES, type MuscleSlug } from '@/lib/muscles'

/**
 * Maps exercise metadata (target / bodyPart / category / equipment / name) onto
 * the body-map muscle slugs. Every alias is checked against the lower-cased
 * concatenation of the fields; the first matching alias wins, with longer
 * aliases checked first so 'upper back' matches before 'back'.
 */
export const MUSCLE_ALIASES: Partial<Record<MuscleSlug, string[]>> = {
  trapezius: ['trapezius', 'traps', 'neck muscle', 'upper-back trap'],
  deltoids: ['shoulder', 'deltoid'],
  chest: ['chest', 'pectoral', 'pec '],
  'upper-back': ['upper back', 'lats', 'latissimus', 'rhomboid', 'middle back', 'rear delt'],
  serratus: ['serratus'],
  biceps: ['biceps', 'upper arms'],
  triceps: ['triceps', 'upper arms'],
  forearm: ['forearm', 'lower arms', 'wrist', 'grip'],
  abs: ['abs', 'abdominals', 'waist', 'core'],
  obliques: ['obliques', 'side abs'],
  'lower-back': ['lower back', 'erector spinae', 'trunk'],
  gluteal: ['glutes', 'gluteal', 'hip'],
  quadriceps: ['quadriceps', 'quads', 'upper legs', 'thighs'],
  hamstring: ['hamstrings', 'hamstring', 'upper legs', 'thighs'],
  adductors: ['adductors', 'inner thighs', 'groin'],
  'hip-flexors': ['hip flexors', 'hip-flexors'],
  calves: ['calves', 'lower legs'],
  tibialis: ['tibialis', 'shins'],
}

/** Persian aliases users may see, matched the same way. */
const PERSIAN_HINTS: Partial<Record<MuscleSlug, string[]>> = {
  trapezius: ['ذوزنقه'],
  deltoids: ['سرشانه'],
  chest: ['سینه'],
  'upper-back': ['پشت'],
  biceps: ['جلو بازو', 'بازو'],
  triceps: ['پشت بازو'],
  forearm: ['ساعد'],
  abs: ['شکم'],
  obliques: ['مورب'],
  'lower-back': ['کمر'],
  gluteal: ['باسن'],
  quadriceps: ['چهارسر', 'ران'],
  hamstring: ['همسترینگ'],
  adductors: ['داخل ران'],
  'hip-flexors': ['خم‌کننده'],
  calves: ['ساق'],
  tibialis: ['جلوی ساق'],
}

const WEIGHT_PRIMARY = 1
const WEIGHT_SECONDARY = 0.5

/** How strongly one exercise trains each mapped muscle. */
export type MuscleWeightMap = Partial<Record<MuscleSlug, number>>

export function exerciseMuscleWeights(
  exercise: ExerciseListItem | null | undefined,
): MuscleWeightMap {
  if (!exercise) return {}
  const haystack = [
    exercise.target,
    exercise.bodyPart,
    exercise.category,
    exercise.name,
    exercise.exerciseType,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const out: MuscleWeightMap = {}
  for (const slug of MUSCLES) {
    const aliases = [
      ...(MUSCLE_ALIASES[slug] ?? []),
      ...(PERSIAN_HINTS[slug] ?? []),
    ].sort((a, b) => b.length - a.length)
    if (aliases.some((alias) => haystack.includes(alias))) {
      out[slug] = WEIGHT_PRIMARY
      continue
    }
    // Generic words ('upper legs', 'back') lightly credit the related groups
    // above, so e.g. a Low row keeps some signal even when target is vague.
    if (
      (haystack.includes('upper legs') || haystack.includes('back')) &&
      (slug === 'hamstring' || slug === 'adductors' || slug === 'gluteal') &&
      haystack.includes('upper legs')
    ) {
      out[slug] = out[slug] ?? WEIGHT_SECONDARY
    }
  }
  return out
}

/** Per-muscle accumulated data from realized (completed) sessions. */
export interface MuscleUse {
  /** Sets credited at full weight (primary). */
  primarySets: number
  /** Sets credited at half weight (secondary / weak hints). */
  secondarySets: number
  volumeKg: number
  /** Distinct sessions that trained this muscle. */
  sessions: number
  /** ISO timestamp of the most recent set for this muscle. */
  lastWorkedAt?: string
}

export interface WorkoutMuscleStats {
  perMuscle: Record<MuscleSlug, MuscleUse>
  totals: { sessions: number; sets: number; volumeKg: number }
  /** Exercise ids found in sessions that had no resolvable metadata. */
  unmatchedExerciseIds: string[]
  /** Sets per muscle for the last 12 weeks, oldest first. */
  weeklyPerMuscle: Record<MuscleSlug, number[]>
  /** ISO date of each week's Saturday, matching `weeklyPerMuscle` positions. */
  weekStarts: string[]
}

const HISTORY_WEEKS = 12

/** Saturday, the first day of the week in the member app. */
function weekStartOf(iso: string): string {
  const date = new Date(`${iso}T12:00:00`)

  date.setDate(date.getDate() - ((date.getDay() + 1) % 7))

  return date.toISOString().slice(0, 10)
}

const dayOf = (session: SessionResponse) =>
  (session.startedAt ?? session.completedAt ?? '').slice(0, 10)

const emptyUse = (): MuscleUse => ({
  primarySets: 0,
  secondarySets: 0,
  volumeKg: 0,
  sessions: 0,
})

function workedTimestamp(exercise: SessionExerciseItem, session: SessionResponse): string | undefined {
  const stamps = (exercise.sets ?? [])
    .map((s) => s.completedAt ?? '')
    .filter(Boolean)
  if (stamps.length) return stamps.sort().at(-1)
  return session.completedAt ?? session.startedAt
}

export function buildMuscleStats(
  sessions: SessionResponse[],
  metadata: Map<string, ExerciseListItem | null>,
): WorkoutMuscleStats {
  const perMuscle = Object.fromEntries(
    MUSCLES.map((slug) => [slug, emptyUse()]),
  ) as Record<MuscleSlug, MuscleUse>
  const totals = { sessions: 0, sets: 0, volumeKg: 0 }
  const unmatchedExerciseIds: string[] = []
  const unmatchedSeen = new Set<string>()
  const touched = new Map<MuscleSlug, string>() // slug -> latest iso

  const weeklyPerMuscle = Object.fromEntries(
    MUSCLES.map((slug) => [slug, Array<number>(HISTORY_WEEKS).fill(0)]),
  ) as Record<MuscleSlug, number[]>

  const days = sessions.map(dayOf).filter(Boolean).sort()
  const anchor = days.at(-1)
  const weekStarts: string[] = []

  if (anchor) {
    const newestWeek = weekStartOf(anchor)

    for (let index = HISTORY_WEEKS - 1; index >= 0; index -= 1) {
      const date = new Date(`${newestWeek}T12:00:00`)

      date.setDate(date.getDate() - index * 7)
      weekStarts.push(date.toISOString().slice(0, 10))
    }
  }

  for (const session of sessions) {
    const attrs = (session.exercises ?? []).filter((ex) => (ex.sets ?? []).length > 0)
    if (!attrs.length) continue
    totals.sessions += 1

    const sessionTouched = new Set<MuscleSlug>()
    for (const exercise of attrs) {
      const weights = exerciseMuscleWeights(metadata.get(exercise.exerciseId))
      if (!Object.keys(weights).length) {
        if (!unmatchedSeen.has(exercise.exerciseId)) {
          unmatchedSeen.add(exercise.exerciseId)
          unmatchedExerciseIds.push(exercise.exerciseId)
        }
      }

      const stamps = workedTimestamp(exercise, session)
      const sessionSets = exercise.sets.length
      const sessionVolume = exercise.sets.reduce(
        (sum, set) => sum + (set.reps || 0) * (set.weightKg || 0),
        0,
      )

      const credited: Partial<Record<MuscleSlug, number>> = {}
      for (const [slug, weight] of Object.entries(weights) as Array<[MuscleSlug, number]>) {
        credited[slug] = Math.max(credited[slug] ?? 0, weight)
      }
      const sessionWeek = weekStartOf(dayOf(session))
      const weekIndex = weekStarts.indexOf(sessionWeek)

      for (const [slug, weight] of Object.entries(credited) as Array<[MuscleSlug, number]>) {
        const use = perMuscle[slug]
        if (weight >= WEIGHT_PRIMARY) use.primarySets += sessionSets
        else use.secondarySets += sessionSets
        use.volumeKg += sessionVolume
        sessionTouched.add(slug)

        if (weekIndex >= 0) weeklyPerMuscle[slug][weekIndex] += sessionSets
        const last = touched.get(slug)
        if (stamps && (!last || stamps > last)) touched.set(slug, stamps)
      }

      totals.sets += sessionSets
      totals.volumeKg += sessionVolume
    }
    for (const slug of sessionTouched) perMuscle[slug].sessions += 1
  }

  for (const slug of MUSCLES) {
    perMuscle[slug] = { ...perMuscle[slug], lastWorkedAt: touched.get(slug) }
  }

  return { perMuscle, totals, unmatchedExerciseIds, weeklyPerMuscle, weekStarts }
}

/* --------------------------- recovery model --------------------------- */

export interface RecoveryInfo {
  /** true when the muscle appears in the loaded history but has no data. */
  known: boolean
  /** Hours since the last session that trained this muscle (undefined if never in range). */
  sinceHours?: number
  /** 0..100 — how much of the needed rest time has elapsed. */
  pct: number
}

const MIN_RECOVERY_HOURS = 36
const MAX_RECOVERY_HOURS = 72

/** Percentage recovered, from the time since the last session and its volume. */
export function computeRecovery(use: MuscleUse | undefined, nowMs: number): RecoveryInfo {
  if (!use || use.primarySets + use.secondarySets === 0) {
    return { known: Boolean(use), pct: 100 } // never trained in range → fully fresh
  }
  const last = use.lastWorkedAt ? new Date(use.lastWorkedAt).getTime() : undefined
  if (!last) return { known: true, pct: 100 }
  const sinceHours = Math.max(0, (nowMs - last) / 3_600_000)
  // More weighted sets → longer recovery requirement.
  const needed = MIN_RECOVERY_HOURS + Math.min(
    MAX_RECOVERY_HOURS - MIN_RECOVERY_HOURS,
    (use.primarySets * 1.5 + use.secondarySets * 0.75) / Math.max(1, use.sessions),
  )
  const pct = Math.max(0, Math.min(100, (sinceHours / needed) * 100))
  return { known: true, sinceHours, pct }
}

/** Levels 0-4 for the trained/load map: 0 none, brighter = more trained. */

export function loadLevels(
    perMuscle: Partial<Record<MuscleSlug, MuscleUse>> | null | undefined,
): Record<string, number> {
  const load: Record<string, number> = {}

  for (const slug of MUSCLES) {
    const use = perMuscle?.[slug]

    load[slug] = (use?.primarySets ?? 0) + (use?.secondarySets ?? 0)
  }

  const max = Math.max(0, ...Object.values(load))
  const out: Record<string, number> = {}

  for (const slug of MUSCLES) {
    const value = load[slug]

    out[slug] =
        value === 0 || max === 0
            ? 0
            : Math.max(1, Math.min(4, Math.ceil((value / max) * 4)))
  }

  return out
}

/**
 * Levels for the recovery map:
 * l0  = trained very recently, not enough recovery (red, urgent)
 * l1- = low recovery, coming back (light red)
 * l2+ = recovered/blue: brighter blue = more recovered.
 */
export function recoveryLevels(
  perMuscle: Record<MuscleSlug, MuscleUse>,
  nowMs: number,
): { levels: Record<string, number>; pcts: Record<string, RecoveryInfo> } {
  const levels: Record<string, number> = {}
  const pcts: Record<string, RecoveryInfo> = {}
  for (const slug of MUSCLES) {
    // The hook starts from an empty map, so a panel can render before the first session
    // arrives; a missing entry is "not trained", not a crash.
    const use = perMuscle[slug] as MuscleUse | undefined
    const info = computeRecovery(use, nowMs)
    pcts[slug] = info
    const urgentlyLow = info.pct < 30 && (use?.primarySets ?? 0) + (use?.secondarySets ?? 0) > 0
    levels[slug] = info.pct >= 90
      ? 4
      : info.pct >= 75
        ? 3
        : info.pct >= 55
          ? 2
          : info.pct >= 30
            ? 1
            : urgentlyLow
              ? 0
              : 1 // low recovery but never far-trained: light red, not urgent
  }
  return { levels, pcts }
}

/* --------------------------- coach report --------------------------- */

export interface CoachRow {
  slug: MuscleSlug
  primarySets: number
  secondarySets: number
  volumeKg: number
  lastWorkedAt?: string
  recoveryPct: number
  suggestion: 'ok' | 'add-here' | 'ease-off' | 'needs-rest'
}

export function coachRows(
  perMuscle: Record<MuscleSlug, MuscleUse>,
  nowMs: number,
): CoachRow[] {
  const load: Record<string, number> = {}
  for (const slug of MUSCLES) {
    load[slug] = perMuscle[slug].primarySets + perMuscle[slug].secondarySets
  }
  const max = Math.max(0, ...MUSCLES.map((m) => load[m]))
  const average = load[MUSCLES[0]] === undefined ? 0 : max / 2
  void average

  return MUSCLES.map((slug): CoachRow => {
    const use = perMuscle[slug]
    const sets = use.primarySets + use.secondarySets
    const info = computeRecovery(use, nowMs)
    let suggestion: CoachRow['suggestion'] = 'ok'
    if (max > 0 && sets === 0) suggestion = 'add-here'
    else if (info.pct < 30) suggestion = 'needs-rest'
    else if (max > 0 && sets > 0 && sets >= max * 0.75 && info.pct < 55) suggestion = 'ease-off'
    return {
      slug,
      primarySets: use.primarySets,
      secondarySets: use.secondarySets,
      volumeKg: use.volumeKg,
      lastWorkedAt: use.lastWorkedAt,
      recoveryPct: info.pct,
      suggestion,
    }
  })
}
