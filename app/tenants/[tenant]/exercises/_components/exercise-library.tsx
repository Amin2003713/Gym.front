'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useUserRoles } from '@/hooks/use-user-roles'
import { toast } from '@/lib/toast'

import { exerciseApi, exerciseCoverUrl, exerciseThumbUrl } from '../_api/exercise-api'
import type { ExerciseListItem } from '../_model/exercise.types'

import ExerciseDetailDialog from './exercise-detail-dialog'
import ExerciseError from './exercise-error'
import ExerciseFilters from './exercise-filters'
import ExerciseFormDialog from './exercise-form-dialog'
import ExerciseGrid from './exercise-grid'
import ExerciseLibraryHeader from './exercise-library-header'
import ExercisePagination from './exercise-pagination'

const PAGE_SIZE = 12
const SEARCH_DEBOUNCE_MS = 400

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

  // Debounce the search box: the server query only fires after the user
  // stops typing, instead of one request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await exerciseApi.list({
        pageNumber: page,
        pageSize: PAGE_SIZE,
        search: search.trim() || undefined,
        languageCode: 'fa',
      })
      setItems(result.results ?? [])
      setPageCount(result.pageCount ?? 0)
      setRowCount(result.rowCount ?? 0)
    } catch (e) {
      const err = e as { message?: string }
      setError(err.message || 'دریافت فهرست حرکات ناموفق بود.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    void load()
  }, [load])

  // Stable handlers passed down (cheap for the grid and dialog).
  const closeDetail = useCallback(() => setDetailId(null), [])
  const openCreate = useCallback(() => {
    setEditingId(null)
    setFormOpen(true)
  }, [])
  const openEdit = useCallback((id: string) => {
    setEditingId(id)
    setFormOpen(true)
  }, [])

  const remove = useCallback(
    async (item: ExerciseListItem) => {
      if (!window.confirm(`حرکت «${item.name}» حذف شود؟`)) return
      setDeletingId(item.id)
      try {
        await exerciseApi.delete(item.id)
        toast.success('حرکت حذف شد.')
        await load()
      } catch (e) {
        const err = e as { message?: string }
        toast.error(err.message || 'حذف حرکت ناموفق بود.')
      } finally {
        setDeletingId(null)
      }
    },
    [load],
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
        onRefresh={() => void load()}
        loading={loading}
      />

      <ExerciseFilters
        search={searchInput}
        onSearchChange={setSearchInput}
        onReset={() => {
          setSearchInput('')
          setSearch('')
          setPage(1)
        }}
      />

      {error ? (
        <ExerciseError message={error} onRetry={() => void load()} />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {rowCount.toLocaleString('fa-IR')} حرکت در فهرست سرور
          </p>

          <ExerciseGrid
            exercises={gridItems}
            loading={loading}
            onView={setDetailId}
            onEdit={canManage ? openEdit : undefined}
            onDelete={
              canManage
                ? (id) => void remove(items.find((x) => x.id === id)!)
                : undefined
            }
            deletingId={deletingId ?? undefined}
          />
        </>
      )}

      <ExercisePagination page={page} totalPages={pageCount} onPageChange={setPage} />

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
          onSaved={() => void load()}
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
