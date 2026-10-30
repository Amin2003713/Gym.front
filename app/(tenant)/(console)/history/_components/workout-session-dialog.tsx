'use client'

import { X } from 'lucide-react'

import type { SessionResponse } from '@/app/(tenant)/_model/workout.types'
import { normalizeSessionType } from '@/app/(tenant)/_model/workout.types'

interface Props {
  session: SessionResponse
  onClose: () => void
}

const weightFmt = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 })

export default function WorkoutSessionDialog({ session, onClose }: Props) {
  const exercises = session.exercises ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-card max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border p-5 shadow-xl sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{session.title || (normalizeSessionType(session.type) === 1 ? 'جلسه آزاد' : 'جلسه برنامه‌ای')}</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              {session.completedAt
                ? `پایان‌یافته در ${new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(session.completedAt))}`
                : session.startedAt
                  ? `شروع در ${new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(session.startedAt))}`
                  : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="text-muted-foreground hover:bg-muted/60 rounded-lg p-2"
          >
            <X className="size-4" />
          </button>
        </div>

        {exercises.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">حرکتی برای این جلسه ثبت نشده است.</p>
        ) : (
          <ul className="space-y-3">
            {exercises.map((exercise) => (
              <li key={`${exercise.exerciseId}-${exercise.exerciseOrder}`} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{exercise.exerciseName || exercise.exerciseId}</span>
                  <span className="text-muted-foreground text-xs">{exercise.sets?.length ?? 0} ست</span>
                </div>
                {exercise.sets?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {exercise.sets.map((set) => (
                      <span
                        key={set.setId}
                        className="bg-muted/50 text-muted-foreground rounded-md px-2 py-1 text-xs"
                        title={set.isWarmup ? 'ست گرم‌کردنی' : undefined}
                      >
                        {set.setNumber}: {weightFmt.format(set.reps)}×{weightFmt.format(set.weightKg)}
                        {set.rir != null ? ` · RIR ${weightFmt.format(set.rir)}` : ''}
                        {set.isWarmup ? ' (گرم‌کردن)' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
