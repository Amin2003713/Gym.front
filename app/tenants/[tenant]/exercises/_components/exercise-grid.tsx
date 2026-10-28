'use client'

import ExerciseCard, { type ExerciseCardItem } from './exercise-card'

interface ExerciseGridProps {
  exercises: ExerciseCardItem[]
  loading: boolean
  onView: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  deletingId?: string
}

export default function ExerciseGrid({
  exercises,
  loading,
  onView,
  onEdit,
  onDelete,
  deletingId,
}: ExerciseGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="animate-pulse overflow-hidden rounded-xl border"
          >
            <div className="bg-muted aspect-[16/9]" />
            <div className="space-y-3 p-4">
              <div className="bg-muted h-4 w-2/3 rounded" />
              <div className="bg-muted h-3 w-full rounded" />
              <div className="bg-muted h-9 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (exercises.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="font-medium">حرکتی پیدا نشد</p>
        <p className="text-muted-foreground mt-2 text-sm">
          عبارت جستجو را تغییر دهید یا یک حرکت جدید اضافه کنید.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          deleting={deletingId === exercise.id}
        />
      ))}
    </div>
  )
}
