'use client'

import { Eye, LoaderCircle, Pencil, Trash2 } from '@/components/icons'

import ExerciseCard, { type ExerciseCardItem } from './exercise-card'
import type { ExerciseViewMode } from './exercise-library-header'

interface ExerciseGridProps {
  exercises: ExerciseCardItem[]
  loading: boolean
  view?: ExerciseViewMode
  onView: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  deletingId?: string
  /** Clears search and filters; shown as the empty state's first action. */
  onReset?: () => void
}

export default function ExerciseGrid({
  exercises,
  loading,
  view = 'card',
  onView,
  onEdit,
  onDelete,
  deletingId,
  onReset,
}: ExerciseGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="animate-pulse overflow-hidden rounded-lg border"
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
      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="font-medium">حرکتی پیدا نشد</p>
        <p className="text-muted-foreground mt-2 text-sm">
          عبارت جستجو یا فیلتر تجهیزات را تغییر دهید یا یک حرکت جدید اضافه کنید.
        </p>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="bg-primary text-primary-foreground mt-4 inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold"
          >
            پاک کردن فیلترها
          </button>
        )}
      </div>
    )
  }

  if (view === 'list') {
    return (
      <div className="space-y-3">
        {exercises.map((exercise) => (
          <ExerciseListRow
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

  if (view === 'compact') {
    return (
      <ul className="border-border border-t">
        {exercises.map((exercise) => (
          <li
            key={exercise.id}
            className="border-border hover:bg-muted/20 cv-auto flex items-center gap-2 border-b px-1 py-2"
          >
            {exercise.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={exercise.imageUrl}
                alt={exercise.name}
                width={40}
                height={40}
                className="bg-muted size-10 shrink-0 rounded-md object-contain p-0.5"
                loading="lazy"
                decoding="async"
              />
            )}
            <button
              type="button"
              onClick={() => onView(exercise.id)}
              className="focus-visible:ring-ring min-w-0 flex-1 truncate text-right text-sm font-medium outline-none hover:text-primary focus-visible:ring-[3px] focus-visible:ring-offset-2"
            >
              {exercise.name}
            </button>
            <CompactActions
              exercise={exercise}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              deleting={deletingId === exercise.id}
            />
          </li>
        ))}
      </ul>
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

function DetailActions({
  exercise,
  onView,
  onEdit,
  onDelete,
  deleting,
}: {
  exercise: ExerciseCardItem
  onView: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  deleting?: boolean
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => onView(exercise.id)}
        className="focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2"
        aria-label={`نمایش جزئیات ${exercise.name}`}
      >
        <Eye className="size-4" />
        جزئیات
      </button>

      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(exercise.id)}
          className="focus-visible:ring-ring bg-primary/10 text-primary inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2"
        >
          <Pencil className="size-4" />
          ویرایش
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(exercise.id)}
          disabled={deleting}
          aria-label={`حذف ${exercise.name}`}
          className="focus-visible:ring-ring text-destructive inline-flex h-9 items-center justify-center rounded-lg border px-3 outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {deleting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </button>
      )}
    </div>
  )
}

function ExerciseListRow({
  exercise,
  onView,
  onEdit,
  onDelete,
  deleting,
}: {
  exercise: ExerciseCardItem
  onView: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  deleting?: boolean
}) {
  return (
    <article className="bg-card hover:border-primary/40 cv-auto flex items-center gap-4 rounded-lg border p-3 transition hover:shadow-sm">
      <button
        type="button"
        onClick={() => onView(exercise.id)}
        className="bg-muted focus-visible:ring-ring h-20 w-32 shrink-0 overflow-hidden rounded-md outline-none"
        aria-label={`نمایش جزئیات ${exercise.name}`}
      >
        {exercise.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={exercise.imageUrl}
            alt={exercise.name}
            width={128}
            height={80}
            className="h-full w-full object-contain p-1"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="text-muted-foreground text-xs">بدون تصویر</span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onView(exercise.id)}
          className="focus-visible:ring-ring block w-full truncate text-right font-semibold outline-none hover:text-primary focus-visible:ring-[3px] focus-visible:ring-offset-2"
        >
          {exercise.name}
        </button>
        {exercise.description && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
            {exercise.description}
          </p>
        )}
      </div>

      <DetailActions
        exercise={exercise}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        deleting={deleting}
      />
    </article>
  )
}

function CompactActions({
  exercise,
  onView,
  onEdit,
  onDelete,
  deleting,
}: {
  exercise: ExerciseCardItem
  onView: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  deleting?: boolean
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => onView(exercise.id)}
        className="focus-visible:ring-ring text-muted-foreground hover:text-foreground inline-flex size-9 items-center justify-center rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2"
        aria-label={`نمایش جزئیات ${exercise.name}`}
      >
        <Eye className="size-4" />
      </button>

      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(exercise.id)}
          className="focus-visible:ring-ring text-muted-foreground hover:text-foreground inline-flex size-9 items-center justify-center rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2"
          aria-label={`ویرایش ${exercise.name}`}
        >
          <Pencil className="size-4" />
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(exercise.id)}
          disabled={deleting}
          className="focus-visible:ring-ring text-destructive hover:bg-destructive/10 inline-flex size-9 items-center justify-center rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 disabled:opacity-50"
          aria-label={`حذف ${exercise.name}`}
        >
          {deleting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </button>
      )}
    </div>
  )
}
