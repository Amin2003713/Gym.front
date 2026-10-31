'use client'

import { Dumbbell, Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { MUSCLE_LABEL } from '@/app/(tenant)/_model/muscle-labels'
import BodyMap, { BodyMapLegend } from '@/features/gym/components/body-map'
import { useAppLocale } from '@/hooks/use-app-locale'
import { muscleLoad, muscleSlugs } from '@/lib/muscle-mapping'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { exerciseApi } from '../../exercises/_api/exercise-api'
import type { ExerciseListItem } from '../../exercises/_model/exercise.types'
import type { PlanDetail, PlanExerciseDetail } from '../_model/plan.types'
import { planGoalText, planLevelText } from '../_model/plan-labels'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

const repsLabel = (min?: number | null, max?: number | null) => {
  if (min != null && max != null && min !== max) return `${fa(min)}–${fa(max)}`
  if (min != null) return fa(min)
  if (max != null) return fa(max)
  return '—'
}

/**
 * Plan detail dialog.
 *
 * The plan payload only carries exercise ids and targets, so the dialog loads the exercise
 * summaries in ONE batched request (`by-ids`) and derives the muscle map from each exercise's
 * body part/target. Every day and every exercise therefore shows its own body map without one
 * request per row.
 */
export function PlanDetailDialog({
  plan,
  onClose,
}: {
  plan: PlanDetail
  onClose: () => void
}) {
  const locale = useAppLocale()
  const [exercises, setExercises] = useState<Record<string, ExerciseListItem>>({})
  const [loadingExercises, setLoadingExercises] = useState(false)
  const [exercisesFailed, setExercisesFailed] = useState(false)

  const exerciseIds = useMemo(
    () => [
      ...new Set(plan.days.flatMap((day) => day.exercises.map((item) => item.exerciseId))),
    ],
    [plan],
  )

  useEffect(() => {
    if (exerciseIds.length === 0) return

    let alive = true
    setLoadingExercises(true)
    setExercisesFailed(false)

    void exerciseApi
      .byIds(exerciseIds, 'fa')
      .then((rows) => {
        if (!alive) return
        setExercises(Object.fromEntries(rows.map((row) => [row.id, row])))
      })
      .catch(() => {
        if (alive) setExercisesFailed(true)
      })
      .finally(() => {
        if (alive) setLoadingExercises(false)
      })

    return () => {
      alive = false
    }
  }, [exerciseIds])

  // Close on Escape and keep the page behind the dialog from scrolling.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const loadOf = (exercise: PlanExerciseDetail) =>
    muscleLoad([
      {
        bodyPart: exercises[exercise.exerciseId]?.bodyPart,
        target: exercises[exercise.exerciseId]?.target,
      },
    ])

  const planLoad = useMemo(
    () =>
      muscleLoad(
        plan.days.flatMap((day) =>
          day.exercises.map((exercise) => ({
            bodyPart: exercises[exercise.exerciseId]?.bodyPart,
            target: exercises[exercise.exerciseId]?.target,
          })),
        ),
      ),
    [exercises, plan],
  )

  const exerciseCount = plan.days.reduce((sum, day) => sum + day.exercises.length, 0)
  const setCount = plan.days.reduce(
    (sum, day) =>
      sum + day.exercises.reduce((daySum, item) => daySum + (item.targetSets ?? 0), 0),
    0,
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px] sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-detail-title"
        className="bg-card flex max-h-[92svh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        dir="rtl"
      >
        <header className="flex items-start justify-between gap-3 border-b p-4 sm:p-5">
          <div className="min-w-0">
            <h2 id="plan-detail-title" className="truncate text-lg font-extrabold tracking-tight">
              {plan.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge>{planGoalText(plan.goal, locale)}</Badge>
              <Badge variant="secondary">{planLevelText(plan.level, locale)}</Badge>
              <Badge variant={plan.visibility === 'Public' ? 'default' : 'outline'}>
                {plan.visibility === 'Public' ? 'عمومی' : 'خصوصی'}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {plan.durationType === 'Sessions'
                  ? `${fa(plan.totalSessions ?? 0)} جلسه`
                  : `${fa(plan.durationWeeks ?? 0)} هفته`}
                {' · '}
                نسخه {fa(plan.currentVersion)}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="بستن">
            <X className="size-5" />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-4 p-4 sm:p-5">
            {plan.description && (
              <p className="text-muted-foreground text-sm leading-7">{plan.description}</p>
            )}

            <div className="grid gap-2 sm:grid-cols-3">
              <Stat label="روزهای تمرین" value={fa(plan.days.length)} />
              <Stat label="حرکات" value={fa(exerciseCount)} />
              <Stat label="مجموع ست هدف" value={fa(setCount)} />
            </div>

            <div className="grid gap-4 rounded-2xl border p-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="space-y-2">
                <h3 className="text-sm font-bold">پوشش عضلانی کل برنامه</h3>
                <p className="text-muted-foreground text-xs leading-6">
                  همه حرکات همه روزها در یک نقشه؛ عضله‌ای که در روزهای بیشتری تمرین داده شود
                  پررنگ‌تر دیده می‌شود.
                </p>
                {loadingExercises ? (
                  <p className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Loader2 className="size-3.5 animate-spin" />
                    در حال بارگذاری اطلاعات حرکات…
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {[...new Set(Object.keys(planLoad))].map((slug) => (
                      <span
                        key={slug}
                        className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      >
                        {MUSCLE_LABEL[slug] ?? slug}
                      </span>
                    ))}
                  </div>
                )}
                {exercisesFailed && (
                  <p className="text-destructive text-xs">
                    اطلاعات حرکات بارگذاری نشد؛ فهرست روزها همچنان قابل مشاهده است.
                  </p>
                )}
              </div>

              {Object.keys(planLoad).length > 0 && (
                <div className="border-t pt-3 lg:border-s lg:border-t-0 lg:pt-0 lg:ps-4">
                  <BodyMap body="male" palette="load" load={planLoad} />
                  <div className="mt-2 flex justify-center">
                    <BodyMapLegend palette="load" />
                  </div>
                </div>
              )}
            </div>

            {plan.days.length === 0 && (
              <p className="text-muted-foreground py-6 text-center text-sm">
                روزی برای این برنامه ثبت نشده است.
              </p>
            )}

            {plan.days.map((day) => {
              const dayLoad = muscleLoad(
                day.exercises.map((exercise) => ({
                  bodyPart: exercises[exercise.exerciseId]?.bodyPart,
                  target: exercises[exercise.exerciseId]?.target,
                })),
              )

              return (
                <section key={day.dayNumber} className="rounded-2xl border">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3 sm:p-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg text-xs font-bold">
                        {fa(day.dayNumber)}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold">{day.name || `روز ${fa(day.dayNumber)}`}</h3>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {fa(day.exercises.length)} حرکت ·{' '}
                          {fa(day.exercises.reduce((sum, item) => sum + (item.targetSets ?? 0), 0))} ست
                        </p>
                      </div>
                    </div>

                    {Object.keys(dayLoad).length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 sm:w-20">
                          <BodyMap body="male" palette="load" load={dayLoad} />
                        </div>
                        <span className="text-muted-foreground hidden text-[10px] sm:inline">
                          عضلات این روز
                        </span>
                      </div>
                    )}
                  </div>

                  <ol className="divide-y">
                    {day.exercises.map((exercise, index) => {
                      const meta = exercises[exercise.exerciseId]
                      const load = loadOf(exercise)
                      const muscles = muscleSlugs(meta?.bodyPart, meta?.target)

                      return (
                        <li
                          key={exercise.id}
                          className="grid gap-3 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                        >
                          <span className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-full text-[11px] font-bold tabular-nums">
                            {fa(index + 1)}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {exercise.exerciseName || meta?.name || exercise.exerciseId}
                            </p>
                            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                              <span className="tabular-nums">
                                {fa(exercise.targetSets ?? 0)} ست ×{' '}
                                {repsLabel(exercise.targetRepsMin, exercise.targetRepsMax)} تکرار
                              </span>
                              {exercise.targetRir != null && (
                                <span>RIR {fa(exercise.targetRir)}</span>
                              )}
                              {exercise.restSeconds != null && (
                                <span>{fa(exercise.restSeconds)} ثانیه استراحت</span>
                              )}
                              {meta?.equipment && <span>{meta.equipment}</span>}
                            </div>

                            {muscles.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {muscles.map((slug) => (
                                  <span
                                    key={slug}
                                    className="bg-secondary rounded-full px-2 py-0.5 text-[10px]"
                                  >
                                    {MUSCLE_LABEL[slug] ?? slug}
                                  </span>
                                ))}
                              </div>
                            )}

                            {exercise.notes && (
                              <p className="text-muted-foreground mt-1.5 text-xs leading-5">
                                {exercise.notes}
                              </p>
                            )}
                          </div>

                          {Object.keys(load).length > 0 ? (
                            <div className="w-20 shrink-0 justify-self-end sm:w-24">
                              <BodyMap body="male" palette="load" load={load} />
                            </div>
                          ) : (
                            <div className="text-muted-foreground flex w-20 shrink-0 items-center justify-center sm:w-24">
                              {loadingExercises ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Dumbbell className="size-4 opacity-40" />
                              )}
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ol>
                </section>
              )
            })}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-2 border-t p-3 sm:p-4">
          <span className="text-muted-foreground text-xs">
            {fa(plan.days.length)} روز · {fa(exerciseCount)} حرکت
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            بستن
          </Button>
        </footer>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-lg font-extrabold tracking-tight tabular-nums">{value}</p>
    </div>
  )
}
