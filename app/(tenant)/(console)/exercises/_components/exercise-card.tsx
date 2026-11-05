'use client'

import { Dumbbell, Eye, LoaderCircle, Pencil, Trash2, TriangleAlert } from '@/components/icons'

import BodyMapPanel from '@/app/(tenant)/_components/progress/body-map-panel'

export interface ExerciseCardItem {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  /** Primary/assisting muscles, shown as compact chips next to the instructions. */
  muscles?: string[]
  /** The same muscles as a body-map load, so the card can shade the figure. */
  muscleLevels?: Record<string, number>
  /** Figure the card draws; the library passes the signed-in member's. */
  gender?: 'male' | 'female'
  /** Persian tool label; null flags an exercise whose equipment was never filled in. */
  equipment?: string | null
}

interface ExerciseCardProps {
  exercise: ExerciseCardItem
  onView: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  deleting?: boolean
}

/**
 * Horizontal exercise card: the animated demo (GIF) sits on the left and the
 * instruction text on the right, so the movement and how to perform it are read
 * in one glance.
 */
export default function ExerciseCard({
  exercise,
  onView,
  onEdit,
  onDelete,
  deleting = false,
}: ExerciseCardProps) {
  return (
    <article className="bg-card flex overflow-hidden rounded-xl border transition hover:border-primary/40 hover:shadow-sm">
      <button
        type="button"
        onClick={() => onView(exercise.id)}
        className="bg-muted flex w-28 shrink-0 items-center justify-center overflow-hidden border-e sm:w-36"
        aria-label={`نمایش جزئیات ${exercise.name}`}
      >
        {exercise.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={exercise.imageUrl}
            alt={exercise.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-muted-foreground px-2 text-center text-xs">
            تصویر موجود نیست
          </span>
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
        <button
          type="button"
          onClick={() => onView(exercise.id)}
          className="min-w-0 truncate text-start font-semibold hover:text-primary"
        >
          {exercise.name}
        </button>

        {exercise.equipment ? (
          <span className="text-muted-foreground inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]">
            <Dumbbell className="size-3" aria-hidden />
            {exercise.equipment}
          </span>
        ) : (
          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
            <TriangleAlert className="size-3" aria-hidden />
            بدون تجهیزات
          </span>
        )}

        <div className="flex items-start gap-2">
          <p className="text-muted-foreground line-clamp-3 min-h-5 flex-1 text-sm leading-6">
            {exercise.description || 'دستورالعمل ثبت نشده است.'}
          </p>

          {exercise.muscleLevels && Object.keys(exercise.muscleLevels).length > 0 && (
            <BodyMapPanel
              body={exercise.gender}
              palette="load"
              load={exercise.muscleLevels}
              size="thumbnail"
              legend={false}
              className="bg-muted/30 w-16 shrink-0 rounded-lg border p-1 sm:w-20"
            />
          )}
        </div>

        {exercise.muscles && exercise.muscles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {exercise.muscles.slice(0, 4).map((muscle) => (
              <span
                key={muscle}
                className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-[11px]"
              >
                {muscle}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex gap-2 border-t pt-2">
          <button
            type="button"
            onClick={() => onView(exercise.id)}
            className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border text-xs"
          >
            <Eye className="size-4" />
            جزئیات
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(exercise.id)}
              className="bg-primary/10 text-primary inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs"
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
              className="text-destructive inline-flex h-8 items-center justify-center rounded-lg border px-2.5 text-xs disabled:opacity-50"
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
