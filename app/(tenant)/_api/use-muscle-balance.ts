'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { exerciseApi } from '@/app/(tenant)/(console)/exercises/_api/exercise-api'
import type { ExerciseListItem } from '@/app/(tenant)/(console)/exercises/_model/exercise.types'
import { getWorkout, listMyWorkouts } from '@/app/(tenant)/_api/workout-api'
import { buildMuscleStats, type WorkoutMuscleStats } from '@/app/(tenant)/_model/muscle-balance'
import {
  normalizeSessionStatus,
  WorkoutSessionStatus,
  type SessionResponse,
  type WorkoutListItem,
} from '@/app/(tenant)/_model/workout.types'

export type BalanceRangeKey = '7' | '30' | '90' | 'all'

const RANGE_DAYS: Record<Exclude<BalanceRangeKey, 'all'>, number> = { '7': 7, '30': 30, '90': 90 }

const emptyStats: WorkoutMuscleStats = {
  perMuscle: {} as WorkoutMuscleStats['perMuscle'],
  totals: { sessions: 0, sets: 0, volumeKg: 0 },
  unmatchedExerciseIds: [],
}

/** Resolved exercise metadata, cached across renders and range changes. */
const META_CACHE = new Map<string, ExerciseListItem | null>()

/**
 * Finished sessions never change (the API only allows edits while a session is open), so their
 * detail stays for the tab's lifetime: switching ranges or refreshing rebuilds the report without
 * re-downloading the same sessions.
 */
const SESSION_CACHE = new Map<string, SessionResponse>()

/** Hard cap on detail requests per report, so a long history cannot fan out without bound. */
const MAX_SESSION_DETAILS = 120

/** Detail requests allowed in flight at once - a range switch must not flood the network. */
const DETAIL_CONCURRENCY = 6

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

/**
 * Loads session details with a bounded fan-out, reusing the cache and keeping the input order so
 * the charts stay chronological. One unavailable session is skipped instead of sinking the report.
 */
async function loadSessionDetails(ids: string[]): Promise<SessionResponse[]> {
  const rows: Array<SessionResponse | null> = new Array(ids.length).fill(null)
  let next = 0

  const worker = async () => {
    while (next < ids.length) {
      const index = next++
      const id = ids[index]
      const cached = SESSION_CACHE.get(id)

      if (cached) {
        rows[index] = cached
        continue
      }

      try {
        const session = await getWorkout(id)
        SESSION_CACHE.set(id, session)
        rows[index] = session
      } catch {
        // A single dropped session must not sink the whole report.
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(DETAIL_CONCURRENCY, ids.length) }, worker),
  )

  return rows.filter((row): row is SessionResponse => row !== null)
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
          // Completed = 2 (workout.types.ts); in-progress and abandoned rows are not history.
          if (normalizeSessionStatus(item.status) !== WorkoutSessionStatus.Completed) return false
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

      // 2) Details per session to recover per-exercise sets (bounded fan-out, cached, ordered).
      const fullSessions = await loadSessionDetails(
        collected
          .slice(0, MAX_SESSION_DETAILS)
          .map((item) => item.sessionId ?? item.id),
      )

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
    // Started on the next tick so the first render paints before the loading state flips.
    const timer = window.setTimeout(() => void load(), 0)

    return () => window.clearTimeout(timer)
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
