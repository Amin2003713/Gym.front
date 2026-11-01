'use client'

import { useEffect, useState } from 'react'

import { Input } from '@/components/ui/input'

import { exerciseApi, exerciseCoverUrl } from '../../exercises/_api/exercise-api'
import type { ExerciseDetail } from '../../exercises/_model/exercise.types'
import type { ExerciseDraft } from '../_model/plan-draft'
import { PlanExerciseType } from '../_model/plan.types'

import ExercisePicker, { type ExercisePickerSelection } from './exercise-picker'

const REST_OPTIONS = [30, 45, 60, 75, 90, 120, 150, 180, 240, 300]

const TYPE_LABELS: Array<{ value: ExerciseDraft['type']; label: string; hint: string }> = [
  { value: PlanExerciseType.Standard, label: 'ست و تکرار', hint: 'ست × تکرار، با RIR اختیاری.' },
  { value: PlanExerciseType.Timed, label: 'زمان‌دار', hint: 'ست × مدت ثانیه؛ بدون تکرار.' },
  { value: PlanExerciseType.Superset, label: 'سوپرست', hint: 'دو حرکت در یک فرم، پشت سر هم و با استراحت مشترک.' },
]

interface ExerciseEditorProps {
  exercise: ExerciseDraft
  /** Selected muscle ids of the day; the API filters exercises by them. */
  muscleIds: string[]
  onChange: (patch: Partial<ExerciseDraft>) => void
}

/**
 * One exercise form. The media is a small preview beside the picker, and the fields sit in a
 * two-column grid so the coach keeps the body map in sight while editing.
 */
export default function ExerciseEditor({ exercise, muscleIds, onChange }: ExerciseEditorProps) {
  // The detail is tagged with the id it belongs to, so a slower response for a previously
  // selected exercise can never paint over the current one.
  const [resolved, setResolved] = useState<{ id: string; detail: ExerciseDetail } | null>(null)

  useEffect(() => {
    if (!exercise.exerciseId) return

    let alive = true
    exerciseApi
      .get(exercise.exerciseId, 'fa')
      .then((detail) => {
        if (alive) setResolved({ id: exercise.exerciseId, detail })
      })
      .catch(() => {
        if (alive) setResolved(null)
      })

    return () => {
      alive = false
    }
  }, [exercise.exerciseId])

  const detail = resolved?.id === exercise.exerciseId ? resolved.detail : null
  const cover = detail?.media?.length ? exerciseCoverUrl(detail.media[0]) : undefined
  const timed = exercise.type === PlanExerciseType.Timed
  const superset = exercise.type === PlanExerciseType.Superset

  const select = (selection: ExercisePickerSelection | null) =>
    onChange({ exerciseId: selection?.id ?? '', name: selection?.name ?? '' })

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[3.5rem_minmax(0,1fr)]">
        <div className="bg-muted flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={`تصویر ${exercise.name}`} className="h-14 w-14 object-contain" />
          ) : (
            <span className="text-muted-foreground text-[9px]">—</span>
          )}
        </div>

        <label className="min-w-0 space-y-1 text-sm">
          <span>حرکت *</span>
          <ExercisePicker
            value={exercise.exerciseId || null}
            valueLabel={exercise.name || null}
            muscleIds={muscleIds}
            onSelect={select}
          />
          {detail && (
            <span className="text-muted-foreground block truncate text-xs">
              {[detail.category, detail.equipment, detail.target].filter(Boolean).join(' · ')}
            </span>
          )}
        </label>
      </div>

      {superset && (
        <label className="min-w-0 space-y-1 text-sm">
          <span>حرکت دوم سوپرست *</span>
          <ExercisePicker
            value={exercise.exerciseId2 || null}
            valueLabel={exercise.name2 || null}
            muscleIds={muscleIds}
            onSelect={(selection) =>
              onChange({ exerciseId2: selection?.id ?? '', name2: selection?.name ?? '' })
            }
          />
          <span className="text-muted-foreground block text-xs">
            دو حرکت پشت سر هم و با استراحت مشترک انجام می‌شوند.
          </span>
        </label>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">نوع حرکت</legend>
        <div className="flex flex-wrap gap-2">
          {TYPE_LABELS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={exercise.type === option.value}
              onClick={() => onChange({ type: option.value })}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                exercise.type === option.value
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-muted-foreground text-xs">
          {TYPE_LABELS.find((option) => option.value === exercise.type)?.hint}
        </p>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>ست *</span>
          <Input
            type="number"
            min={1}
            max={20}
            value={exercise.sets}
            onChange={(event) => onChange({ sets: event.target.value })}
          />
        </label>

        {timed ? (
          <label className="space-y-1 text-sm">
            <span>مدت هر ست (ثانیه) *</span>
            <Input
              type="number"
              min={5}
              max={3600}
              value={exercise.durationSeconds}
              onChange={(event) => onChange({ durationSeconds: event.target.value })}
            />
          </label>
        ) : (
          <>
            <label className="space-y-1 text-sm">
              <span>حداقل تکرار</span>
              <Input
                type="number"
                min={1}
                max={100}
                value={exercise.repsMin}
                onChange={(event) => onChange({ repsMin: event.target.value })}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>حداکثر تکرار</span>
              <Input
                type="number"
                min={1}
                max={100}
                value={exercise.repsMax}
                onChange={(event) => onChange({ repsMax: event.target.value })}
              />
            </label>
          </>
        )}

        <label className="space-y-1 text-sm">
          <span>استراحت (ثانیه)</span>
          <Input
            type="number"
            min={0}
            max={600}
            value={exercise.restSeconds}
            onChange={(event) => onChange({ restSeconds: event.target.value })}
          />
        </label>

        {!timed && (
          <label className="space-y-1 text-sm">
            <span>RIR هدف</span>
            <Input
              type="number"
              min={0}
              max={10}
              value={exercise.rir}
              onChange={(event) => onChange({ rir: event.target.value })}
            />
          </label>
        )}



        <label className="space-y-1 text-sm sm:col-span-2">
          <span>یادداشت مربی</span>
          <Input
            value={exercise.notes}
            onChange={(event) => onChange({ notes: event.target.value })}
            placeholder="مثلاً: آخرین ست تا ناتوانی"
          />
        </label>
      </div>

      <p className="text-muted-foreground text-xs">
        استراحت‌های رایج: {REST_OPTIONS.join(' · ')} ثانیه
      </p>
    </div>
  )
}
