import { MUSCLES, type MuscleSlug } from '@/lib/muscles'

import {
  PlanDayPhase,
  PlanDurationType,
  PlanExerciseType,
  PlanGoal,
  PlanLevel,
  PlanVisibility,
  type PlanDayDetail,
  type PlanDetail,
  type PlanExerciseDetail,
  type PlanExerciseInput,
  type PlanWriteRequest,
} from './plan.types'

/** Body-map muscles a coach can target on a day, in body order. */
export const TARGET_MUSCLES = MUSCLES

export type ExerciseDraft = {
  key: string
  exerciseId: string
  name: string
  /** Second movement of a superset. Empty for every other exercise type. */
  exerciseId2: string
  name2: string
  type: PlanExerciseType
  /** Warm-up, main or cool-down. The member performs warm-up first and cool-down last. */
  phase: PlanDayPhase
  sets: string
  repsMin: string
  repsMax: string
  rir: string
  durationSeconds: string
  restSeconds: string
  /** The coach's allowed weight window in the member's unit; empty = unbounded. */
  minWeightKg: string
  maxWeightKg: string
  notes: string
}

export type DayDraft = {
  key: string
  name: string
  muscles: MuscleSlug[]
  warmup: ExerciseDraft[]
  /** The main working exercises of the day. */
  exercises: ExerciseDraft[]
  cooldown: ExerciseDraft[]
}

export type PlanDraft = {
  title: string
  description: string
  visibility: PlanVisibility
  durationType: PlanDurationType
  totalSessions: string
  durationWeeks: string
  goal: PlanGoal
  level: PlanLevel
  assignedMemberUserId: string | null
  assignedMemberName: string | null
  days: DayDraft[]
}

const MAX_DAYS = 31
const MAX_DAYS_UI = 14
const MAX_SETS = 20
const MIN_SETS = 1
const MAX_RIR = 10
const MAX_REST_SECONDS = 600
const MIN_DURATION_SECONDS = 5
const MAX_DURATION_SECONDS = 3600

let sequence = 0
const nextKey = () => `draft-${++sequence}`

export const blankExercise = (phase: PlanDayPhase = PlanDayPhase.Main): ExerciseDraft => ({
  key: nextKey(),
  exerciseId: '',
  name: '',
  exerciseId2: '',
  name2: '',
  type: PlanExerciseType.Standard,
  phase,
  sets: '3',
  repsMin: '8',
  repsMax: '12',
  rir: '',
  durationSeconds: '45',
  restSeconds: '90',
  minWeightKg: '',
  maxWeightKg: '',
  notes: '',
})

export const blankDay = (index: number): DayDraft => ({
  key: nextKey(),
  name: `روز ${index + 1}`,
  muscles: [],
  warmup: [],
  exercises: [blankExercise(PlanDayPhase.Main)],
  cooldown: [],
})

export const blankDraft = (): PlanDraft => ({
  title: '',
  description: '',
  visibility: PlanVisibility.Private,
  durationType: PlanDurationType.Sessions,
  totalSessions: '12',
  durationWeeks: '4',
  goal: PlanGoal.BuildMuscle,
  level: PlanLevel.Beginner,
  assignedMemberUserId: null,
  assignedMemberName: null,
  days: [blankDay(0)],
})

/** The three sections of a day, in the order the member performs them. */
export const DAY_PHASES = [
  { phase: PlanDayPhase.Warmup, key: 'warmup', label: 'گرم‌کردن', hint: 'قبل از حرکات اصلی اجرا می‌شود.' },
  { phase: PlanDayPhase.Main, key: 'exercises', label: 'حرکات اصلی', hint: 'بخش اصلی تمرین روز.' },
  { phase: PlanDayPhase.Cooldown, key: 'cooldown', label: 'سردکردن', hint: 'بعد از حرکات اصلی اجرا می‌شود.' },
] as const

export type DayPhaseKey = (typeof DAY_PHASES)[number]['key']

/** One flat list (warm-up, main, cool-down) for the editor's active-exercise index. */
export const dayExercises = (day: DayDraft) => [...day.warmup, ...day.exercises, ...day.cooldown]

export const phaseLength = (day: DayDraft, phase: PlanDayPhase) =>
  phase === PlanDayPhase.Warmup
    ? day.warmup.length
    : phase === PlanDayPhase.Cooldown
      ? day.cooldown.length
      : day.exercises.length

/** Replaces one section's list without touching the other two. */
export const withPhaseExercises = (
  day: DayDraft,
  phase: PlanDayPhase,
  exercises: ExerciseDraft[],
): DayDraft =>
  phase === PlanDayPhase.Warmup
    ? { ...day, warmup: exercises }
    : phase === PlanDayPhase.Cooldown
      ? { ...day, cooldown: exercises }
      : { ...day, exercises }

/**
 * Re-key a draft restored from browser storage: the key sequence restarts on reload, so cached
 * keys can collide with the next blank day/exercise and break React list identity.
 */
export const withFreshKeys = (draft: PlanDraft): PlanDraft => ({
  ...draft,
  days: draft.days.map((day) => ({
    ...day,
    key: nextKey(),
    warmup: day.warmup.map((exercise) => ({ ...exercise, key: nextKey() })),
    exercises: day.exercises.map((exercise) => ({ ...exercise, key: nextKey() })),
    cooldown: day.cooldown.map((exercise) => ({ ...exercise, key: nextKey() })),
  })),
})

const numberOrNull = (value: string): number | null =>
  value.trim() === '' ? null : Number(value)

export const draftFromDetail = (detail: PlanDetail): PlanDraft => ({
  title: detail.title,
  description: detail.description ?? '',
  visibility: detail.visibility,
  durationType: detail.durationType,
  totalSessions: String(detail.totalSessions ?? 12),
  durationWeeks: String(detail.durationWeeks ?? 4),
  goal: detail.goal,
  level: detail.level,
  assignedMemberUserId: null,
  assignedMemberName: null,
  days: (detail.days.length ? detail.days : [])
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .map((day, index) => dayToDraft(day, index)),
})

const dayToDraft = (day: PlanDayDetail, index: number): DayDraft => {
  const phases = draftsFromSlots(day.exercises)

  return {
    key: nextKey(),
    name: day.name || `روز ${index + 1}`,
    muscles: (day.targetMuscleCodes ?? []).filter((code): code is MuscleSlug =>
      (MUSCLES as readonly string[]).includes(code),
    ),
    warmup: phases.warmup,
    exercises: phases.main.length ? phases.main : [blankExercise(PlanDayPhase.Main)],
    cooldown: phases.cooldown,
  }
}

/**
 * The API stores a superset as one slot per movement sharing a group number. The builder shows a
 * superset as ONE form, so two slots of the same group fold into a single draft here. Slots are
 * split by phase first, so a superset never spans a section.
 */
const draftsFromSlots = (slots: PlanExerciseDetail[]) => {
  const warmup: ExerciseDraft[] = []
  const main: ExerciseDraft[] = []
  const cooldown: ExerciseDraft[] = []

  const buckets = {
    [PlanDayPhase.Warmup]: warmup,
    [PlanDayPhase.Main]: main,
    [PlanDayPhase.Cooldown]: cooldown,
  }

  const supersets = new Map<string, ExerciseDraft>()

  for (const slot of [...slots].sort((a, b) => a.orderIndex - b.orderIndex)) {
    const phase = slot.phase ?? PlanDayPhase.Main
    const draft: ExerciseDraft = {
      key: nextKey(),
      exerciseId: slot.exerciseId,
      name: slot.exerciseName ?? '',
      exerciseId2: '',
      name2: '',
      type: slot.exerciseType ?? PlanExerciseType.Standard,
      phase,
      sets: String(slot.targetSets ?? 3),
      repsMin: slot.targetRepsMin == null ? '' : String(slot.targetRepsMin),
      repsMax: slot.targetRepsMax == null ? '' : String(slot.targetRepsMax),
      rir: slot.targetRir == null ? '' : String(slot.targetRir),
      durationSeconds: slot.targetDurationSeconds == null ? '45' : String(slot.targetDurationSeconds),
      restSeconds: String(slot.restSeconds ?? 90),
      minWeightKg: slot.minWeightKg == null ? '' : String(slot.minWeightKg),
      maxWeightKg: slot.maxWeightKg == null ? '' : String(slot.maxWeightKg),
      notes: slot.notes ?? '',
    }

    if (draft.type !== PlanExerciseType.Superset || slot.supersetGroup == null) {
      buckets[phase].push(draft)
      continue
    }

    const groupKey = `${phase}:${slot.supersetGroup}`
    const paired = supersets.get(groupKey)

    if (paired) {
      paired.exerciseId2 = draft.exerciseId
      paired.name2 = draft.name
      continue
    }

    supersets.set(groupKey, draft)
    buckets[phase].push(draft)
  }

  return { warmup, main, cooldown }
}

/** Validation mirrors the server validators; the server stays the source of truth. */
export const validateDetails = (
  draft: PlanDraft,
  /** Creating a private plan names its member; an existing plan already has its assignment. */
  requireAssignee = true,
): string | null => {
  if (!draft.title.trim()) return 'عنوان برنامه الزامی است.'

  const duration =
    draft.durationType === PlanDurationType.Sessions ? draft.totalSessions : draft.durationWeeks
  if (!Number(duration) || Number(duration) < 1) return 'مدت برنامه را وارد کنید.'

  // Privacy rule, mirrored by the domain and the server validator.
  if (requireAssignee && draft.visibility === PlanVisibility.Private && !draft.assignedMemberUserId)
    return 'برای برنامه خصوصی انتخاب شاگرد الزامی است.'

  if (draft.days.length > MAX_DAYS_UI || draft.days.length > MAX_DAYS)
    return 'تعداد روزهای برنامه بیش از حد مجاز است.'

  return null
}

export const validateDays = (draft: PlanDraft): string | null => {
  for (const [index, day] of draft.days.entries()) {
    if (!day.name.trim()) return `نام روز ${index + 1} الزامی است.`
  }

  // Target muscles are optional: a day can be planned without pinning it to a body-map group.

  return null
}

export const validateExercises = (draft: PlanDraft): string | null => {
  for (const day of draft.days) {
    const all = dayExercises(day)

    if (all.length === 0) return `برای روز «${day.name}» حداقل یک حرکت اضافه کنید.`

    for (const exercise of all) {
      const problem = validateExercise(exercise)
      if (problem) return `${day.name}: ${problem}`
    }
  }

  return null
}

const validateExercise = (exercise: ExerciseDraft): string | null => {
  if (!exercise.exerciseId) return 'یک حرکت انتخاب کنید.'

  const sets = Number(exercise.sets)
  if (!Number.isInteger(sets) || sets < MIN_SETS || sets > MAX_SETS)
    return 'تعداد ست باید بین ۱ تا ۲۰ باشد.'

  const rest = Number(exercise.restSeconds)
  if (!Number.isFinite(rest) || rest < 0 || rest > MAX_REST_SECONDS)
    return 'استراحت باید بین ۰ تا ۶۰۰ ثانیه باشد.'

  if (exercise.type === PlanExerciseType.Timed) {
    const duration = Number(exercise.durationSeconds)
    if (
      !Number.isFinite(duration) ||
      duration < MIN_DURATION_SECONDS ||
      duration > MAX_DURATION_SECONDS
    )
      return 'مدت حرکت زمان‌دار باید بین ۵ تا ۳۶۰۰ ثانیه باشد.'
    return null
  }

  if (Number(exercise.rir) > MAX_RIR || Number(exercise.rir) < 0)
    return 'RIR باید بین ۰ تا ۱۰ باشد.'

  if (exercise.type === PlanExerciseType.Superset) {
    if (!exercise.exerciseId2) return 'حرکت دوم سوپرست را انتخاب کنید.'
    if (exercise.exerciseId2 === exercise.exerciseId)
      return 'دو حرکت سوپرست باید متفاوت باشند.'
    if (!exercise.repsMin.trim() || !exercise.repsMax.trim())
      return 'حرکت سوپرست به بازه تکرار نیاز دارد.'
  }

  if (exercise.repsMin && exercise.repsMax && Number(exercise.repsMin) > Number(exercise.repsMax))
    return 'حداقل تکرار نباید از حداکثر بیشتر باشد.'

  // Optional weight window: both ends are numbers when present, and the window must not invert.
  for (const raw of [exercise.minWeightKg, exercise.maxWeightKg]) {
    if (!raw.trim()) continue

    const value = Number(raw)

    if (!Number.isFinite(value) || value < 0)
      return 'وزن‌های حداقل و حداکثر باید عدد صفر یا بیشتر باشند.'
  }

  if (
    exercise.minWeightKg &&
    exercise.maxWeightKg &&
    Number(exercise.minWeightKg) > Number(exercise.maxWeightKg)
  )
    return 'حداقل وزن نباید از حداکثر بیشتر باشد.'

  return null
}

export const draftToPayload = (draft: PlanDraft): PlanWriteRequest => ({
  title: draft.title.trim(),
  description: draft.description.trim() || null,
  visibility: draft.visibility,
  durationType: draft.durationType,
  ...(draft.durationType === PlanDurationType.Sessions
    ? { totalSessions: numberOrNull(draft.totalSessions) }
    : { durationWeeks: numberOrNull(draft.durationWeeks) }),
  goal: draft.goal,
  level: draft.level,
  assignedMemberUserId: draft.assignedMemberUserId,
  days: draft.days.map((day) => ({
    name: day.name.trim(),
    targetMuscleCodes: day.muscles,
    exercises: expandDay(day),
  })),
})

/**
 * One draft out, one or two slots in: a superset keeps its single form in the builder and is
 * expanded to two slots that share a 1-based group number, which is the contract the API stores.
 * Group numbers stay unique across the whole day, so the three phases never collide.
 */
const expandDay = (day: DayDraft): PlanExerciseInput[] => {
  const rows: PlanExerciseInput[] = []
  let nextGroup = 1

  const phases: Array<[PlanDayPhase, ExerciseDraft[]]> = [
    [PlanDayPhase.Warmup, day.warmup],
    [PlanDayPhase.Main, day.exercises],
    [PlanDayPhase.Cooldown, day.cooldown],
  ]

  for (const [phase, exercises] of phases) {
    for (const exercise of exercises) {
      if (exercise.type !== PlanExerciseType.Superset) {
        rows.push(exerciseToInput(exercise, exercise.exerciseId, rows.length + 1, null, phase))
        continue
      }

      const group = nextGroup++
      rows.push(exerciseToInput(exercise, exercise.exerciseId, rows.length + 1, group, phase))
      rows.push(exerciseToInput(exercise, exercise.exerciseId2, rows.length + 1, group, phase))
    }
  }

  return rows
}

const exerciseToInput = (
  exercise: ExerciseDraft,
  exerciseId: string,
  orderIndex: number,
  supersetGroup: number | null,
  phase: PlanDayPhase,
): PlanExerciseInput => {
  const timed = exercise.type === PlanExerciseType.Timed

  return {
    exerciseId,
    // 1-based inside the day, matching the server's OrderIndex rule.
    orderIndex,
    targetSets: Number(exercise.sets),
    targetRepsMin: timed ? null : numberOrNull(exercise.repsMin),
    targetRepsMax: timed ? null : numberOrNull(exercise.repsMax),
    targetRir: timed ? null : numberOrNull(exercise.rir),
    restSeconds: Number(exercise.restSeconds),
    notes: exercise.notes.trim() || null,
    supersetGroup,
    exerciseType: exercise.type,
    targetDurationSeconds: timed ? numberOrNull(exercise.durationSeconds) : null,
    minWeightKg: timed ? null : numberOrNull(exercise.minWeightKg),
    maxWeightKg: timed ? null : numberOrNull(exercise.maxWeightKg),
    phase,
  }
}
