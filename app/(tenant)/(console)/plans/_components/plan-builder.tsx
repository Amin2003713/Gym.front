'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import MemberPicker from '@/app/(tenant)/(console)/assignments/_components/member-picker'
import { MUSCLE_LABEL } from '@/app/(tenant)/_model/muscle-labels'
import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'

import { muscleApi, type MuscleOption } from '../../exercises/_api/muscle-api'
import { createPlan, getPlan, updatePlan } from '../_api/plan-api'
import {
  blankDraft,
  blankDay,
  blankExercise,
  DAY_PHASES,
  dayExercises,
  draftFromDetail,
  draftToPayload,
  type DayDraft,
  type DayPhaseKey,
  type ExerciseDraft,
  type PlanDraft,
  TARGET_MUSCLES,
  validateDays,
  validateDetails,
  validateExercises,
  withFreshKeys,
  withPhaseExercises,
} from '../_model/plan-draft'
import { MUSCLE_GROUPS } from '@/lib/muscle-groups'
import { GOAL_LABELS, LEVEL_LABELS } from '../_model/plan-labels'
import {
  PlanDayPhase,
  PlanDurationType,
  PlanExerciseType,
  PlanVisibility,
  type PlanGoal,
  type PlanLevel,
} from '../_model/plan.types'

import ExerciseEditor from './exercise-editor'
import { MemberRecoveryMap } from './member-recovery-map'
import PlanCoverageMap from './plan-coverage-map'

const STEPS = ['اطلاعات برنامه', 'روزها و حرکات', 'بازبینی و ذخیره'] as const
const MAX_DAYS = 14
const LAST_STEP = STEPS.length - 1

const fieldClass = 'bg-background h-10 w-full rounded-md border px-3 text-sm'

const DRAFT_STORAGE_VERSION = 1
const DRAFT_SAVE_DELAY_MS = 500

/** What the builder keeps per browser so a half-made plan survives a closed tab. */
type CachedDraft = {
  version: number
  savedAt: number
  step: number
  activeDay: number
  activeExercise: number
  draft: PlanDraft
}

const draftStorageKey = (planId?: string) => `plan-builder-draft:${planId ?? 'new'}`

const readCachedDraft = (key: string): CachedDraft | null => {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null

    const parsed = JSON.parse(raw) as CachedDraft
    const days = parsed?.draft?.days

    if (
      parsed?.version !== DRAFT_STORAGE_VERSION ||
      !Array.isArray(days) ||
      days.length === 0 ||
      days.some((day) => !Array.isArray(day?.exercises))
    )
      return null

    return parsed
  } catch {
    // Corrupt draft: fall back to the server copy instead of failing the screen.
    return null
  }
}

const clearCachedDraft = (key: string) => {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Storage disabled: the builder still works, it just cannot restore.
  }
}

const formatSavedAt = (value: number) =>
  new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(value)

export function PlanBuilder({ planId }: { planId?: string }) {
  const router = useRouter()
  const [draft, setDraft] = useState<PlanDraft>(blankDraft)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(!!planId)
  const [saving, setSaving] = useState(false)
  const [activeDay, setActiveDay] = useState(0)
  const [activeExercise, setActiveExercise] = useState(0)
  const [muscles, setMuscles] = useState<MuscleOption[]>([])

  // Browser draft cache: reopening the screen continues exactly where the coach left off.
  const [hydrated, setHydrated] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [restoredAt, setRestoredAt] = useState<number | null>(null)
  const restoredRef = useRef(false)
  const serverDraftRef = useRef<PlanDraft | null>(null)

  useEffect(() => {
    if (!planId) return

    let alive = true
    getPlan(planId)
      .then((detail) => {
        if (!alive) return

        const next = draftFromDetail(detail)
        serverDraftRef.current = next

        // A cached draft is the last thing the coach actually edited; server data must not
        // replace it, or an unfinished edit silently disappears on refresh.
        if (!restoredRef.current) setDraft(next)
      })
      .catch((error: unknown) => {
        toast.error('دریافت برنامه ناموفق بود', {
          description: error instanceof Error ? error.message : undefined,
        })
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [planId])

  // Muscle ids come from the catalog once; the exercise API is always queried by id.
  useEffect(() => {
    const timer = setTimeout(() => {
      muscleApi
        .list()
        .then(setMuscles)
        .catch(() => setMuscles([]))
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const key = draftStorageKey(planId)

    // Deferred a tick: restoring is a one-time read from an external store, and React asks that
    // an effect not cascade state synchronously during its own body.
    const timer = setTimeout(() => {
      const cached = readCachedDraft(key)

      if (cached) {
        const dayIndex = Math.min(Math.max(cached.activeDay, 0), cached.draft.days.length - 1)
        const exerciseCount = cached.draft.days[dayIndex]
          ? dayExercises(cached.draft.days[dayIndex]).length
          : 0

        setDraft(withFreshKeys(cached.draft))
        setStep(Math.min(Math.max(cached.step, 0), LAST_STEP))
        setActiveDay(dayIndex)
        setActiveExercise(Math.min(Math.max(cached.activeExercise, 0), Math.max(exerciseCount - 1, 0)))
        setRestoredAt(cached.savedAt)
        setDirty(true)
        restoredRef.current = true

        // The cached draft is already the right screen; do not make the coach wait for a fetch
        // whose result is going to be ignored anyway.
        if (planId) setLoading(false)
      } else {
        restoredRef.current = false
      }

      setHydrated(true)
    }, 0)

    return () => clearTimeout(timer)
  }, [planId])

  // Debounced autosave, skipped until the restore above has run so a blank first render cannot
  // overwrite a real draft.
  useEffect(() => {
    if (!hydrated || !dirty) return

    const key = draftStorageKey(planId)
    const timer = setTimeout(() => {
      const payload: CachedDraft = {
        version: DRAFT_STORAGE_VERSION,
        savedAt: Date.now(),
        step,
        activeDay,
        activeExercise,
        draft,
      }

      try {
        window.localStorage.setItem(key, JSON.stringify(payload))
      } catch {
        // Storage full or blocked; keep editing and stop promising a restore.
      }
    }, DRAFT_SAVE_DELAY_MS)

    return () => clearTimeout(timer)
  }, [activeDay, activeExercise, dirty, draft, hydrated, planId, step])

  const patchDraft = useCallback(
    (patch: Partial<PlanDraft>) => {
      setDirty(true)
      setDraft((current) => ({ ...current, ...patch }))
    },
    [],
  )

  const patchDay = useCallback(
    (index: number, patch: Partial<DayDraft>) => {
      setDirty(true)
      setDraft((current) => ({
        ...current,
        days: current.days.map((day, dayIndex) => (dayIndex === index ? { ...day, ...patch } : day)),
      }))
    },
    [],
  )

  const patchExercise = useCallback(
    (dayIndex: number, exerciseIndex: number, patch: Partial<ExerciseDraft>) => {
      setDirty(true)
      setDraft((current) => ({
        ...current,
        days: current.days.map((day, index) => {
          if (index !== dayIndex) return day

          const target = dayExercises(day)[exerciseIndex]
          if (!target) return day

          const phase = target.phase
          const warmupLength = day.warmup.length
          const offset =
            phase === PlanDayPhase.Warmup
              ? 0
              : phase === PlanDayPhase.Cooldown
                ? warmupLength + day.exercises.length
                : warmupLength
          const position = exerciseIndex - offset
          const list =
            phase === PlanDayPhase.Warmup
              ? day.warmup
              : phase === PlanDayPhase.Cooldown
                ? day.cooldown
                : day.exercises

          return withPhaseExercises(
            day,
            phase,
            list.map((exercise, index2) =>
              index2 === position ? { ...exercise, ...patch } : exercise,
            ),
          )
        }),
      }))
    },
    [],
  )

  const currentDay = draft.days[activeDay] ?? draft.days[0]
  const currentExercise = currentDay ? dayExercises(currentDay)[activeExercise] : undefined

  const muscleIdByCode = useMemo(
    () => new Map(muscles.map((muscle) => [muscle.code.toLowerCase(), muscle.id])),
    [muscles],
  )
  const activeMuscleIds = useMemo(
    () =>
      (currentDay?.muscles ?? [])
        .map((slug) => muscleIdByCode.get(slug))
        .filter((id): id is string => Boolean(id)),
    [currentDay, muscleIdByCode],
  )

  const stepProblem = (index: number): string | null => {
    if (index === 0) return validateDetails(draft, !planId)
    if (index === 1) return validateDays(draft) ?? validateExercises(draft)
    return null
  }

  const goNext = () => {
    const problem = stepProblem(step)
    if (problem) return void toast.error(problem)
    setStep((current) => Math.min(current + 1, LAST_STEP))
  }

  const goBack = () => setStep((current) => Math.max(0, current - 1))

  const discardDraft = () => {
    clearCachedDraft(draftStorageKey(planId))

    const fresh = planId && serverDraftRef.current ? serverDraftRef.current : blankDraft()
    setDraft(withFreshKeys(fresh))
    setStep(0)
    setActiveDay(0)
    setActiveExercise(0)
    setRestoredAt(null)
    setDirty(false)
  }

  const save = async () => {
    const problem =
      validateDetails(draft, !planId) ?? validateDays(draft) ?? validateExercises(draft)
    if (problem) return void toast.error(problem)

    setSaving(true)
    try {
      const payload = draftToPayload(draft)
      if (planId) await updatePlan(planId, payload)
      else await createPlan(payload)

      // The server now holds this draft; a stale browser copy would shadow the saved version.
      clearCachedDraft(draftStorageKey(planId))
      toast.success(planId ? 'برنامه به‌روزرسانی شد' : 'برنامه ایجاد شد')
      router.push('/plans')
    } catch (error) {
      toast.error('ذخیره برنامه ناموفق بود', {
        description: error instanceof Error ? error.message : 'ورودی‌ها را بررسی کنید.',
      })
    } finally {
      setSaving(false)
    }
  }

  const coverageRows = useMemo(
    () =>
      draft.days.flatMap((day) =>
        dayExercises(day)
          .filter((exercise) => exercise.exerciseId)
          .map((exercise) => ({
            exerciseId: exercise.exerciseId,
            targetSets: Number(exercise.sets) || undefined,
          })),
      ),
    [draft.days],
  )

  if (loading) {
    return (
      <div className="text-muted-foreground flex min-h-64 items-center justify-center gap-2 text-sm">
        <Loader2 className="size-5 animate-spin" />
        در حال دریافت برنامه…
      </div>
    )
  }

  return (
    <div className="space-y-5" dir="rtl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{planId ? 'ویرایش برنامه تمرینی' : 'برنامه تمرینی جدید'}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            سه مرحلهٔ کوتاه: اطلاعات، روزها و حرکات، سپس بازبینی و ذخیره.
          </p>
        </div>
        <Button variant="ghost" onClick={() => router.push('/plans')}>
          بازگشت به فهرست
        </Button>
      </header>

      {restoredAt && (
        <div
          role="status"
          className="bg-primary/10 border-primary/30 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs"
        >
          <span>
            پیش‌نویس این برنامه در مرورگر ذخیره شده بود و بازیابی شد.
            <span className="text-muted-foreground"> آخرین ذخیره: {formatSavedAt(restoredAt)}</span>
          </span>
          <Button type="button" size="sm" variant="ghost" onClick={discardDraft}>
            شروع از نو
          </Button>
        </div>
      )}

      <StepIndicator step={step} />

      <section className="bg-card rounded-lg border p-4 shadow-sm sm:p-6">
        {step === 0 && <DetailsStep draft={draft} onChange={patchDraft} />}

        {step === 1 && currentDay && (
          <ExercisesStep
            days={draft.days}
            activeDay={activeDay}
            activeExercise={activeExercise}
            currentExercise={currentExercise}
            onChangeDay={setActiveDay}
            onChangeExercise={setActiveExercise}
            onDaysChange={(days) => patchDraft({ days })}
            onDayChange={patchDay}
            onExerciseChange={patchExercise}
            coverageRows={coverageRows}
            memberId={draft.assignedMemberUserId}
            muscleIds={activeMuscleIds}
            targetMuscles={currentDay?.muscles ?? []}
          />
        )}

        {step === LAST_STEP && (
          <ReviewStep
            draft={draft}
            coverageRows={coverageRows}
            targetMuscles={[...new Set(draft.days.flatMap((day) => day.muscles))]}
          />
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" onClick={goBack} disabled={step === 0 || saving}>
          <ChevronRight className="ml-1 size-4" />
          مرحله قبل
        </Button>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.push('/plans')} disabled={saving}>
            انصراف
          </Button>
          {step < LAST_STEP ? (
            <Button onClick={goNext}>
              مرحله بعد
              <ChevronLeft className="mr-1 size-4" />
            </Button>
          ) : (
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? 'در حال ذخیره…' : planId ? 'ذخیره تغییرات' : 'ذخیره برنامه'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function StepIndicator({ step }: { step: number }) {
  return (
    <ol className="bg-card flex flex-wrap gap-1 rounded-lg border p-1.5" aria-label="مراحل ساخت برنامه">
      {STEPS.map((label, index) => {
        const state = index === step ? 'current' : index < step ? 'done' : 'todo'
        return (
          <li key={label} className="flex-1">
            <div
              aria-current={state === 'current' ? 'step' : undefined}
              className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold ${
                state === 'current'
                  ? 'bg-primary text-primary-foreground'
                  : state === 'done'
                    ? 'bg-primary/10 text-foreground'
                    : 'text-muted-foreground'
              }`}
            >
              <span className="tabular-nums">{index + 1}</span>
              {label}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function DetailsStep({
  draft,
  onChange,
}: {
  draft: PlanDraft
  onChange: (patch: Partial<PlanDraft>) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 text-sm sm:col-span-2">
        <span>عنوان برنامه *</span>
        <Input value={draft.title} onChange={(event) => onChange({ title: event.target.value })} />
      </label>

      <label className="space-y-1 text-sm sm:col-span-2">
        <span>توضیحات</span>
        <Input
          value={draft.description}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </label>

      <label className="space-y-1 text-sm">
        <span>دسترسی</span>
        <select
          className={fieldClass}
          value={draft.visibility}
          onChange={(event) => onChange({ visibility: Number(event.target.value) as PlanVisibility })}
        >
          <option value={PlanVisibility.Private}>خصوصی</option>
          <option value={PlanVisibility.Public}>عمومی</option>
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span>هدف</span>
        <select
          className={fieldClass}
          value={draft.goal}
          onChange={(event) => onChange({ goal: Number(event.target.value) as PlanGoal })}
        >
          {Object.entries(GOAL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label.fa}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span>سطح</span>
        <select
          className={fieldClass}
          value={draft.level}
          onChange={(event) => onChange({ level: Number(event.target.value) as PlanLevel })}
        >
          {Object.entries(LEVEL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label.fa}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span>نوع مدت</span>
        <select
          className={fieldClass}
          value={draft.durationType}
          onChange={(event) =>
            onChange({ durationType: Number(event.target.value) as PlanDurationType })
          }
        >
          <option value={PlanDurationType.Sessions}>جلسه</option>
          <option value={PlanDurationType.Weeks}>هفته</option>
        </select>
      </label>

      {draft.durationType === PlanDurationType.Sessions ? (
        <label className="space-y-1 text-sm">
          <span>تعداد جلسات *</span>
          <Input
            type="number"
            min={1}
            value={draft.totalSessions}
            onChange={(event) => onChange({ totalSessions: event.target.value })}
          />
        </label>
      ) : (
        <label className="space-y-1 text-sm">
          <span>تعداد هفته *</span>
          <Input
            type="number"
            min={1}
            value={draft.durationWeeks}
            onChange={(event) => onChange({ durationWeeks: event.target.value })}
          />
        </label>
      )}

      <div className="space-y-1 text-sm sm:col-span-2">
        <span>شاگرد {draft.visibility === PlanVisibility.Private ? '*' : '(اختیاری)'}</span>
        <MemberPicker
          valueLabel={draft.assignedMemberName ?? null}
          onSelect={(member) =>
            onChange({
              assignedMemberUserId: member?.id ?? null,
              assignedMemberName: member?.name ?? null,
            })
          }
          placeholder="انتخاب شاگرد…"
        />
        {draft.visibility === PlanVisibility.Private && (
          <p className="text-muted-foreground text-xs leading-5">
            برنامه خصوصی فقط با انتخاب شاگرد ساخته و ذخیره می‌شود؛ سرور هم همین قاعده را
            بررسی می‌کند.
          </p>
        )}
      </div>
    </div>
  )
}

function ExercisesStep({
  days,
  activeDay,
  activeExercise,
  currentExercise,
  onChangeDay,
  onChangeExercise,
  onDaysChange,
  onDayChange,
  onExerciseChange,
  coverageRows,
  memberId,
  muscleIds,
  targetMuscles,
}: {
  days: DayDraft[]
  activeDay: number
  activeExercise: number
  currentExercise?: ExerciseDraft
  onChangeDay: (index: number) => void
  onChangeExercise: (index: number) => void
  onDaysChange: (days: DayDraft[]) => void
  onDayChange: (index: number, patch: Partial<DayDraft>) => void
  onExerciseChange: (dayIndex: number, exerciseIndex: number, patch: Partial<ExerciseDraft>) => void
  coverageRows: Array<{ exerciseId: string; targetSets?: number }>
  memberId?: string | null
  muscleIds: string[]
  targetMuscles: string[]
}) {
  const day = days[activeDay]
  if (!day) return null

  const addDay = () => {
    if (days.length >= MAX_DAYS) return
    onDaysChange([...days, blankDay(days.length)])
    onChangeDay(days.length)
    onChangeExercise(0)
  }

  const removeDay = (index: number) => {
    if (days.length === 1) return
    onDaysChange(days.filter((_, position) => position !== index))
    if (activeDay >= index) onChangeDay(Math.max(0, activeDay - 1))
  }

  const toggleMuscle = (slug: (typeof TARGET_MUSCLES)[number]) => {
    const muscles = day.muscles.includes(slug)
      ? day.muscles.filter((code) => code !== slug)
      : [...day.muscles, slug]
    onDayChange(activeDay, { muscles })
  }

  // A category chip is a shortcut: selecting it adds every muscle it holds, selecting it again
  // removes them. The individual chips stay available for a precise selection.
  const toggleGroup = (group: (typeof MUSCLE_GROUPS)[number]) => {
    const groupMuscles = group.muscles as readonly string[]
    const allSelected = groupMuscles.every((muscle) =>
      (day.muscles as readonly string[]).includes(muscle),
    )
    const muscles = allSelected
      ? day.muscles.filter((muscle) => !groupMuscles.includes(muscle))
      : [...new Set<string>([...day.muscles, ...groupMuscles])]
    onDayChange(activeDay, { muscles: muscles as typeof day.muscles })
  }

  const listFor = (key: DayPhaseKey) =>
    key === 'warmup' ? day.warmup : key === 'cooldown' ? day.cooldown : day.exercises

  const overallIndex = (phase: PlanDayPhase, index: number) =>
    phase === PlanDayPhase.Warmup
      ? index
      : phase === PlanDayPhase.Cooldown
        ? day.warmup.length + day.exercises.length + index
        : day.warmup.length + index

  const addExercise = (phase: PlanDayPhase, key: DayPhaseKey) => {
    const list = listFor(key)
    onDayChange(activeDay, { [key]: [...list, blankExercise(phase)] } as Partial<DayDraft>)
    onChangeExercise(overallIndex(phase, list.length))
  }

  const removeExercise = (index: number) => {
    const target = dayExercises(day)[index]
    if (!target) return

    const phase = target.phase
    const key: DayPhaseKey =
      phase === PlanDayPhase.Warmup ? 'warmup' : phase === PlanDayPhase.Cooldown ? 'cooldown' : 'exercises'
    const list = listFor(key)
    const position = index - overallIndex(phase, 0)

    onDayChange(activeDay, {
      [key]: list.filter((_, itemIndex) => itemIndex !== position),
    } as Partial<DayDraft>)
    onChangeExercise(Math.max(0, index - 1))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="روزهای برنامه">
        {days.map((item, index) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={index === activeDay}
            onClick={() => {
              onChangeDay(index)
              onChangeExercise(0)
            }}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
              index === activeDay ? 'border-primary bg-primary/10' : 'hover:bg-muted'
            }`}
          >
            {item.name || `روز ${index + 1}`}
          </button>
        ))}
      </div>

      {/* Day name and target muscles sit on the same screen as the movements, so a coach
          does not have to bounce between two steps to get one day configured. */}
      <div className="bg-muted/30 space-y-3 rounded-lg border p-3">
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-44 flex-1 space-y-1 text-sm">
            <span>نام روز</span>
            <Input
              value={day.name}
              onChange={(event) => onDayChange(activeDay, { name: event.target.value })}
            />
          </label>
          <Button type="button" size="sm" variant="outline" onClick={addDay} disabled={days.length >= MAX_DAYS}>
            <Plus className="ml-1 size-3.5" />
            روز جدید
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={days.length === 1}
            onClick={() => removeDay(activeDay)}
          >
            <Trash2 className="ml-1 size-3.5 text-destructive" />
            حذف روز
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold">
            عضلات هدف روز <span className="text-muted-foreground font-normal">(اختیاری)</span>
          </p>

          {/* Grouped categories first: a coach plans a day by push/pull/legs, not by eighteen
              anatomical chips. Picking a category selects all of its muscles at once. */}
          <div className="flex flex-wrap gap-1.5">
            {MUSCLE_GROUPS.map((group) => {
              const selectedCount = (group.muscles as readonly string[]).filter((muscle) =>
                (day.muscles as readonly string[]).includes(muscle),
              ).length
              const allSelected = selectedCount === group.muscles.length

              return (
                <button
                  key={group.code}
                  type="button"
                  aria-pressed={allSelected}
                  onClick={() => toggleGroup(group)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                    allSelected
                      ? 'border-primary bg-primary/10 text-foreground'
                      : selectedCount > 0
                        ? 'border-primary/40 text-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {group.label}
                  {selectedCount > 0 && !allSelected && (
                    <span className="text-muted-foreground"> · {selectedCount}</span>
                  )}
                </button>
              )
            })}
          </div>

          <details className="group">
            <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-[11px] font-semibold">
              انتخاب دقیق عضلات
            </summary>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TARGET_MUSCLES.map((slug) => {
                const selected = day.muscles.includes(slug)
                return (
                  <button
                    key={slug}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleMuscle(slug)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                      selected
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {MUSCLE_LABEL[slug] ?? slug}
                  </button>
                )
              })}
            </div>
          </details>

          <p className="text-muted-foreground text-[11px]">
            اگر عضله‌ای انتخاب نکنید، روز بدون محدودیت عضله ساخته می‌شود.
          </p>
        </div>
      </div>

      {/* The day is split into the sections the member actually performs: warm-up, the main
          work, then cool-down. Each section adds and orders its own exercises. */}
      <div className="space-y-2">
        {DAY_PHASES.map((section) => {
          const list = listFor(section.key)

          return (
            <div key={section.key} className="rounded-lg border p-2.5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold">{section.label}</p>
                  <p className="text-muted-foreground text-[10px]">{section.hint}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addExercise(section.phase, section.key)}
                >
                  <Plus className="ml-1 size-3.5" />
                  {section.phase === PlanDayPhase.Main ? 'حرکت' : 'افزودن'}
                </Button>
              </div>

              {list.length === 0 ? (
                <p className="text-muted-foreground text-[11px]">
                  {section.phase === PlanDayPhase.Main
                    ? 'هنوز حرکتی برای بخش اصلی اضافه نشده است.'
                    : 'این بخش خالی است و می‌توانید نادیده بگیرید.'}
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  {list.map((exercise, index) => {
                    const overall = overallIndex(section.phase, index)

                    return (
                      <button
                        key={exercise.key}
                        type="button"
                        aria-pressed={overall === activeExercise}
                        onClick={() => onChangeExercise(overall)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                          overall === activeExercise
                            ? 'border-primary bg-primary/10'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {index + 1}. {exercise.name || 'حرکت جدید'}
                        {exercise.type === PlanExerciseType.Superset && exercise.name2
                          ? ` + ${exercise.name2}`
                          : ''}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {currentExercise && (
        <div className="grid gap-4 rounded-lg border p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              حرکت {activeExercise + 1} از {dayExercises(day).length}
            </h3>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={dayExercises(day).length <= 1}
              onClick={() => removeExercise(activeExercise)}
            >
              <Trash2 className="ml-1 size-3.5 text-destructive" />
              حذف حرکت
            </Button>
          </div>

          <ExerciseEditor
            exercise={currentExercise}
            muscleIds={muscleIds}
            onChange={(patch) => onExerciseChange(activeDay, activeExercise, patch)}
          />
          </div>

          {/* The map sits beside the inputs and stays in view while the coach edits. */}
          <aside className="space-y-3 lg:border-r lg:border-border lg:pr-3">
            <PlanCoverageMap rows={coverageRows} targetMuscles={targetMuscles} />
            {memberId && <MemberRecoveryMap memberId={memberId} />}
          </aside>
        </div>
      )}

      {!currentExercise && (
        <PlanCoverageMap rows={coverageRows} targetMuscles={targetMuscles} />
      )}
    </div>
  )
}

const listForDay = (day: DayDraft, key: DayPhaseKey) =>
  key === 'warmup' ? day.warmup : key === 'cooldown' ? day.cooldown : day.exercises

function ReviewStep({
  draft,
  coverageRows,
  targetMuscles,
}: {
  draft: PlanDraft
  coverageRows: Array<{ exerciseId: string; targetSets?: number }>
  targetMuscles: string[]
}) {
  const duration =
    draft.durationType === PlanDurationType.Weeks
      ? `${draft.durationWeeks} هفته`
      : `${draft.totalSessions} جلسه`

  return (
    <div className="space-y-4">
      <dl className="grid gap-2 rounded-lg border p-3 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">عنوان</dt>
          <dd className="font-semibold">{draft.title || '—'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">دسترسی</dt>
          <dd>{draft.visibility === PlanVisibility.Private ? 'خصوصی' : 'عمومی'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">شاگرد</dt>
          <dd>{draft.assignedMemberName ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">مدت</dt>
          <dd>{duration}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">روزها / حرکات</dt>
          <dd>
            {draft.days.length} روز ·{' '}
            {draft.days.reduce((total, day) => total + dayExercises(day).length, 0)} حرکت
          </dd>
        </div>
      </dl>

      <ul className="space-y-2 text-sm">
        {draft.days.map((day, index) => (
          <li key={day.key} className="rounded-lg border p-3">
            <div className="font-semibold">
              روز {index + 1} · {day.name || '—'}
            </div>
            <div className="text-muted-foreground mt-1 text-xs">
              عضلات هدف: {day.muscles.map((slug) => MUSCLE_LABEL[slug] ?? slug).join('، ') || '—'}
            </div>
            <div className="mt-1 space-y-1">
              {DAY_PHASES.map((section) => {
                const list = listForDay(day, section.key)
                if (list.length === 0) return null

                return (
                  <div key={section.key} className="text-xs">
                    <span className="text-muted-foreground font-semibold">{section.label}: </span>
                    {list
                      .map((exercise) =>
                        exercise.type === PlanExerciseType.Superset && exercise.name2
                          ? `${exercise.name || 'بدون حرکت'} + ${exercise.name2}`
                          : exercise.name || 'بدون حرکت',
                      )
                      .join(' · ')}
                  </div>
                )
              })}
            </div>
          </li>
        ))}
      </ul>

      <PlanCoverageMap rows={coverageRows} targetMuscles={targetMuscles} />
    </div>
  )
}
