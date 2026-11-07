'use client'


import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { listMyAssignments } from '@/app/(tenant)/_api/assignment-api'
import { getPreferences } from '@/app/(tenant)/_api/preferences-api'
import {
  abandonWorkout,
  addWorkoutExercise,
  completeWorkout,
  deleteLoggedSet,
  getWorkout,
  getWorkoutExerciseDetail,
  logWorkoutSets,
  removeWorkoutExercise,
  searchExercises,
  updateLoggedSet,
  type WorkoutExerciseDetail,
} from '@/app/(tenant)/_api/workout-api'
import BodyMapPanel from '@/app/(tenant)/_components/progress/body-map-panel'
import { PlanAssignmentStatus } from '@/app/(tenant)/_model/assignment.types'
import {
  type CompleteSessionResponse,
  type ExerciseSearchItem,
  type LoggedSetItem,
  type SessionExerciseItem,
  type SessionResponse,
  WorkoutSessionStatus,
  WorkoutSessionType,
  normalizeSessionStatus,
  normalizeSessionType,
} from '@/app/(tenant)/_model/workout.types'
import { ExerciseMedia } from '@/components/exercise/exercise-media'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useConfirm } from '@/lib/confirm'
import { t } from '@/lib/i18n'
import { muscleLoad, muscleSlugs } from '@/lib/muscle-mapping'
import { toast } from '@/lib/toast'

import { EffortPicker } from './effort-picker'
import { ExerciseLoadHelper } from './exercise-load-helper'
import { FinishSummary } from './finish-summary'
import { RestTimer, type RestResult } from './rest-timer'
import { SessionStartSheet } from './session-start-sheet'
import { WorkoutStepper } from './workout-stepper'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

/**
 * The session payload carries the prescription (sets/reps/RIR) but not the day's rest target, so a
 * logged set starts the house-default countdown; the member can extend or skip it.
 */
const DEFAULT_REST_SECONDS = 90

type Draft = { reps: string; weightKg: string; rir: string; isWarmup: boolean }

const draftFor = (exercise: SessionExerciseItem): Draft => ({
  reps: String(exercise.targetRepsMin ?? 10),
  weightKg: '0',
  // RIR 0 (no reps in reserve) is the honest default; the plan's target still wins.
  rir: exercise.targetRir != null ? String(exercise.targetRir) : '0',
  isWarmup: false,
})

/**
 * Muscles worked by one exercise. The catalog muscles win; the free-text target/body part is the
 * fallback so a session still shows a body map when the detail request failed.
 */
function muscleLevels(
  detail: WorkoutExerciseDetail | null | undefined,
  exercise: SessionExerciseItem,
): Record<string, number> {
  const levels: Record<string, number> = {}

  for (const muscle of detail?.muscles ?? []) {
    for (const slug of muscleSlugs(muscle.code, muscle.name))
      levels[slug] = Math.max(levels[slug] ?? 0, muscle.role === 1 ? 3 : 1)
  }

  if (Object.keys(levels).length > 0) return levels

  return muscleLoad([exercise])
}

const orderKey = (sessionId: string) => `workout-order:${sessionId}`

function readOrder(sessionId: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(orderKey(sessionId))
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

/**
 * The session runner: one exercise per step. Wide screens put the movement and its muscles on the
 * left and the instructions on the right; the set form is always visible, so a member never
 * scrolls a long list to find the next movement. Steps are named, joined and drag-reorderable, and
 * the step now follows the exercise progress rather than only advancing from the first one.
 */
export function WorkoutSessionPanel({
  sessionId,
  onClosed,
}: {
  sessionId: string
  onClosed: () => void
}) {
  const [session, setSession] = useState<SessionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState(0)
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [details, setDetails] = useState<Record<string, WorkoutExerciseDetail | null>>({})
  const [showInstructions, setShowInstructions] = useState(false)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<ExerciseSearchItem[]>([])
  const [finish, setFinish] = useState<CompleteSessionResponse | null>(null)
  const [finishOpen, setFinishOpen] = useState(false)
  const [rest, setRest] = useState<{ key: string; seconds: number } | null>(null)
  const [restResult, setRestResult] = useState<RestResult | null>(null)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [order, setOrder] = useState<string[]>(() => readOrder(sessionId))
  const { confirm, prompt } = useConfirm()

  // Keep request IDs stable after a failed network request so retrying the same set is idempotent.
  const pendingRequestIds = useRef<Record<string, string>>({})
  const requestedDetails = useRef(new Set<string>())
  const firstLoad = useRef(false)
  const checkInAsked = useRef(false)
  // Rest for a set comes from the plan's slot, then the member's profile, then the house default.
  const [restDefaults, setRestDefaults] = useState<{
    bySlot: Record<string, number>
    profile: number | null
  }>({ bySlot: {}, profile: null })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const next = await getWorkout(sessionId)
      setSession(next)

      const rows = next.exercises ?? []
      const open = rows.findIndex((exercise) => (exercise.sets?.length ?? 0) === 0)

      // Position on the member's real next action once; after that the step is theirs (or the
      // advance-after-set rule below), never a silent jump on every refresh.
      if (!firstLoad.current) {
        firstLoad.current = true
        setStep(open === -1 ? 0 : open)
      }

      const logged = rows.reduce((count, exercise) => count + (exercise.sets?.length ?? 0), 0)

      if (
        !checkInAsked.current &&
        logged === 0 &&
        normalizeSessionStatus(next.status) === WorkoutSessionStatus.InProgress &&
        !window.sessionStorage.getItem(`workout-checkin:${sessionId}`)
      ) {
        checkInAsked.current = true
        window.sessionStorage.setItem(`workout-checkin:${sessionId}`, '1')
        setCheckInOpen(true)
      }
    } catch (error) {
      toast.error('دریافت جلسه تمرین ناموفق بود', {
        description: error instanceof Error ? error.message : 'خطای ناشناخته',
      })
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    // Started on the next tick so the first render paints before the loading state flips.
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const exercises = useMemo(() => session?.exercises ?? [], [session])

  /**
   * The member's own order for this session. Unknown ids are ignored and new exercises appended,
   * so reordering survives a refresh without hiding an exercise added elsewhere.
   */
  const ordered = useMemo(() => {
    if (order.length === 0) return exercises

    const byId = new Map(exercises.map((exercise) => [exercise.exerciseId, exercise]))
    const saved = order
      .map((id) => byId.get(id))
      .filter((exercise): exercise is SessionExerciseItem => !!exercise)
    const added = exercises.filter((exercise) => !order.includes(exercise.exerciseId))

    return [...saved, ...added]
  }, [exercises, order])

  const current: SessionExerciseItem | undefined = ordered[step]
  const currentId = current?.exerciseId
  const detail = currentId ? (details[currentId] ?? null) : null

  useEffect(() => {
    if (!currentId || requestedDetails.current.has(currentId)) return

    requestedDetails.current.add(currentId)
    let alive = true

    void getWorkoutExerciseDetail(currentId)
      .then((value) => {
        if (alive) setDetails((old) => ({ ...old, [currentId]: value }))
      })
      .catch(() => {
        // A missing detail is not fatal: the step keeps its target and body-part fallback.
        if (alive) setDetails((old) => ({ ...old, [currentId]: null }))
      })

    return () => {
      alive = false
    }
  }, [currentId])

  const draft = (exercise: SessionExerciseItem): Draft =>
    drafts[exercise.exerciseId] ?? draftFor(exercise)

  const updateDraft = (exercise: SessionExerciseItem, patch: Partial<Draft>) =>
    setDrafts((old) => ({
      ...old,
      [exercise.exerciseId]: { ...(old[exercise.exerciseId] ?? draftFor(exercise)), ...patch },
    }))

  const inProgress =
    normalizeSessionStatus(session?.status) === WorkoutSessionStatus.InProgress

  const resting = !!rest

  useEffect(() => {
    let alive = true

    void (async () => {
      const [assignments, preferences] = await Promise.all([
        listMyAssignments(PlanAssignmentStatus.Active).catch(() => []),
        getPreferences().catch(() => null),
      ])

      if (!alive) return

      const bySlot: Record<string, number> = {}

      for (const assignment of assignments) {
        for (const day of assignment.plan?.days ?? []) {
          for (const item of day.exercises) {
            if (item.slot.restSeconds > 0) bySlot[item.slot.id] = item.slot.restSeconds
          }
        }
      }

      setRestDefaults({ bySlot, profile: preferences?.defaultRestSeconds ?? null })
    })()

    return () => {
      alive = false
    }
  }, [])

  const restFor = (exercise: SessionExerciseItem) => {
    if (exercise.restSeconds && exercise.restSeconds > 0) return exercise.restSeconds

    const planned = exercise.planDayExerciseId
      ? restDefaults.bySlot[exercise.planDayExerciseId]
      : undefined

    return planned ?? restDefaults.profile ?? DEFAULT_REST_SECONDS
  }

  const logSet = async (exercise: SessionExerciseItem) => {
    if (resting) {
      toast.error('اول استراحت را رد کن یا تمام شو؛ بعد ست بعدی را ثبت کن.')
      return
    }

    const values = draft(exercise)

    if (
      !Number.isFinite(Number(values.reps)) ||
      Number(values.reps) < 0 ||
      !Number.isFinite(Number(values.weightKg)) ||
      Number(values.weightKg) < 0
    ) {
      toast.error('تکرار و وزنه باید عدد معتبر باشند')
      return
    }

    const setNumber =
      (exercise.sets?.reduce((max, set) => Math.max(max, set.setNumber), 0) ?? 0) + 1
    const requestKey = `${exercise.exerciseId}:${setNumber}`
    const clientRequestId =
      pendingRequestIds.current[requestKey] ??
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${exercise.exerciseId}-${setNumber}`)
    pendingRequestIds.current[requestKey] = clientRequestId

    const target = exercise.targetSets ?? 0
    const logged = (exercise.sets?.length ?? 0) + 1

    setBusy(true)
    try {
      await logWorkoutSets(sessionId, {
        sets: [
          {
            exerciseId: exercise.exerciseId,
            ...(exercise.planDayExerciseId
              ? { planDayExerciseId: exercise.planDayExerciseId }
              : {}),
            setNumber,
            reps: Number(values.reps),
            weightKg: Number(values.weightKg),
            ...(values.rir !== '' ? { rir: Number(values.rir) } : {}),
            isWarmup: values.isWarmup,
            clientRequestId,
            ...(restResult
              ? { restSeconds: restResult.seconds, restSkipped: restResult.skipped }
              : {}),
          },
        ],
      })
      delete pendingRequestIds.current[requestKey]
      setDrafts((old) => ({
        ...old,
        [exercise.exerciseId]: { ...values, isWarmup: false },
      }))

      toast.success('ست ثبت شد')

      setRest({ key: requestKey, seconds: restFor(exercise) })
      setRestResult(null)
      await load()

      // Progress drives the step: once the exercise has its planned sets, move forward to the
      // next one that still needs work. The old code only recomputed the step from index 0,
      // which is why logging on any later step never advanced the rail.
      if (target > 0 && logged >= target) {
        const nextIndex = ordered.findIndex(
          (item, index) =>
            index > step && (item.sets?.length ?? 0) < (item.targetSets ?? 1),
        )
        if (nextIndex !== -1) setStep(nextIndex)
      }
    } catch (error) {
      toast.error('ثبت ست ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  const finishRest = (result: RestResult) => {
    setRestResult(result)
    setRest(null)
  }

  const closeSession = async (mode: 'complete' | 'abandon') => {
    if (mode === 'abandon') {
      const ok = await confirm({
        title: t('workout.abandon.title'),
        description: t('workout.abandon.body'),
        confirmText: t('workout.abandon.confirm'),
        destructive: true,
      })

      if (!ok) return
    }

    setBusy(true)
    try {
      if (mode === 'complete') {
        const result = await completeWorkout(sessionId)
        setFinish(result)
        setFinishOpen(true)
        toast.success('تمرین تکمیل شد')
      } else {
        await abandonWorkout(sessionId)
        toast.success('تمرین رها شد')
        onClosed()
      }

      await load()
    } catch (error) {
      toast.error(
        mode === 'complete' ? 'تکمیل تمرین ناموفق بود' : 'رها کردن تمرین ناموفق بود',
        { description: error instanceof Error ? error.message : 'خطای ناشناخته' },
      )
    } finally {
      setBusy(false)
    }
  }

  const findExercises = async () => {
    if (!search.trim()) return

    try {
      const result = await searchExercises({ query: search.trim() })
      setSearchResults(result.items ?? [])
    } catch (error) {
      toast.error('جستجوی حرکت ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const addExercise = async (exercise: ExerciseSearchItem) => {
    setBusy(true)
    try {
      await addWorkoutExercise(sessionId, { exerciseId: exercise.id })
      setSearchResults([])
      setSearch('')

      toast.success('حرکت اضافه شد')
      await load()
    } catch (error) {
      toast.error('افزودن حرکت ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  const removeExtra = async (exercise: SessionExerciseItem) => {
    const ok = await confirm({
      title: t('workout.removeExtra.title'),
      description: t('workout.removeExtra.body'),
      confirmText: t('workout.removeExtra.confirm'),
      destructive: true,
    })

    if (!ok) return

    try {
      await removeWorkoutExercise(sessionId, exercise.exerciseId)
      toast.success('حرکت حذف شد')
      await load()
    } catch (error) {
      toast.error('حذف حرکت ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const editSet = async (set: LoggedSetItem) => {
    const values = await prompt({
      title: t('workout.editSet.title', { number: fa(set.setNumber) }),
      description: t('workout.editSet.body'),
      fields: [
        {
          name: 'reps',
          label: t('workout.editSet.reps'),
          type: 'number',
          min: '0',
          defaultValue: String(set.reps),
        },
        {
          name: 'weight',
          label: t('workout.editSet.weight'),
          type: 'number',
          min: '0',
          step: '0.5',
          defaultValue: String(set.weightKg),
        },
      ],
      confirmText: t('workout.editSet.confirm'),
    })

    if (!values) return

    const reps = Number(values.reps)
    const weight = Number(values.weight)

    if (!Number.isFinite(reps) || !Number.isFinite(weight)) {
      toast.error('تکرار و وزنه باید عدد معتبر باشند')
      return
    }

    try {
      await updateLoggedSet(set.setId, {
        reps,
        weightKg: weight,
        ...(set.rir != null ? { rir: set.rir } : {}),
        isWarmup: set.isWarmup,
      })

      toast.success('ست ویرایش شد')
      await load()
    } catch (error) {
      toast.error('ویرایش ست ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const deleteSet = async (set: LoggedSetItem) => {
    const ok = await confirm({
      title: t('workout.deleteSet.title'),
      description: t('workout.deleteSet.body', {
        number: fa(set.setNumber),
        exercise: detail?.name ?? current?.exerciseName ?? 'حرکت',
      }),
      confirmText: t('workout.deleteSet.confirm'),
      destructive: true,
    })

    if (!ok) return

    try {
      await deleteLoggedSet(set.setId)

      toast.success('ست حذف شد')
      await load()
    } catch (error) {
      toast.error('حذف ست ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const reorder = (ids: string[]) => {
    const activeId = current?.exerciseId
    setOrder(ids)

    try {
      window.localStorage.setItem(orderKey(sessionId), JSON.stringify(ids))
    } catch {
      /* A blocked storage only loses the reorder on reload. */
    }

    if (activeId) {
      const index = ids.indexOf(activeId)
      if (index >= 0) setStep(index)
    }
  }

  if (loading && !session) {
    return (
      <div className="bg-card flex h-64 items-center justify-center gap-2 rounded-2xl border">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
        <span className="text-muted-foreground text-sm">در حال بارگذاری جلسه…</span>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="bg-card text-muted-foreground rounded-2xl border p-8 text-center text-sm">
        جلسه تمرین بارگذاری نشد.
      </div>
    )
  }

  const levels = current ? muscleLevels(detail, current) : {}
  const currentSets = current?.sets ?? []
  const isLast = step >= ordered.length - 1
  const currentDraft = current ? draft(current) : null

  const lastPerformance = current?.lastPerformance ?? null
  const lastSets = lastPerformance?.workingSets ?? []

  /** Last time's matching set (same number), else the last set of that day. */
  const previousSetFor = (setNumber: number) =>
    lastSets.find((item) => item.setNumber === setNumber) ??
    lastSets[lastSets.length - 1]

  /** Signed change for a logged set against the same set last time. */
  const deltaFor = (set: LoggedSetItem) => {
    const previous = previousSetFor(set.setNumber)
    if (!previous) return null

    return {
      weightKg: set.weightKg - previous.weightKg,
      reps: set.reps - previous.reps,
    }
  }

  const signed = (value: number) =>
    `${value >= 0 ? '+' : '−'}${fa(Math.abs(value))}`
  const instructions = [...(detail?.instructions ?? [])].sort(
    (a, b) => a.stepNumber - b.stepNumber,
  )
  const stepperItems = ordered.map((exercise) => ({
    id: exercise.exerciseId,
    name: exercise.exerciseName ?? 'حرکت',
    doneSets: exercise.sets?.length ?? 0,
    totalSets: exercise.targetSets ?? 0,
  }))
  const sessionLoad = muscleLoad(ordered)

  return (
    <div className="space-y-4" dir="rtl">
      <section className="bg-card rounded-2xl border p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs">
              {session.planTitle ?? 'جلسه تمرین'}
              {session.dayName ? ` · ${session.dayName}` : ''}
            </p>
            <h1 className="mt-1 truncate text-xl font-extrabold tracking-tight">
              {session.title || 'جلسه تمرین'}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">
                {normalizeSessionType(session.type) === WorkoutSessionType.Planned
                  ? 'برنامه‌ریزی‌شده'
                  : normalizeSessionType(session.type) === WorkoutSessionType.Free
                    ? 'آزاد'
                    : 'تمرین'}
              </Badge>
              <Badge variant="outline">
                {inProgress
                  ? 'در جریان'
                  : normalizeSessionStatus(session.status) === WorkoutSessionStatus.Completed
                    ? 'تکمیل‌شده'
                    : 'لغوشده'}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {fa(ordered.length)} حرکت · {fa(step + 1)} از {fa(Math.max(1, ordered.length))}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              تازه‌سازی
            </Button>
            <Button
              size="sm"
              onClick={() => void closeSession('complete')}
              disabled={busy || !inProgress}
            >
              <CheckCircle2 className="size-4" />
              تکمیل تمرین
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => void closeSession('abandon')}
              disabled={busy || !inProgress}
            >
              رها کردن
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <WorkoutStepper
            items={stepperItems}
            activeIndex={step}
            onSelect={setStep}
            onReorder={reorder}
          />
        </div>
      </section>

      {!ordered.length ? (
        <section className="bg-card flex flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center">
          <Dumbbell className="text-muted-foreground size-7" />
          <p className="text-sm font-bold">هنوز حرکتی در این جلسه نیست</p>
          <p className="text-muted-foreground max-w-sm text-xs leading-6">
            از کتابخانه یک حرکت اضافه کن تا اولین ست را ثبت کنی.
          </p>
        </section>
      ) : (
        current && (
          <section className="bg-card overflow-hidden rounded-2xl border shadow-sm">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_19rem]">
              {/* Left: the movement, the muscles it works, and the logging surfaces. */}
              <div className="min-w-0 border-b lg:border-b-0 lg:border-e">
                <ExerciseMedia
                  media={detail?.media}
                  name={detail?.name ?? current.exerciseName ?? 'حرکت'}
                  loading="eager"
                  className="h-56 sm:h-72"
                />

                <div className="border-b p-4 sm:p-5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold">عضلات این حرکت</h3>
                    <span className="text-muted-foreground text-[10px]">اصلی پررنگ‌تر است</span>
                  </div>
                  {Object.keys(levels).length > 0 ? (
                    <BodyMapPanel palette="load" load={levels} size="card" />
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      عضلانی برای این حرکت ثبت نشده است.
                    </p>
                  )}
                </div>

                <div className="space-y-4 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-lg font-extrabold tracking-tight">
                        {detail?.name ?? current.exerciseName ?? 'حرکت'}
                      </h2>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {current.isPlanned ? 'حرکت برنامه' : 'حرکت اضافه'}
                        {current.targetSets ? ` · ${fa(current.targetSets)} ست` : ''}
                        {current.targetRepsMin
                          ? ` · ${fa(current.targetRepsMin)}–${fa(current.targetRepsMax ?? current.targetRepsMin)} تکرار`
                          : ''}
                        {current.targetRir != null ? ` · RIR ${fa(current.targetRir)}` : ''}
                      </p>
                      {lastPerformance && lastSets.length > 0 && (
                        <p className="text-muted-foreground mt-1 text-[11px]">
                          آخرین بار{' '}
                          {new Date(lastPerformance.completedAt).toLocaleDateString('fa-IR')} ·{' '}
                          {fa(lastSets.length)} ست · بهترین{' '}
                          {fa(Math.max(...lastSets.map((item) => item.weightKg)))} کیلوگرم
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowInstructions(true)}
                      >
                        <Info className="size-4" />
                        دستورالعمل
                      </Button>
                      {current.isExtra && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => void removeExtra(current)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {current.suggestion && (
                    <p className="bg-primary/5 text-muted-foreground rounded-xl border border-primary/20 px-3 py-2 text-xs leading-6">
                      پیشنهاد امروز: {fa(current.suggestion.suggestedWeightKg ?? 0)} کیلوگرم ×{' '}
                      {fa(current.suggestion.suggestedReps ?? 0)} تکرار
                      {current.suggestion.reason ? ` · ${current.suggestion.reason}` : ''}
                    </p>
                  )}

                  <ExerciseLoadHelper
                    equipment={current.equipment ?? null}
                    minWeightKg={current.minWeightKg ?? null}
                    maxWeightKg={current.maxWeightKg ?? null}
                    suggestionWeightKg={current.suggestion?.suggestedWeightKg ?? null}
                    lastWeightKg={
                      currentSets.length
                        ? currentSets[currentSets.length - 1].weightKg
                        : null
                    }
                  />

                  {currentSets.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground border-b text-xs">
                            <th className="p-2 text-right font-medium">ست</th>
                            <th className="p-2 text-right font-medium">تکرار</th>
                            <th className="p-2 text-right font-medium">وزنه</th>
                            <th className="p-2 text-right font-medium">شدت</th>
                            <th className="p-2 text-right font-medium">استراحت</th>
                            <th className="p-2 text-right font-medium">نسبت به قبل</th>
                            <th className="p-2 text-right font-medium">نوع</th>
                            <th className="p-2 text-right font-medium"> </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentSets.map((set) => (
                            <tr key={set.setId} className="border-b last:border-0">
                              <td className="p-2 tabular-nums">{fa(set.setNumber)}</td>
                              <td className="p-2 tabular-nums">{fa(set.reps)}</td>
                              <td className="p-2 tabular-nums">{fa(set.weightKg)} kg</td>
                              <td className="p-2 tabular-nums">
                                {set.rir != null ? `RIR ${fa(set.rir)}` : '—'}
                              </td>
                              <td className="text-muted-foreground p-2 text-xs tabular-nums">
                                {set.restSeconds != null
                                  ? `${fa(set.restSeconds)} ث${set.restSkipped ? ' (رد)' : ''}`
                                  : '—'}
                              </td>
                              <td className="p-2 text-xs tabular-nums whitespace-nowrap">
                                {(() => {
                                  const delta = deltaFor(set)
                                  if (!delta) return <span className="text-muted-foreground">—</span>
                                  if (delta.weightKg === 0 && delta.reps === 0) {
                                    return <span className="text-muted-foreground">بدون تغییر</span>
                                  }
                                  return (
                                    <span className="font-semibold">
                                      {signed(delta.weightKg)} kg · {signed(delta.reps)}
                                    </span>
                                  )
                                })()}
                              </td>
                              <td className="text-muted-foreground p-2 text-xs">
                                {set.isWarmup ? 'گرم‌کردن' : 'اصلی'}
                              </td>
                              <td className="p-2">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => void editSet(set)}
                                  >
                                    ویرایش
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive"
                                    onClick={() => void deleteSet(set)}
                                    aria-label="حذف ست"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {currentDraft && (
                    <form
                      className="space-y-3 rounded-xl border p-3"
                      onSubmit={(event) => {
                        event.preventDefault()
                        if (inProgress && !busy && !resting) void logSet(current)
                      }}
                    >
                      {(() => {
                        const previous = previousSetFor(currentSets.length + 1)
                        if (!previous) return null
                        return (
                          <p className="bg-muted/50 text-muted-foreground rounded-lg px-3 py-2 text-[11px] tabular-nums">
                            بار قبل (ست {fa(previous.setNumber)}): {fa(previous.weightKg)} کیلوگرم ×{' '}
                            {fa(previous.reps)} تکرار
                            {previous.rir != null ? ` · RIR ${fa(previous.rir)}` : ''}
                          </p>
                        )
                      })()}
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <label className="space-y-1 text-xs">
                          <span className="text-muted-foreground">تکرار</span>
                          <Input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            value={currentDraft.reps}
                            onChange={(event) =>
                              updateDraft(current, { reps: event.target.value })
                            }
                          />
                        </label>
                        <label className="space-y-1 text-xs">
                          <span className="text-muted-foreground">وزنه (kg)</span>
                          <Input
                            type="number"
                            min="0"
                            step="2.5"
                            inputMode="decimal"
                            value={currentDraft.weightKg}
                            onChange={(event) =>
                              updateDraft(current, { weightKg: event.target.value })
                            }
                          />
                        </label>
                        <div className="space-y-1 text-xs">
                          <span className="text-muted-foreground">شدت</span>
                          <EffortPicker
                            value={
                              currentDraft.rir === '' ? null : Number(currentDraft.rir)
                            }
                            onChange={(rir) =>
                              updateDraft(current, {
                                rir: rir == null ? '' : String(rir),
                              })
                            }
                          />
                        </div>
                        <label className="flex items-center gap-2 pt-5 text-xs">
                          <input
                            type="checkbox"
                            checked={currentDraft.isWarmup}
                            onChange={(event) =>
                              updateDraft(current, { isWarmup: event.target.checked })
                            }
                          />
                          ست گرم‌کردن
                        </label>
                      </div>

                      <Button
                        type="submit"
                        disabled={busy || !inProgress || resting}
                        aria-describedby={resting ? 'rest-blocked-hint' : undefined}
                      >
                        <Plus className="size-4" />
                        ثبت ست {fa(currentSets.length + 1)}
                      </Button>

                      {resting && (
                        <p id="rest-blocked-hint" className="text-muted-foreground text-[11px]">
                          تا وقتی تایمر استراحت در جریان است ست جدید ثبت نمی‌شود؛ می‌توانی
                          «رد کردن» را بزنی.
                        </p>
                      )}
                    </form>
                  )}

                  {rest && (
                    <RestTimer key={rest.key} seconds={rest.seconds} onFinish={finishRest} />
                  )}

                  {restResult && (
                    <p className="text-muted-foreground text-[11px]">
                      استراحت ثبت‌شده: {fa(restResult.seconds)} ثانیه
                      {restResult.skipped ? ' (رد شده)' : ''} — با ست بعدی به رکورد جلسه می‌رسد.
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 border-t pt-3">
                    <Button
                      variant="outline"
                      disabled={step === 0}
                      onClick={() => setStep((value) => Math.max(0, value - 1))}
                    >
                      <ChevronRight className="size-4" />
                      حرکت قبلی
                    </Button>
                    {isLast ? (
                      <Button
                        onClick={() => void closeSession('complete')}
                        disabled={busy || !inProgress}
                      >
                        <CheckCircle2 className="size-4" />
                        پایان و تکمیل تمرین
                      </Button>
                    ) : (
                      <Button onClick={() => setStep((value) => value + 1)}>
                        حرکت بعدی
                        <ChevronLeft className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: how to perform the movement, and which muscles are involved. */}
              <aside className="space-y-3 p-4 sm:p-5">
                <div>
                  <h3 className="text-sm font-bold">دستورالعمل</h3>
                  <p className="text-muted-foreground mt-1 text-xs leading-5">
                    اجرای درست حرکت، مهم‌تر از وزنه است.
                  </p>
                </div>

                {instructions.length > 0 ? (
                  <ol className="list-decimal space-y-2 pe-4 text-xs leading-6">
                    {instructions.map((item) => (
                      <li key={item.stepNumber}>{item.text}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-muted-foreground text-xs leading-6">
                    دستورالعملی برای این حرکت ثبت نشده است.
                  </p>
                )}

                {detail?.muscles?.length ? (
                  <div className="flex flex-wrap gap-1 border-t pt-3">
                    {detail.muscles.map((muscle) => (
                      <span
                        key={`${muscle.code}-${muscle.role}`}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          muscle.role === 1
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {muscle.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </aside>
            </div>
          </section>
        )
      )}

      {inProgress && (
        <details className="bg-card rounded-2xl border p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold">
            افزودن حرکت به این جلسه
          </summary>
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجوی نام حرکت"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void findExercises()
                  }
                }}
              />
              <Button variant="outline" onClick={() => void findExercises()} disabled={busy}>
                جستجو
              </Button>
            </div>
            {searchResults.length > 0 && (
              <ul className="divide-y rounded-xl border">
                {searchResults.map((exercise) => (
                  <li
                    key={exercise.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{exercise.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {exercise.equipment ?? 'تجهیزات نامشخص'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void addExercise(exercise)}
                      disabled={busy}
                    >
                      افزودن
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      )}

      {showInstructions && current && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px] sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowInstructions(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="workout-instructions-title"
            className="bg-card max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-2xl border shadow-2xl"
          >
            <div className="flex items-center justify-between border-b p-4">
              <h2 id="workout-instructions-title" className="font-bold">
                دستورالعمل {detail?.name ?? current.exerciseName ?? 'حرکت'}
              </h2>
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                aria-label="بستن"
                className="hover:bg-muted rounded-lg p-2"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              {detail?.media?.length ? (
                <ExerciseMedia
                  media={detail.media}
                  name={detail.name ?? current.exerciseName ?? 'حرکت'}
                  className="max-h-64 rounded-xl"
                />
              ) : null}

              {instructions.length > 0 ? (
                <ol className="list-decimal space-y-2 pe-5 text-sm leading-7">
                  {instructions.map((item) => (
                    <li key={item.stepNumber}>{item.text}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-muted-foreground text-sm">
                  دستورالعملی برای این حرکت ثبت نشده است.
                </p>
              )}

              {Object.keys(levels).length > 0 && (
                <div className="border-t pt-4">
                  <BodyMapPanel palette="load" load={levels} />
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <SessionStartSheet
        open={checkInOpen}
        onOpenChange={setCheckInOpen}
        onDone={() => setCheckInOpen(false)}
      />

      <FinishSummary
        open={finishOpen}
        onOpenChange={setFinishOpen}
        result={finish}
        load={sessionLoad}
        onDone={() => {
          setFinishOpen(false)
          onClosed()
        }}
      />
    </div>
  )
}
