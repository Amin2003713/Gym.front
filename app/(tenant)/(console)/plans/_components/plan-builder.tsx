'use client'

import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import MemberPicker from '@/app/(tenant)/(console)/assignments/_components/member-picker'
import { MUSCLE_LABEL } from '@/app/(tenant)/_model/muscle-labels'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'

import { muscleApi, type MuscleOption } from '../../exercises/_api/muscle-api'
import { createPlan, getPlan, updatePlan } from '../_api/plan-api'
import {
  blankDraft,
  blankDay,
  blankExercise,
  draftFromDetail,
  draftToPayload,
  type DayDraft,
  type ExerciseDraft,
  type PlanDraft,
  TARGET_MUSCLES,
  validateDays,
  validateDetails,
  validateExercises,
} from '../_model/plan-draft'
import { GOAL_LABELS, LEVEL_LABELS } from '../_model/plan-labels'
import type { PlanGoal, PlanLevel, PlanVisibility } from '../_model/plan.types'

import ExerciseEditor from './exercise-editor'
import { MemberRecoveryMap } from './member-recovery-map'
import PlanCoverageMap from './plan-coverage-map'

const STEPS = ['اطلاعات برنامه', 'روزها و عضلات هدف', 'حرکات', 'بازبینی و ذخیره'] as const
const MAX_DAYS = 14
const LAST_STEP = STEPS.length - 1

const fieldClass = 'bg-background h-10 w-full rounded-md border px-3 text-sm'

export function PlanBuilder({ planId }: { planId?: string }) {
  const router = useRouter()
  const [draft, setDraft] = useState<PlanDraft>(blankDraft)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(!!planId)
  const [saving, setSaving] = useState(false)
  const [activeDay, setActiveDay] = useState(0)
  const [activeExercise, setActiveExercise] = useState(0)
  const [muscles, setMuscles] = useState<MuscleOption[]>([])

  useEffect(() => {
    if (!planId) return

    let alive = true
    getPlan(planId)
      .then((detail) => {
        if (alive) setDraft(draftFromDetail(detail))
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

  const patchDraft = useCallback(
    (patch: Partial<PlanDraft>) => setDraft((current) => ({ ...current, ...patch })),
    [],
  )

  const patchDay = useCallback(
    (index: number, patch: Partial<DayDraft>) =>
      setDraft((current) => ({
        ...current,
        days: current.days.map((day, dayIndex) => (dayIndex === index ? { ...day, ...patch } : day)),
      })),
    [],
  )

  const patchExercise = useCallback(
    (dayIndex: number, exerciseIndex: number, patch: Partial<ExerciseDraft>) =>
      setDraft((current) => ({
        ...current,
        days: current.days.map((day, index) =>
          index === dayIndex
            ? {
                ...day,
                exercises: day.exercises.map((exercise, position) =>
                  position === exerciseIndex ? { ...exercise, ...patch } : exercise,
                ),
              }
            : day,
        ),
      })),
    [],
  )

  const currentDay = draft.days[activeDay] ?? draft.days[0]
  const currentExercise = currentDay?.exercises[activeExercise] ?? currentDay?.exercises[0]

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
    if (index === 0) return validateDetails(draft)
    if (index === 1) return validateDays(draft)
    if (index === 2) return validateExercises(draft)
    return null
  }

  const goNext = () => {
    const problem = stepProblem(step)
    if (problem) return void toast.error(problem)
    setStep((current) => Math.min(current + 1, LAST_STEP))
  }

  const goBack = () => setStep((current) => Math.max(0, current - 1))

  const save = async () => {
    const problem = validateDetails(draft) ?? validateDays(draft) ?? validateExercises(draft)
    if (problem) return void toast.error(problem)

    setSaving(true)
    try {
      const payload = draftToPayload(draft)
      if (planId) await updatePlan(planId, payload)
      else await createPlan(payload)
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
        day.exercises
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
            یک جریان پیوسته: اطلاعات، روزها و عضلات هدف، حرکات، سپس بازبینی و ذخیره.
          </p>
        </div>
        <Button variant="ghost" onClick={() => router.push('/plans')}>
          بازگشت به فهرست
        </Button>
      </header>

      <StepIndicator step={step} />

      <section className="bg-card rounded-lg border p-4 shadow-sm sm:p-6">
        {step === 0 && <DetailsStep draft={draft} onChange={patchDraft} />}

        {step === 1 && (
          <DaysStep
            draft={draft}
            onChange={patchDraft}
            onDayChange={patchDay}
            onSelectDay={setActiveDay}
          />
        )}

        {step === 2 && currentDay && (
          <ExercisesStep
            days={draft.days}
            activeDay={activeDay}
            activeExercise={activeExercise}
            currentExercise={currentExercise}
            onChangeDay={setActiveDay}
            onChangeExercise={setActiveExercise}
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
          onChange={(event) => onChange({ visibility: event.target.value as PlanVisibility })}
        >
          <option value="Private">خصوصی</option>
          <option value="Public">عمومی</option>
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span>هدف</span>
        <select
          className={fieldClass}
          value={draft.goal}
          onChange={(event) => onChange({ goal: event.target.value as PlanGoal })}
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
          onChange={(event) => onChange({ level: event.target.value as PlanLevel })}
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
          onChange={(event) => onChange({ durationType: event.target.value as PlanDraft['durationType'] })}
        >
          <option value="Sessions">جلسه</option>
          <option value="Weeks">هفته</option>
        </select>
      </label>

      {draft.durationType === 'Sessions' ? (
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
        <span>شاگرد {draft.visibility === 'Private' ? '*' : '(اختیاری)'}</span>
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
        {draft.visibility === 'Private' && (
          <p className="text-muted-foreground text-xs leading-5">
            برنامه خصوصی فقط با انتخاب شاگرد ساخته و ذخیره می‌شود؛ سرور هم همین قاعده را
            بررسی می‌کند.
          </p>
        )}
      </div>
    </div>
  )
}

function DaysStep({
  draft,
  onChange,
  onDayChange,
  onSelectDay,
}: {
  draft: PlanDraft
  onChange: (patch: Partial<PlanDraft>) => void
  onDayChange: (index: number, patch: Partial<DayDraft>) => void
  onSelectDay: (index: number) => void
}) {
  const addDay = () => {
    if (draft.days.length >= MAX_DAYS) return
    onChange({ days: [...draft.days, blankDay(draft.days.length)] })
  }

  const removeDay = (index: number) => {
    if (draft.days.length === 1) return
    onChange({ days: draft.days.filter((_, position) => position !== index) })
  }

  const toggleMuscle = (index: number, slug: (typeof TARGET_MUSCLES)[number]) => {
    const day = draft.days[index]
    const muscles = day.muscles.includes(slug)
      ? day.muscles.filter((code) => code !== slug)
      : [...day.muscles, slug]
    onDayChange(index, { muscles })
  }

  return (
    <div className="space-y-4">
      {draft.days.map((day, index) => (
        <div key={day.key} className="rounded-lg border p-3">
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-52 flex-1 space-y-1 text-sm">
              <span>نام روز *</span>
              <Input
                value={day.name}
                onChange={(event) => {
                  onDayChange(index, { name: event.target.value })
                  onSelectDay(index)
                }}
              />
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={draft.days.length === 1}
              onClick={() => removeDay(index)}
            >
              <Trash2 className="ml-1 size-4 text-destructive" />
              حذف روز
            </Button>
          </div>

          <fieldset className="mt-3 space-y-2">
            <legend className="text-sm font-semibold">عضلات هدف *</legend>
            <p className="text-muted-foreground text-xs">
              فهرست حرکات قدم بعد بر اساس همین عضلات فیلتر می‌شود.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TARGET_MUSCLES.map((slug) => {
                const selected = day.muscles.includes(slug)
                return (
                  <button
                    key={slug}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleMuscle(index, slug)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      selected
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {MUSCLE_LABEL[slug] ?? slug}
                  </button>
                )
              })}
            </div>
          </fieldset>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addDay} disabled={draft.days.length >= MAX_DAYS}>
        <Plus className="ml-1 size-4" />
        روز جدید
      </Button>
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
  onDayChange: (index: number, patch: Partial<DayDraft>) => void
  onExerciseChange: (dayIndex: number, exerciseIndex: number, patch: Partial<ExerciseDraft>) => void
  coverageRows: Array<{ exerciseId: string; targetSets?: number }>
  memberId?: string | null
  muscleIds: string[]
  targetMuscles: string[]
}) {
  const day = days[activeDay]
  if (!day) return null

  const addExercise = () => {
    onDayChange(activeDay, { exercises: [...day.exercises, blankExercise()] })
    onChangeExercise(day.exercises.length)
  }

  const removeExercise = (index: number) => {
    if (day.exercises.length === 1) return
    onDayChange(activeDay, {
      exercises: day.exercises.filter((_, position) => position !== index),
    })
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

      <div className="flex flex-wrap items-center gap-1.5">
        {day.exercises.map((exercise, index) => (
          <button
            key={exercise.key}
            type="button"
            aria-pressed={index === activeExercise}
            onClick={() => onChangeExercise(index)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              index === activeExercise
                ? 'border-primary bg-primary/10'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {index + 1}. {exercise.name || 'حرکت جدید'}
          </button>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={addExercise}>
          <Plus className="ml-1 size-3.5" />
          حرکت
        </Button>
      </div>

      {currentExercise && (
        <div className="rounded-lg border p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              حرکت {activeExercise + 1} از {day.exercises.length}
            </h3>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={day.exercises.length === 1}
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
      )}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <PlanCoverageMap rows={coverageRows} targetMuscles={targetMuscles} />
        {memberId && <MemberRecoveryMap memberId={memberId} />}
      </div>
    </div>
  )
}

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
    draft.durationType === 'Weeks' ? `${draft.durationWeeks} هفته` : `${draft.totalSessions} جلسه`

  return (
    <div className="space-y-4">
      <dl className="grid gap-2 rounded-lg border p-3 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">عنوان</dt>
          <dd className="font-semibold">{draft.title || '—'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">دسترسی</dt>
          <dd>{draft.visibility === 'Private' ? 'خصوصی' : 'عمومی'}</dd>
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
            {draft.days.reduce((total, day) => total + day.exercises.length, 0)} حرکت
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
            <div className="mt-1 text-xs">
              {day.exercises.map((exercise) => exercise.name || 'بدون حرکت').join(' · ')}
            </div>
          </li>
        ))}
      </ul>

      <PlanCoverageMap rows={coverageRows} targetMuscles={targetMuscles} />
    </div>
  )
}
