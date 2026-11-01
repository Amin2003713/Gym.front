import { MUSCLES, type MuscleSlug } from '@/lib/muscles'

import type {
  PlanDayDetail,
  PlanDetail,
  PlanDurationType,
  PlanExerciseType,
  PlanGoal,
  PlanLevel,
  PlanVisibility,
  PlanWriteRequest,
} from './plan.types'

/** Body-map muscles a coach can target on a day, in body order. */
export const TARGET_MUSCLES = MUSCLES

export type ExerciseDraft = {
  key: string
  exerciseId: string
  name: string
  type: PlanExerciseType
  sets: string
  repsMin: string
  repsMax: string
  rir: string
  durationSeconds: string
  restSeconds: string
  notes: string
  supersetGroup: string
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
const MAX_SUPERSET_GROUP = 20

let sequence = 0
const nextKey = () => `draft-${++sequence}`

export const blankExercise = (): ExerciseDraft => ({
  key: nextKey(),
  exerciseId: '',
  name: '',
  type: 'Standard',
  sets: '3',
  repsMin: '8',
  repsMax: '12',
  rir: '',
  durationSeconds: '45',
  restSeconds: '90',
  notes: '',
  supersetGroup: '',
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
  visibility: 'Private',
  durationType: 'Sessions',
  totalSessions: '12',
  durationWeeks: '4',
  goal: 'BuildMuscle',
  level: 'Beginner',
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
  exercises: day.exercises.length
    ? [...day.exercises]
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((exercise) => ({
          key: nextKey(),
          exerciseId: exercise.exerciseId,
          name: exercise.exerciseName ?? '',
          type: exercise.exerciseType ?? 'Standard',
          sets: String(exercise.targetSets ?? 3),
          repsMin: exercise.targetRepsMin == null ? '' : String(exercise.targetRepsMin),
          repsMax: exercise.targetRepsMax == null ? '' : String(exercise.targetRepsMax),
          rir: exercise.targetRir == null ? '' : String(exercise.targetRir),
          durationSeconds:
            exercise.targetDurationSeconds == null ? '45' : String(exercise.targetDurationSeconds),
          restSeconds: String(exercise.restSeconds ?? 90),
          notes: exercise.notes ?? '',
          supersetGroup: exercise.supersetGroup == null ? '' : String(exercise.supersetGroup),
        }))
    : [blankExercise()],
})

/** Validation mirrors the server validators; the server stays the source of truth. */
export const validateDetails = (draft: PlanDraft): string | null => {
  if (!draft.title.trim()) return 'عنوان برنامه الزامی است.'

  const duration = draft.durationType === 'Sessions' ? draft.totalSessions : draft.durationWeeks
  if (!Number(duration) || Number(duration) < 1) return 'مدت برنامه را وارد کنید.'

  // Privacy rule, mirrored by the domain and the server validator.
  if (draft.visibility === 'Private' && !draft.assignedMemberUserId)
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

    const groups = new Map<string, number>()
    for (const exercise of day.exercises) {
      if (!exercise.supersetGroup.trim()) continue
      groups.set(exercise.supersetGroup.trim(), (groups.get(exercise.supersetGroup.trim()) ?? 0) + 1)
    }

    for (const [group, count] of groups) {
      if (count < 2) return `سوپرست «${group}» به حداقل دو حرکت نیاز دارد.`
    }

    const grouped = day.exercises.filter((exercise) => exercise.supersetGroup.trim())
    if (grouped.some((exercise) => exercise.type !== 'Superset') && grouped.length > 0)
      return `همه اعضای یک سوپرست باید نوع «سوپرست» داشته باشند.`
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

  if (exercise.type === 'Timed') {
    const duration = Number(exercise.durationSeconds)
    if (!Number.isFinite(duration) || duration < MIN_DURATION_SECONDS || duration > MAX_DURATION_SECONDS)
      return 'مدت حرکت زمان‌دار باید بین ۵ تا ۳۶۰۰ ثانیه باشد.'
    return null
  }

  if (Number(exercise.rir) > MAX_RIR || Number(exercise.rir) < 0)
    return 'RIR باید بین ۰ تا ۱۰ باشد.'

  if (exercise.type === 'Superset') {
    const group = Number(exercise.supersetGroup)
    if (!Number.isInteger(group) || group < 1 || group > MAX_SUPERSET_GROUP)
      return 'شماره سوپرست باید بین ۱ تا ۲۰ باشد.'
    if (!exercise.repsMin.trim() || !exercise.repsMax.trim())
      return 'حرکت سوپرست به بازه تکرار نیاز دارد.'
  }

  if (exercise.repsMin && exercise.repsMax && Number(exercise.repsMin) > Number(exercise.repsMax))
    return 'حداقل تکرار نباید از حداکثر بیشتر باشد.'

  return null
}

export const draftToPayload = (draft: PlanDraft): PlanWriteRequest => ({
  title: draft.title.trim(),
  description: draft.description.trim() || null,
  visibility: draft.visibility,
  durationType: draft.durationType,
  ...(draft.durationType === 'Sessions'
    ? { totalSessions: numberOrNull(draft.totalSessions) }
    : { durationWeeks: numberOrNull(draft.durationWeeks) }),
  goal: draft.goal,
  level: draft.level,
  assignedMemberUserId: draft.assignedMemberUserId,
  days: draft.days.map((day) => ({
    name: day.name.trim(),
    targetMuscleCodes: day.muscles,
    exercises: day.exercises.map((exercise, index) => exerciseToInput(exercise, index)),
  })),
})

const exerciseToInput = (exercise: ExerciseDraft, index: number) => {
  const timed = exercise.type === 'Timed'

  return {
    exerciseId: exercise.exerciseId,
    // 1-based inside the day, matching the server's OrderIndex rule.
    orderIndex: index + 1,
    targetSets: Number(exercise.sets),
    targetRepsMin: timed ? null : numberOrNull(exercise.repsMin),
    targetRepsMax: timed ? null : numberOrNull(exercise.repsMax),
    targetRir: timed ? null : numberOrNull(exercise.rir),
    restSeconds: Number(exercise.restSeconds),
    notes: exercise.notes.trim() || null,
    supersetGroup:
      exercise.type === 'Superset' ? Number(exercise.supersetGroup) : null,
    exerciseType: exercise.type,
    targetDurationSeconds: timed ? numberOrNull(exercise.durationSeconds) : null,
  }
}
