'use client'

import { History, LoaderCircle, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'


import {
  getWorkout,
  listMyWorkouts,
} from '@/app/(tenant)/_api/workout-api'
import type { SessionResponse, WorkoutListItem, WorkoutSessionType } from '@/app/(tenant)/_model/workout.types'
import {
  normalizeSessionStatus,
  WorkoutSessionStatus,
} from '@/app/(tenant)/_model/workout.types'

import HistoryReportSection from './_components/history-report-section'
import WorkoutHistoryTable from './_components/workout-history-table'
import WorkoutSessionDialog from './_components/workout-session-dialog'

type NormalizedList = { items: WorkoutListItem[]; nextCursor: string | null }

const normalizeList = (raw: Awaited<ReturnType<typeof listMyWorkouts>>): NormalizedList => {
  const value = raw as { items?: WorkoutListItem[]; results?: WorkoutListItem[]; nextCursor?: string | null } | WorkoutListItem[]
  const items = Array.isArray(value) ? value : value.items ?? value.results ?? []
  const nextCursor = Array.isArray(value) ? null : value.nextCursor ?? null
  // Server may still return incomplete "InProgress" sessions; list only finished ones.
  // Status arrives as a numeric enum (see workout.types.ts) and normalizes both ways.
  const finished = items.filter(
    (item) => normalizeSessionStatus(item.status ?? 'Completed') === WorkoutSessionStatus.Completed,
  )
  return { items: finished, nextCursor }
}

export default function WorkoutHistoryPage() {
  const [type, setType] = useState<WorkoutSessionType | ''>('')
  const [sessions, setSessions] = useState<WorkoutListItem[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const [detail, setDetail] = useState<SessionResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const raw = await listMyWorkouts(type, null, 20)
      const normalized = normalizeList(raw)
      setSessions(normalized.items)
      setCursor(normalized.nextCursor)
      setHasMore(Boolean(normalized.nextCursor))
    } catch (e) {
      const err = e as { message?: string }
      setError(err.message || 'دریافت تاریخچه ناموفق بود.')
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    void load()
  }, [load])

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const raw = await listMyWorkouts(type, cursor, 20)
      const normalized = normalizeList(raw)
      setSessions((previous) => [...previous, ...normalized.items])
      setCursor(normalized.nextCursor)
      setHasMore(Boolean(normalized.nextCursor))
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [cursor, loadingMore, type])

  const openDetail = async (session: WorkoutListItem) => {
    setDetailError('')
    setDetail(null)
    setDetailLoading(true)
    try {
      const full = await getWorkout(session.sessionId ?? session.id)
      setDetail(full)
    } catch (e) {
      const err = e as { message?: string }
      setDetailError(err.message || 'دریافت جزئیات جلسه ناموفق بود.')
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <main dir="rtl" className="mx-auto w-full max-w-[1200px] space-y-5 p-3 sm:p-5">
      <header className="rounded-lg border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
              <History className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">تاریخچه تمرین</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                جلسات ثبت‌شده از API واقعی workout؛ برای جزئیات روی هر جلسه کلیک کنید.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="نوع جلسه"
              className="border-input bg-background h-10 rounded-md border px-3 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as WorkoutSessionType | '')}
            >
              <option value="">همه جلسات</option>
              <option value="0">برنامه‌ای</option>
              <option value="1">آزاد</option>
            </select>
            <button
              type="button"
              onClick={() => void load()}
              className="border-input bg-background hover:bg-muted/60 inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              بروزرسانی
            </button>
          </div>
        </div>
      </header>

      <HistoryReportSection sessions={sessions} loading={loading} />

      {error ? (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          {error}
        </div>
      ) : (
        <WorkoutHistoryTable
          sessions={sessions}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onOpen={openDetail}
          onLoadMore={() => void loadMore()}
        />
      )}

      {detailLoading && (
        <div className="flex items-center justify-center py-10">
          <LoaderCircle className="text-primary size-6 animate-spin" />
          <span className="text-muted-foreground ml-2 text-sm">در حال دریافت جزئیات جلسه…</span>
        </div>
      )}
      {detailError && !detailLoading && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          {detailError}
        </div>
      )}

      {detail && (
        <WorkoutSessionDialog session={detail} onClose={() => setDetail(null)} />
      )}
    </main>
  )
}

