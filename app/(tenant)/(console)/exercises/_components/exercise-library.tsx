'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Loader2 } from '@/components/icons'
import { useAppLocale } from '@/hooks/use-app-locale'
import { useFigureGender } from '@/hooks/use-figure-gender'
import { useUserRoles } from '@/hooks/use-user-roles'
import { exerciseMediaSources, isAnimatedSource } from '@/lib/exercise-media'
import { muscleLoad } from '@/lib/muscle-mapping'
import { MUSCLE_MATCH_ALIASES } from '@/lib/muscles'
import { toast } from '@/lib/toast'


import { exerciseApi, exerciseCoverUrl, exerciseThumbUrl } from '../_api/exercise-api'
import { muscleApi } from '../_api/muscle-api'
import { equipmentLabel } from '../_model/exercise-equipment'
import { SHARED_EXERCISE_NOTICE, isUserOwnedExercise } from '../_model/exercise-ownership'
import type {
  ExerciseEquipmentOption,
  ExerciseListItem,
} from '../_model/exercise.types'

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
  const locale = useAppLocale()
  const { canManage, isTraineeOnly } = useUserRoles()
  const figureGender = useFigureGender()

  const [items, setItems] = useState<ExerciseListItem[]>([])
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [rowCount, setRowCount] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Equipment chips: multi-select, and kept here (not in the filter bar) so opening an
  // exercise and closing it again leaves the selection untouched.
  const [equipment, setEquipment] = useState<string[]>([])
  const [bodyPart, setBodyPart] = useState<string | null>(null)
  const [level, setLevel] = useState<string | null>(null)
  // Muscles picked on the body map; resolved to server ids once the muscle list arrives.
  const [muscles, setMuscles] = useState<string[]>([])
  const [muscleIdBySlug, setMuscleIdBySlug] = useState<Record<string, string>>({})
  const [equipmentOptions, setEquipmentOptions] = useState<ExerciseEquipmentOption[]>([])
  const [bodyPartOptions, setBodyPartOptions] = useState<ExerciseEquipmentOption[]>([])
  const [levelOptions, setLevelOptions] = useState<ExerciseEquipmentOption[]>([])
  const [missingEquipment, setMissingEquipment] = useState(0)
  const equipmentParam = useMemo(() => equipment.join(','), [equipment])
  const muscleIdsParam = useMemo(
    () => muscles.map((slug) => muscleIdBySlug[slug]).filter(Boolean).join(','),
    [muscleIdBySlug, muscles],
  )

  const [detailId, setDetailId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // View format (card / list / compact), persisted per browser.
  const [view, setView] = useState<ExerciseViewMode>('card')
  useEffect(() => {
    // Read the saved view after hydration so the first paint is deterministic.
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(VIEW_STORAGE_KEY)
      if (saved === 'list' || saved === 'compact' || saved === 'card') {
        setView(saved)
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])
  const changeView = useCallback((next: ExerciseViewMode) => {
    setView(next)
    window.localStorage.setItem(VIEW_STORAGE_KEY, next)
  }, [])
  const resetFilters = useCallback(() => {
    setSearchInput('')
    setSearch('')
    setEquipment([])
    setBodyPart(null)
    setLevel(null)
    setMuscles([])
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
          equipments: equipmentParam || undefined,
          bodyPart: bodyPart || undefined,
          level: level || undefined,
          muscleIds: muscleIdsParam || undefined,
          languageCode: locale,
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
    [bodyPart, equipmentParam, level, locale, muscleIdsParam, search],
  )

  // First load, search changes and refreshes always fetch page 1.
  useEffect(() => {
    const timer = window.setTimeout(() => void fetchPage(1), 0)
    return () => window.clearTimeout(timer)
  }, [fetchPage])

  // Chip counts come from the catalog itself; a failed call hides the chips but never
  // blocks the library itself.
  const loadEquipmentOptions = useCallback(async () => {
    try {
      // Two independent catalog reads in one round trip.
      const [result, muscleRows] = await Promise.all([
        exerciseApi.equipmentOptions(),
        muscleApi.list(),
      ])

      setEquipmentOptions(result.equipment ?? [])
      setBodyPartOptions(result.bodyParts ?? [])
      setLevelOptions(result.levels ?? [])
      setMissingEquipment(result.missing ?? 0)

      // The catalog names muscles canonically ("pectorals", "glutes"); the body map uses
      // plan slugs ("chest", "gluteal"). Match on normalized text through the alias table.
      const normalize = (value: string) =>
        value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()

      const byName = new Map<string, string>()
      for (const muscle of muscleRows) {
        byName.set(normalize(muscle.code), muscle.id)
        byName.set(normalize(muscle.anatomicalName), muscle.id)
      }

      const bySlug: Record<string, string> = {}
      for (const [slug, aliases] of Object.entries(MUSCLE_MATCH_ALIASES)) {
        for (const alias of aliases) {
          const id = byName.get(normalize(alias))
          if (id) {
            bySlug[slug] = id
            break
          }
        }
      }
      setMuscleIdBySlug(bySlug)
    } catch {
      setEquipmentOptions([])
      setBodyPartOptions([])
      setLevelOptions([])
      setMissingEquipment(0)
      setMuscleIdBySlug({})
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadEquipmentOptions(), 0)
    return () => window.clearTimeout(timer)
  }, [loadEquipmentOptions])

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
  }, [ensureOwned])

  const remove = useCallback(
    async (item: ExerciseListItem) => {
      const owned = await ensureOwnedId(item.id)
      if (!owned) return
      if (!window.confirm(`حرکت «${item.name}» حذف شود؟`)) return
      setDeletingId(item.id)
      try {
        await exerciseApi.delete(item.id)
        toast.success('حرکت حذف شد.')
        void loadEquipmentOptions()
        await fetchPage(1)
      } catch (e) {
        const err = e as { message?: string }
        toast.error(err.message || 'حذف حرکت ناموفق بود.')
      } finally {
        setDeletingId(null)
      }
    },
    [ensureOwnedId, fetchPage, loadEquipmentOptions],
  )

  const gridItems = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        // Cards use the thumbnail variant; the gallery inside the detail dialog upgrades to
        // preview/original. The card preloads the GIF only when a mouse hovers it.
        imageUrl: exerciseThumbUrl(item.cover) ?? exerciseCoverUrl(item.cover),
        hoverUrl: exerciseMediaSources(item.cover).find(isAnimatedSource) ?? null,
        muscleLevels: muscleLoad([{ bodyPart: item.bodyPart, target: item.target }]),
        equipment: item.equipmentGroup
          ? equipmentLabel(item.equipmentGroup, item.equipment)
          : (item.equipment ?? null),
        gender: figureGender,
      })),
    [figureGender, items],
  )

  return (      <div className="space-y-4 sm:space-y-5" dir="rtl">
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
        options={equipmentOptions}
        selected={equipment}
        onSelectedChange={setEquipment}
        bodyParts={bodyPartOptions}
        bodyPart={bodyPart}
        onBodyPartChange={setBodyPart}
        levels={levelOptions}
        level={level}
        onLevelChange={setLevel}
        muscles={muscles}
        onMusclesChange={setMuscles}
        missing={missingEquipment}
        onReset={resetFilters}
        resultCount={rowCount}
      />

      {error && items.length === 0 ? (
        <ExerciseError message={error} onRetry={() => void fetchPage(1)} />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {rowCount.toLocaleString('fa-IR')} حرکت
            {equipmentParam || bodyPart || level || muscles.length || search.trim()
              ? ' · نتیجهٔ فیلترها'
              : ''}
          </p>

          <ExerciseGrid
            exercises={gridItems}
            loading={loading && items.length === 0}
            view={view}
            onReset={resetFilters}
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
          onSaved={() => {
            void fetchPage(1)
            void loadEquipmentOptions()
          }}
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
