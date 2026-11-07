import { MUSCLES, type MuscleSlug } from '@/lib/muscles'

import {
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
  exercises: ExerciseDraft[]
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

export const blankExercise = (): ExerciseDraft => ({
  key: nextKey(),
  exerciseId: '',
  name: '',
  exerciseId2: '',
  name2: '',
  type: PlanExerciseType.Standard,
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
  exercises: [blankExercise()],
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

const dayToDraft = (day: PlanDayDetail, index: number): DayDraft => ({
  key: nextKey(),
  name: day.name || `روز ${index + 1}`,
  muscles: (day.targetMuscleCodes ?? []).filter((code): code is MuscleSlug =>
    (MUSCLES as readonly string[]).includes(code),
  ),
  exercises: draftsFromSlots(day.exercises.length ? day.exercises : []),
})

/**
 * The API stores a superset as one slot per movement sharing a group number. The builder shows a
 * superset as ONE form, so two slots of the same group fold into a single draft here.
 */
const draftsFromSlots = (slots: PlanExerciseDetail[]): ExerciseDraft[] => {
  const drafts: ExerciseDraft[] = []
  const supersets = new Map<number, ExerciseDraft>()

  for (const slot of [...slots].sort((a, b) => a.orderIndex - b.orderIndex)) {
    const draft: ExerciseDraft = {
      key: nextKey(),
      exerciseId: slot.exerciseId,
      name: slot.exerciseName ?? '',
      exerciseId2: '',
      name2: '',
      type: slot.exerciseType ?? PlanExerciseType.Standard,
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
      drafts.push(draft)
      continue
    }

    const paired = supersets.get(slot.supersetGroup)

    if (paired) {
      paired.exerciseId2 = draft.exerciseId
      paired.name2 = draft.name
      continue
    }

    supersets.set(slot.supersetGroup, draft)
    drafts.push(draft)
  }

  return drafts.length ? drafts : [blankExercise()]
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
    if (day.muscles.length === 0) return `برای روز «${day.name}» حداقل یک عضله هدف انتخاب کنید.`
  }

  return null
}

export const validateExercises = (draft: PlanDraft): string | null => {
  for (const day of draft.days) {
    if (day.exercises.length === 0) return `برای روز «${day.name}» حداقل یک حرکت اضافه کنید.`

    for (const exercise of day.exercises) {
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
    exercises: expandExercises(day.exercises),
  })),
})

/**
 * One draft out, one or two slots in: a superset keeps its single form in the builder and is
 * expanded to two slots that share a 1-based group number, which is the contract the API stores.
 */
const expandExercises = (exercises: ExerciseDraft[]): PlanExerciseInput[] => {
  const rows: PlanExerciseInput[] = []

  exercises.forEach((exercise, index) => {
    if (exercise.type !== PlanExerciseType.Superset) {
      rows.push(exerciseToInput(exercise, exercise.exerciseId, rows.length + 1, null))
      return
    }

    const group = index + 1
    rows.push(exerciseToInput(exercise, exercise.exerciseId, rows.length + 1, group))
    rows.push(exerciseToInput(exercise, exercise.exerciseId2, rows.length + 1, group))
  })

  return rows
}

const exerciseToInput = (
  exercise: ExerciseDraft,
  exerciseId: string,
  orderIndex: number,
  supersetGroup: number | null,
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
  }
}
