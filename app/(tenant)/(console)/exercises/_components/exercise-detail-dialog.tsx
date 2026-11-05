'use client'

import { Dumbbell, LoaderCircle, Pencil, X } from '@/components/icons'
import { useEffect, useRef, useState } from 'react'

import BodyMapPanel from '@/app/(tenant)/_components/progress/body-map-panel'
import { toast } from '@/lib/toast'
import { muscleSlugs } from '@/lib/muscle-mapping'

import { exerciseApi } from '../_api/exercise-api'
import { mapExerciseMediaAssets, type ExerciseAsset } from '../_model/exercise-assets'
import type { ExerciseDetail } from '../_model/exercise.types'

import ExerciseAssetGallery from './exercise-asset-gallery'

interface ExerciseDetailDialogProps {
  exerciseId: string | null
  onClose: () => void
  onEdit?: (exerciseId: string) => void
}

export default function ExerciseDetailDialog({
  exerciseId,
  onClose,
  onEdit,
}: ExerciseDetailDialogProps) {
  const [detail, setDetail] = useState<ExerciseDetail | null>(null)
  const [assets, setAssets] = useState<ExerciseAsset[]>([])
  const [loading, setLoading] = useState(false)

  // Keep the callbacks in refs so callbacks recreated by the parent on every
  // render never re-trigger the fetch effect (this caused an infinite
  // loading loop).
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!exerciseId) {
      setDetail(null)
      setAssets([])
      return
    }

    let active = true
    setLoading(true)
    setDetail(null)
    setAssets([])

    const load = async () => {
      try {
        const data = await exerciseApi.get(exerciseId, 'fa')
        if (!active) return
        setDetail(data)
        // Map the assets array from the detail payload; each media entry is
        // grouped with its thumbnail/preview/original variants and GIFs get
        // the 'animation' kind so the gallery plays them inline.
        setAssets(mapExerciseMediaAssets(data.media))
      } catch (error) {
        if (!active) return
        toast.error('جزئیات حرکت دریافت نشد.', {
          description: error instanceof Error ? error.message : 'خطای ناشناخته',
        })
        onCloseRef.current()
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [exerciseId])

  if (!exerciseId) return null

  // Dedupe tags: the same value can arrive in several fields (e.g. target
  // 'waist' and bodyPart 'waist'), which caused duplicate React keys.
  const tags = Array.from(
    new Set(
      [
        detail?.category,
        detail?.bodyPart,
        detail?.equipment,
        detail?.target,
        detail?.level,
      ].filter(Boolean) as string[],
    ),
  )

  // Highlight what this exercise trains: primary muscles weigh more than secondary ones.
  const muscleLevels: Record<string, number> = {}

  for (const muscle of detail?.muscles ?? []) {
    for (const slug of muscleSlugs(muscle.code, muscle.name)) {
      muscleLevels[slug] = Math.max(muscleLevels[slug] ?? 0, muscle.role === 1 ? 3 : 1)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px] sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onCloseRef.current()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-detail-title"
        className="max-h-[90svh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 id="exercise-detail-title" className="font-bold">
            جزئیات حرکت
          </h2>
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="بستن"
            className="rounded-lg p-2 hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>

        {loading || !detail ? (
          <div className="flex h-56 items-center justify-center">
            <LoaderCircle className="size-7 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-5 p-4 sm:p-6">
            <div>
              <h3 className="text-lg font-bold">{detail.name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {detail.description || 'توضیحی ثبت نشده است.'}
              </p>
              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span key={`${tag}-${index}`} className="rounded-lg border px-2 py-1 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Demo on the left, instructions on the right (RTL: instructions render first). */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">دستورالعمل اجرا</h4>
                  {detail.instructions.length ? (
                    <ol className="text-muted-foreground mt-2 list-decimal space-y-2 pe-5 text-sm leading-6">
                      {[...detail.instructions]
                        .sort((a, b) => a.stepNumber - b.stepNumber)
                        .map((step) => (
                          <li key={step.stepNumber}>{step.text}</li>
                        ))}
                    </ol>
                  ) : (
                    <p className="text-muted-foreground mt-2 text-sm">
                      دستورالعملی ثبت نشده است.
                    </p>
                  )}
                </div>

                {detail.muscles.length > 0 && (
                  <div>
                    <h4 className="font-semibold">عضلات درگیر</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {detail.muscles.map((muscle, index) => (
                        <span
                          key={`${muscle.muscleId}-${muscle.role}-${index}`}
                          className="bg-secondary rounded-lg px-3 py-1.5 text-sm"
                        >
                          {muscle.name} · {muscle.role === 1 ? 'اصلی' : 'کمکی'}
                        </span>
                      ))}
                    </div>
                    {Object.keys(muscleLevels).length > 0 && (
                      <div className="mt-3">
                        <BodyMapPanel palette="load" load={muscleLevels} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                {assets.length > 0 ? (
                  <ExerciseAssetGallery assets={assets} />
                ) : (
                  <div className="bg-muted/30 flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
                    <Dumbbell className="text-muted-foreground size-8 opacity-60" />
                    <p className="text-muted-foreground text-sm">
                      رسانه‌ای برای این حرکت ثبت نشده است.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {onEdit && (
              <div className="flex justify-end border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    onCloseRef.current()
                    onEdit(detail.id)
                  }}
                  className="bg-primary text-primary-foreground inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold"
                >
                  <Pencil className="size-4" /> ویرایش حرکت
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
