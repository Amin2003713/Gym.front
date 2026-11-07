'use client'

import { useState } from 'react'

import BodyMapPanel from '@/app/(tenant)/_components/progress/body-map-panel'
import {
  Dumbbell,
  Eye,
  LoaderCircle,
  Pencil,
  Trash2,
  TriangleAlert,
} from '@/components/icons'

export interface ExerciseCardItem {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  /**
   * Animated GIF source. The card shows the still frame first and swaps to this on hover, so a
   * card with motion does not download every GIF in the list up front.
   */
  hoverUrl?: string | null
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
 * Exercise card: stacked media-over-text on phones, horizontal from `sm` up. Hovering with a
 * mouse crossfades the still cover into the original GIF so the movement can be checked without
 * opening the detail dialog; touch devices keep the tap-to-open path and never fetch the GIF
 * just by scrolling.
 */
export default function ExerciseCard({
  exercise,
  onView,
  onEdit,
  onDelete,
  deleting = false,
}: ExerciseCardProps) {
  const [showGif, setShowGif] = useState(false)
  const [gifReady, setGifReady] = useState(false)

  const gifSrc =
    exercise.hoverUrl && exercise.hoverUrl !== exercise.imageUrl ? exercise.hoverUrl : null

  const startPreview = (pointerType: string) => {
    if (pointerType === 'mouse' && gifSrc) setShowGif(true)
  }

  const stopPreview = () => {
    setShowGif(false)
    setGifReady(false)
  }

  return (
    <article
      onPointerEnter={(event) => startPreview(event.pointerType)}
      onPointerLeave={stopPreview}
      className="bg-card cv-auto flex flex-col overflow-hidden rounded-xl border transition sm:flex-row sm:hover:border-primary/40 sm:hover:shadow-sm"
    >
      <button
        type="button"
        onClick={() => onView(exercise.id)}
        className="bg-muted relative flex aspect-[16/9] w-full shrink-0 items-center justify-center overflow-hidden border-b sm:aspect-auto sm:w-36 sm:self-stretch sm:border-b-0 sm:border-e"
        aria-label={`نمایش جزئیات ${exercise.name}`}
      >
        {exercise.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={exercise.imageUrl}
              alt={exercise.name}
              width={288}
              height={162}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
            {showGif && gifSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={gifSrc}
                src={gifSrc}
                alt=""
                aria-hidden
                className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
                  gifReady ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setGifReady(true)}
              />
            )}
            {showGif && gifSrc && gifReady && (
              <span className="bg-background/85 text-foreground pointer-events-none absolute bottom-1.5 start-1.5 rounded-full border px-1.5 py-0.5 text-[9px] font-bold">
                GIF
              </span>
            )}
          </>
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
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border text-xs sm:h-8"
          >
            <Eye className="size-4" />
            جزئیات
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(exercise.id)}
              className="bg-primary/10 text-primary inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs sm:h-8"
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
              className="text-destructive inline-flex h-10 w-10 items-center justify-center rounded-lg border text-xs disabled:opacity-50 sm:h-8 sm:w-auto sm:px-2.5"
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
