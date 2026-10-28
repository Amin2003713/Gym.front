'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { ExerciseListItem } from '../../exercises/_model/exercise.types'
import { exerciseApi } from '../../exercises/_api/exercise-api'
import { getWorkout, listMyWorkouts } from '../../workouts/_api/workout-api'
import {
  normalizeSessionStatus,
  type SessionResponse,
  type WorkoutListItem,
} from '../../workouts/_model/workout.types'
import { buildMuscleStats, type WorkoutMuscleStats } from '../_model/muscle-balance'

export type BalanceRangeKey = '7' | '30' | '90' | 'all'

const RANGE_DAYS: Record<Exclude<BalanceRangeKey, 'all'>, number> = { '7': 7, '30': 30, '90': 90 }

const emptyStats: WorkoutMuscleStats = {
  perMuscle: {} as WorkoutMuscleStats['perMuscle'],
  totals: { sessions: 0, sets: 0, volumeKg: 0 },
  unmatchedExerciseIds: [],
}

/** Resolved exercise metadata, cached across renders and range changes. */
const META_CACHE = new Map<string, ExerciseListItem | null>()

function cutForRange(range: BalanceRangeKey, nowMs: number): number | null {
  if (range === 'all') return null
  return nowMs - RANGE_DAYS[range] * 24 * 3_600_000
}

/** Resolves metadata for the given exercise ids, in chunks, with caching. */
async function resolveMetadata(ids: string[], languageCode: string): Promise<Map<string, ExerciseListItem | null>> {
  const CHUNK = 40
  const result = new Map(META_CACHE)
  const missing = ids.filter((id) => !result.has(id))
  for (let index = 0; index < missing.length; index += CHUNK) {
    const chunk = missing.slice(index, index + CHUNK)
    try {
      const items = await exerciseApi.byIds(chunk, languageCode)
      for (const item of items ?? []) result.set(item.id, item)
      for (const id of chunk) if (!result.has(id)) result.set(id, null)
    } catch {
      for (const id of chunk) result.set(id, null)
    }
  }
  for (const [id, value] of result) META_CACHE.set(id, value)
  return result
}

export interface UseMuscleBalanceResult {
  sessions: SessionResponse[]
  listItems: WorkoutListItem[]
  stats: WorkoutMuscleStats
  loading: boolean
  error: string
  range: BalanceRangeKey
  setRange: (range: BalanceRangeKey) => void
  refetch: () => void
  /** Incomplete/other-unmatched ids surfaced for the UI to show a hint. */
  unmatchedExerciseIds: () => string[]
}

/**
 * Loads the session range (personal, or a member's when `memberId` is passed,
 * via the workout list endpoint), then joins it with exercise metadata to
 * build the trained/recovery body-map statistics.
 */
export function useMuscleBalance(options?: { memberId?: string | null }): UseMuscleBalanceResult {
  const memberId = options?.memberId ?? null
  const [range, setRangeState] = useState<BalanceRangeKey>('30')
  const [sessions, setSessions] = useState<SessionResponse[]>([])
  const [listItems, setListItems] = useState<WorkoutListItem[]>([])
  const [stats, setStats] = useState<WorkoutMuscleStats>(emptyStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)
  const nowRef = useRef(() => Date.now())

  const load = useCallback(async () => {
    const nowMs = nowRef.current()
    const cutoff = cutForRange(range, nowMs)
    setLoading(true)
    setError('')

    // 1) Session summaries (cursor-paginated until the window is covered).
    const collected: WorkoutListItem[] = []
    let cursor: string | null = null
    let exhausted = false
    try {
      // The workout list is joined with details page-by-page; hard stop at
      // ~120 sessions to keep the request burst bounded.
      for (let guard = 0; guard < 6 && !exhausted; guard += 1) {
        const raw = await listMyWorkouts('', cursor, 20, memberId ?? undefined)
        const shape = raw as { items?: WorkoutListItem[]; results?: WorkoutListItem[]; nextCursor?: string | null } | WorkoutListItem[]
        const items = Array.isArray(shape) ? shape : shape.items ?? shape.results ?? []
        const nextCursor = Array.isArray(shape) ? null : shape.nextCursor ?? null
        const windowed = items.filter((item) => {
          const status = normalizeSessionStatus(item.status)
          if (status !== undefined && status !== 1 /* Completed */) return false
          const start = item.startedAt ? new Date(item.startedAt).getTime() : undefined
          return start !== undefined && (cutoff === null || start >= cutoff)
        })
        collected.push(...windowed)
        const allFromOlderWindow = items.every((item) => {
          const start = item.startedAt ? new Date(item.startedAt).getTime() : undefined
          return start !== undefined && cutoff !== null && start < cutoff
        })
        exhausted = allFromOlderWindow || !nextCursor
        cursor = nextCursor
      }
      setListItems(collected)

      // 2) Details per session to recover per-exercise sets.
      const details = await Promise.all(
        collected.slice(0, 120).map((item) =>
          getWorkout(item.sessionId ?? item.id)
            .then((session) => session)
            .catch(() => null as unknown as SessionResponse),
        ),
      )
      const fullSessions = details.filter(Boolean) as SessionResponse[]

      // 3) Metadata for every distinct exercise, then the stats.
      const ids = Array.from(
        new Set(fullSessions.flatMap((s) => (s.exercises ?? []).map((e) => e.exerciseId))),
      )
      const metadata = await resolveMetadata(ids, 'fa')
      setSessions(fullSessions)
      setStats(buildMuscleStats(fullSessions, metadata))
    } catch (e) {
      const err = e as { message?: string }
      setError(err.message || 'دریافت آمار تمرین ناموفق بود.')
      setSessions([])
      setListItems([])
      setStats(emptyStats)
    } finally {
      setLoading(false)
    }
  }, [range, memberId])

  useEffect(() => {
    void load()
  }, [load, reloadToken])

  const setRange = useCallback((value: BalanceRangeKey) => setRangeState(value), [])
  const refetch = useCallback(() => setReloadToken((token) => token + 1), [])
  const unmatchedExerciseIds = useCallback(() => stats.unmatchedExerciseIds, [stats])

  return {
    sessions,
    listItems,
    stats,
    loading,
    error,
    range,
    setRange,
    refetch,
    unmatchedExerciseIds,
  }
}
