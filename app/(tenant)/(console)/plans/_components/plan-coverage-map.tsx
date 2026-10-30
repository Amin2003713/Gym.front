'use client'

import { useEffect, useMemo, useState } from 'react'

import { MUSCLES, type MuscleSlug } from '@/lib/muscles'

import { exerciseApi } from '../../exercises/_api/exercise-api'
import type { ExerciseListItem } from '../../exercises/_model/exercise.types'
import BodyMapPanel from '@/app/(tenant)/_components/progress/body-map-panel'
import { MUSCLE_LABEL } from '@/app/(tenant)/_model/muscle-labels'
import { exerciseMuscleWeights } from '@/app/(tenant)/_model/muscle-balance'

interface CoverageRow {
  exerciseId: string
  targetSets?: number
}

/**
 * Shows which muscles the exercises selected in the plan would train.
 * Load = instance count × planned sets per exercise, relative → green scale.
 */
export default function PlanCoverageMap({ rows }: { rows: CoverageRow[] }) {
  const [metadata, setMetadata] = useState<Map<string, ExerciseListItem | null>>(new Map())

  const uniqueIds = useMemo(
    () => Array.from(new Set(rows.map((row) => row.exerciseId).filter(Boolean))),
    [rows],
  )
  const idsSignature = uniqueIds.join(',')

  useEffect(() => {
    if (!idsSignature) return
    const ids = idsSignature.split(',')
    let alive = true
    exerciseApi
      .byIds(ids, 'fa')
      .then((items) => {
        if (!alive) return
        setMetadata(new Map((items ?? []).map((item) => [item.id, item] as const)))
      })
      .catch(() => {
        if (alive) setMetadata(new Map(ids.map((id) => [id, null] as const)))
      })
    return () => {
      alive = false
    }
  }, [idsSignature])

  const load = useMemo(() => {
    const raw: Partial<Record<MuscleSlug, number>> = {}
    for (const row of rows) {
      const exercise = metadata.get(row.exerciseId)
      const weights = exerciseMuscleWeights(exercise)
      const sets = Math.max(1, Number(row.targetSets) || 3)
      for (const [slug, weight] of Object.entries(weights) as Array<[MuscleSlug, number]>) {
        raw[slug] = (raw[slug] ?? 0) + weight * sets
      }
    }
    const max = Math.max(0, ...MUSCLES.map((slug) => raw[slug] ?? 0))
    const levels: Record<string, number> = {}
    for (const slug of MUSCLES) {
      const value = raw[slug] ?? 0
      levels[slug] = !value || max <= 0 ? 0 : Math.max(1, Math.min(4, Math.ceil((value / max) * 4)))
    }
    return levels
  }, [rows, metadata])

  const uncovered = useMemo(
    () => MUSCLES.filter((slug) => (load[slug] ?? 0) === 0).map((slug) => MUSCLE_LABEL[slug] ?? slug),
    [load],
  )

  if (uniqueIds.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs">
        پس از انتخاب حرکات، پوشش عضلانی برنامه اینجا نمایش داده می‌شود.
      </p>
    )
  }

  const missing = uniqueIds.length - metadata.size

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold">پوشش عضلانی برنامه</h4>
        <span className="text-muted-foreground text-xs">{uniqueIds.length} حرکت انتخاب‌شده</span>
      </div>
      <BodyMapPanel body="male" palette="load" load={load}/>
      {missing > 0 && (
        <p className="text-muted-foreground mt-2 text-xs">در حال دریافت جزئیات {missing} حرکت…</p>
      )}
      {uncovered.length > 0 && (
        <p className="text-muted-foreground mt-2 text-xs leading-6">
          عضلات بدون پوشش در این برنامه: <span className="font-semibold text-foreground">{uncovered.join('، ')}</span>
          {' — '}برای تعادل بیشتر حرکتی برای این نواحی اضافه کنید.
        </p>
      )}
    </div>
  )
}
