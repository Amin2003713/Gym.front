'use client'

import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useUserRoles } from '@/hooks/use-user-roles'
import { toast } from '@/lib/toast'

import { exerciseApi, exerciseCoverUrl, exerciseThumbUrl } from '../_api/exercise-api'
import {
  SHARED_EXERCISE_NOTICE,
  isUserOwnedExercise,
} from '../_model/exercise-ownership'
import type { ExerciseListItem } from '../_model/exercise.types'

import ExerciseDetailDialog from './exercise-detail-dialog'
import ExerciseError from './exercise-error'
import ExerciseFilters from './exercise-filters'
import ExerciseFormDialog from './exercise-form-dialog'
import ExerciseGrid from './exercise-grid'
import ExerciseLibraryHeader, {
  type ExerciseViewMode,
} from './exercise-library-header'

const PAGE_SIZE = 12
const SEARCH_DEBOUNCE_MS = 400
const VIEW_STORAGE_KEY = 'exercise-library-view'

export default function ExerciseLibrary() {
  const { canManage, isTraineeOnly } = useUserRoles()

  const [items, setItems] = useState<ExerciseListItem[]>([])
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [rowCount, setRowCount] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [detailId, setDetailId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // View format (card / list / compact), persisted per browser.
  const [view, setView] = useState<ExerciseViewMode>('card')
  useEffect(() => {
    const saved = window.localStorage.getItem(VIEW_STORAGE_KEY)
    if (saved === 'list' || saved === 'compact' || saved === 'card') {
      setView(saved)
    }
  }, [])
  const changeView = useCallback((next: ExerciseViewMode) => {
    setView(next)
    window.localStorage.setItem(VIEW_STORAGE_KEY, next)
  }, [])

  const sentinelRef = useRef<HTMLDivElement>(null)
  const requestSeq = useRef(0)

  // Debounce the search box: the server query only fires after the user
  // stops typing, instead of one request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchPage = useCallback(
    async (targetPage: number) => {
      const seq = ++requestSeq.current
      setLoading(true)
      setError('')
      try {
        const result = await exerciseApi.list({
          pageNumber: targetPage,
          pageSize: PAGE_SIZE,
          search: search.trim() || undefined,
          languageCode: 'fa',
        })
        if (seq !== requestSeq.current) return
        const next = result.results ?? []
        setRowCount(result.rowCount ?? 0)
        setPageCount(result.pageCount ?? 0)
        setPage(targetPage)
        // Page 1 (first load, search or refresh) replaces the grid; deeper
        // pages are appended because of the infinite scroll.
        setItems((prev) => (targetPage === 1 ? next : [...prev, ...next]))
      } catch (e) {
        if (seq !== requestSeq.current) return
        const err = e as { message?: string }
        const message =
          err.message ||
          (targetPage === 1
            ? 'دریافت فهرست حرکات ناموفق بود.'
            : 'بارگذاری ادامه فهرست ناموفق بود.')
        setError(message)
        if (targetPage === 1) setItems([])
      } finally {
        if (seq === requestSeq.current) setLoading(false)
      }
    },
    [search],
  )

  // First load, search changes and refreshes always fetch page 1.
  useEffect(() => {
    void fetchPage(1)
  }, [fetchPage])

  const hasMore = page < pageCount

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    void fetchPage(page + 1)
  }, [fetchPage, hasMore, loading, page])

  // Infinite scroll: when the sentinel approaches the viewport, append the
  // next page instead of showing a «بعدی» button.
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasMore || loading || error) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore()
      },
      { rootMargin: '360px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [error, hasMore, loadMore, loading])

  // Stable handlers passed down (cheap for the grid and dialog).
  const closeDetail = useCallback(() => setDetailId(null), [])
  const openCreate = useCallback(() => {
    setEditingId(null)
    setFormOpen(true)
  }, [])
  // Ownership gate: list rows carry no owner marker, so the detail is fetched
  // once and the product rule (only tenant-created exercises are editable)
  // is enforced before the editor or delete-confirm opens.
  const ensureOwnedId = useCallback(async (id: string) => {
    try {
      const detail = await exerciseApi.get(id)
      if (isUserOwnedExercise(detail)) return true
      toast.error(SHARED_EXERCISE_NOTICE)
      return false
    } catch (e) {
      const err = e as { message?: string }
      toast.error(err.message || 'دریافت جزئیات حرکت ناموفق بود.')
      return false
    }
  }, [])
  const ensureOwned = useCallback(
    (id: string, whenOwned: () => void) => {
      void ensureOwnedId(id).then((owned) => {
        if (owned) whenOwned()
      })
    },
    [ensureOwnedId],
  )

  const openEdit = useCallback((id: string) => {
    void ensureOwned(id, () => {
      setEditingId(id)
      setFormOpen(true)
    })
  }, [])

  const remove = useCallback(
    async (item: ExerciseListItem) => {
      const owned = await ensureOwnedId(item.id)
      if (!owned) return
      if (!window.confirm(`حرکت «${item.name}» حذف شود؟`)) return
      setDeletingId(item.id)
      try {
        await exerciseApi.delete(item.id)
        toast.success('حرکت حذف شد.')
        await fetchPage(1)
      } catch (e) {
        const err = e as { message?: string }
        toast.error(err.message || 'حذف حرکت ناموفق بود.')
      } finally {
        setDeletingId(null)
      }
    },
    [fetchPage],
  )

  const gridItems = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        // Cards use the thumbnail variant; the gallery inside the detail
        // dialog upgrades to preview/original.
        imageUrl: exerciseThumbUrl(item.cover) ?? exerciseCoverUrl(item.cover),
      })),
    [items],
  )

  return (
    <div className="space-y-5" dir="rtl">
      <ExerciseLibraryHeader
        onCreate={canManage ? openCreate : undefined}
        onRefresh={() => void fetchPage(1)}
        loading={loading}
        view={view}
        onViewChange={changeView}
      />

      <ExerciseFilters
        search={searchInput}
        onSearchChange={setSearchInput}
        onReset={() => {
          setSearchInput('')
          setSearch('')
        }}
      />

      {error && items.length === 0 ? (
        <ExerciseError message={error} onRetry={() => void fetchPage(1)} />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {rowCount.toLocaleString('fa-IR')} حرکت در فهرست سرور
          </p>

          <ExerciseGrid
            exercises={gridItems}
            loading={loading && items.length === 0}
            view={view}
            onView={setDetailId}
            onEdit={canManage ? openEdit : undefined}
            onDelete={
              canManage
                ? (id) => void remove(items.find((x) => x.id === id)!)
                : undefined
            }
            deletingId={deletingId ?? undefined}
          />

          {error && items.length > 0 ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="text-sm text-destructive">{error}</p>
              <button
                type="button"
                onClick={() => void fetchPage(page + 1)}
                className="h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-muted"
              >
                تلاش دوباره
              </button>
            </div>
          ) : (
            <div ref={sentinelRef} aria-hidden="true" className="h-px" />
          )}

          {loading && items.length > 0 && (
            <p
              role="status"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <Loader2 className="size-4 animate-spin" />
              در حال بارگذاری ادامه فهرست…
            </p>
          )}

          {!loading && !error && !hasMore && items.length > 0 && (
            <p className="text-muted-foreground text-center text-xs">
              همهٔ {rowCount.toLocaleString('fa-IR')} حرکت نمایش داده شد.
            </p>
          )}
        </>
      )}

      {detailId && (
        <ExerciseDetailDialog
          exerciseId={detailId}
          onClose={closeDetail}
          onEdit={canManage ? openEdit : undefined}
        />
      )}

      {formOpen && (
        <ExerciseFormDialog
          open={formOpen}
          editingId={editingId}
          onOpenChange={setFormOpen}
          onSaved={() => void fetchPage(1)}
        />
      )}

      {isTraineeOnly && (
        <p className="text-xs text-muted-foreground">
          برای شاگردان کتابخانه به‌صورت فقط‌خواندنی نمایش داده می‌شود.
        </p>
      )}
    </div>
  )
}
