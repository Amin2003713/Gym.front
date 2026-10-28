'use client'

import { Eye, LoaderCircle, Pencil, Trash2 } from 'lucide-react'

export interface ExerciseCardItem {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
}

interface ExerciseCardProps {
  exercise: ExerciseCardItem
  onView: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  deleting?: boolean
}

export default function ExerciseCard({
  exercise,
  onView,
  onEdit,
  onDelete,
  deleting = false,
}: ExerciseCardProps) {
  return (
    <article className="bg-card overflow-hidden rounded-xl border transition hover:border-primary/40 hover:shadow-sm">
      <button
        type="button"
        onClick={() => onView(exercise.id)}
        className="bg-muted flex aspect-[16/9] w-full items-center justify-center overflow-hidden"
        aria-label={`نمایش جزئیات ${exercise.name}`}
      >
        {exercise.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={exercise.imageUrl}
            alt={exercise.name}
            className="h-full w-full object-contain p-2"
            loading="lazy"
          />
        ) : (
          <span className="text-muted-foreground text-sm">
            تصویر موجود نیست
          </span>
        )}
      </button>

      <div className="space-y-3 p-4">
        <button
          type="button"
          onClick={() => onView(exercise.id)}
          className="min-w-0 text-right font-semibold hover:text-primary"
        >
          {exercise.name}
        </button>

        {exercise.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {exercise.description}
          </p>
        )}

        <div className="flex gap-2 border-t pt-3">
          <button
            type="button"
            onClick={() => onView(exercise.id)}
            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border text-sm"
          >
            <Eye className="size-4" />
            جزئیات
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(exercise.id)}
              className="bg-primary/10 text-primary inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg text-sm"
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
              aria-label="حذف حرکت"
              className="text-destructive inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm disabled:opacity-50"
            >
              {deleting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
