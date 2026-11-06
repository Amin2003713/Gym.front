'use client'

import { ChevronUp, LoaderCircle, RefreshCw, Search, X } from '@/components/icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useAppLocale } from '@/hooks/use-app-locale'
import { useIsMobile } from '@/hooks/use-mobile'

import { exerciseApi, exerciseThumbUrl } from '../../exercises/_api/exercise-api'
import type { ExerciseListItem } from '../../exercises/_model/exercise.types'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 400
const SCROLL_THRESHOLD_PX = 80

export interface ExercisePickerSelection {
  id: string
  name: string
}

interface ExercisePickerProps {
  /** Currently selected exercise id (null clears it). */
  value?: string | null
  /** Label to show for the currently selected value before the picker resolves a name. */
  valueLabel?: string | null
  onSelect: (selection: ExercisePickerSelection | null) => void
  placeholder?: string
  /**
   * Selected body-map muscle ids. They are sent to the exercise API, which filters through its
   * ExerciseMuscle relation in the database - no muscle name is ever stored or matched here.
   */
  muscleIds?: string[]
}

/**
 * Dropdown that lists exercises from the real exercise API with a search box, muscle filter and
 * infinite scroll. Each row shows the catalog thumbnail so the coach recognises the movement
 * before opening it.
 *
 * On phones the same panel is portalled to the document as a bottom sheet: an absolutely
 * positioned list inside a scrolling dialog (the plan builder) was clipped and its name column was
 * squeezed to a few pixels by the meta text, which made the exercise menu unreadable.
 */
export default function ExercisePicker({
  value,
  valueLabel,
  onSelect,
  placeholder = 'انتخاب حرکت…',
  muscleIds = [],
}: ExercisePickerProps) {
  const locale = useAppLocale()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<ExerciseListItem[]>([])
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const listRef = useRef<HTMLDivElement | null>(null)
  const requestIdRef = useRef(0)

  const fetchPage = useCallback(
    (pageNumber: number, search: string) =>
      exerciseApi.list({
        pageNumber,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        languageCode: locale,
        muscleIds: muscleIds.length ? muscleIds.join(',') : undefined,
      }),
    [locale, muscleIds],
  )

  // Debounce the search box inside the dropdown.
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)
      setError('')
      setDebouncedQuery(query)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  // First page for the current search/filter. Results are applied after the await, so the effect
  // itself never writes state synchronously.
  useEffect(() => {
    if (!open) return
    const requestId = ++requestIdRef.current
    let cancelled = false

    void (async () => {
      try {
        const result = await fetchPage(1, debouncedQuery.trim())
        if (cancelled || requestId !== requestIdRef.current) return
        setItems(result.results ?? [])
        setPageCount(result.pageCount ?? 0)
        setPage(1)
        setError('')
      } catch (e) {
        if (cancelled || requestId !== requestIdRef.current) return
        setError((e as { message?: string }).message || 'دریافت حرکات ناموفق بود.')
      } finally {
        if (!cancelled && requestId === requestIdRef.current) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, debouncedQuery, fetchPage, reloadKey])

  const loadNextPage = useCallback(async () => {
    const nextPage = page + 1
    const requestId = ++requestIdRef.current
    setLoadingMore(true)
    try {
      const result = await fetchPage(nextPage, debouncedQuery.trim())
      if (requestId !== requestIdRef.current) return
      setItems((previous) => [...previous, ...(result.results ?? [])])
      setPageCount(result.pageCount ?? 0)
      setPage(nextPage)
    } catch (e) {
      if (requestId !== requestIdRef.current) return
      setError((e as { message?: string }).message || 'دریافت حرکات ناموفق بود.')
    } finally {
      if (requestId === requestIdRef.current) setLoadingMore(false)
    }
  }, [debouncedQuery, fetchPage, page])

  // Infinite scroll: near the bottom, load the next page.
  const handleScroll = useCallback(() => {
    const node = listRef.current
    if (!node || loadingMore || loading) return
    if (page >= pageCount) return
    if (node.scrollTop + node.clientHeight >= node.scrollHeight - SCROLL_THRESHOLD_PX) {
      void loadNextPage()
    }
  }, [loadNextPage, loading, loadingMore, page, pageCount])

  const selected = value
    ? {
        name: items.find((x) => x.id === value)?.name ?? valueLabel ?? value,
      }
    : null

  const openPicker = () => {
    setLoading(true)
    setError('')
    setOpen(true)
  }

  const close = () => {
    setOpen(false)
    setLoading(false)
    setLoadingMore(false)
    setQuery('')
    setDebouncedQuery('')
    setItems([])
    setPage(1)
    setPageCount(0)
    setError('')
  }

  const retry = () => {
    setLoading(true)
    setError('')
    setReloadKey((key) => key + 1)
  }

  const clear = (event: React.MouseEvent) => {
    event.stopPropagation()
    onSelect(null)
  }

  const rowClass =
    'flex min-h-12 w-full items-center gap-3 rounded-lg px-2 py-2 text-start text-sm transition hover:bg-muted/50 aria-selected:bg-muted sm:min-h-0 sm:px-3'

  const panel = (
    <>
      <div className="relative border-b p-2">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجوی نام حرکت…"
          aria-label="جستجوی حرکت"
          inputMode="search"
          className="bg-background h-11 w-full rounded-lg border pr-9 pl-3 text-base outline-none sm:h-9 sm:text-sm"
        />
      </div>

      <div
        ref={listRef}
        role="listbox"
        onScroll={handleScroll}
        className="max-h-[60svh] overflow-y-auto overscroll-contain p-1 sm:max-h-80"
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoaderCircle className="text-primary size-5 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-muted-foreground space-y-2 p-4 text-center text-sm">
            <p>{error}</p>
            <button
              type="button"
              onClick={retry}
              className="text-primary inline-flex items-center gap-1 text-xs"
            >
              <RefreshCw className="size-3" /> تلاش دوباره
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            {muscleIds.length > 0
              ? 'برای عضلات انتخاب‌شده حرکتی پیدا نشد؛ جستجو را بازتر کنید.'
              : 'حرکتی پیدا نشد.'}
          </p>
        ) : (
          items.map((item) => {
            const thumb = exerciseThumbUrl(item.cover)
            const meta =
              [item.category, item.equipment, item.target].filter(Boolean).join(' · ') ||
              item.exerciseType ||
              ''

            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={item.id === value}
                onClick={() => {
                  onSelect({ id: item.id, name: item.name })
                  close()
                }}
                className={rowClass}
              >
                <span className="bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md">
                  {thumb ? (
                    // Remote catalog thumbnail (already sized for lists).
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="size-10 object-cover" />
                  ) : (
                    <span className="text-muted-foreground text-[10px]">—</span>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold sm:font-medium">{item.name}</span>
                  {/* Phones get the meta on its own line so the exercise name keeps its width. */}
                  <span className="text-muted-foreground mt-0.5 block truncate text-[11px] sm:hidden">
                    {meta}
                  </span>
                </span>

                <span className="text-muted-foreground hidden shrink-0 text-xs sm:inline">
                  {meta}
                </span>
              </button>
            )
          })
        )}

        {loadingMore && (
          <div className="flex items-center justify-center py-3">
            <LoaderCircle className="text-primary size-4 animate-spin" />
          </div>
        )}
        {!loading && !loadingMore && items.length > 0 && page >= pageCount && (
          <p className="text-muted-foreground border-t py-2 text-center text-xs">
            همه حرکات نمایش داده شدند
          </p>
        )}
      </div>
    </>
  )

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => (open ? close() : openPicker())}
        className="border-input bg-background focus-visible:ring-ring flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`min-w-0 truncate ${selected ? '' : 'text-muted-foreground'}`}>
          {selected ? selected.name : placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {selected && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="حذف انتخاب"
              onClick={clear}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onSelect(null)
              }}
              className="text-muted-foreground hover:text-destructive cursor-pointer text-xs underline"
            >
              حذف
            </span>
          )}
          <ChevronUp
            className={`text-muted-foreground size-4 transition ${open ? '' : 'rotate-180'}`}
          />
        </span>
      </button>

      {open && isMobile && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[80] sm:hidden" role="dialog" aria-modal="true">
              <button
                type="button"
                aria-label="بستن فهرست حرکات"
                onClick={close}
                className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
              />

              <div className="bg-card absolute inset-x-0 bottom-0 flex max-h-[88svh] flex-col overflow-hidden rounded-t-2xl border-t pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl">
                <div className="flex items-center justify-between gap-2 px-3 pt-3">
                  <div>
                    <p className="text-sm font-extrabold">انتخاب حرکت</p>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">
                      {muscleIds.length > 0
                        ? 'فهرست بر اساس عضلات انتخاب‌شده فیلتر شده است.'
                        : 'جستجو کنید یا از فهرست انتخاب کنید.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={close}
                    aria-label="بستن"
                    className="focus-visible:ring-ring inline-flex size-10 shrink-0 items-center justify-center rounded-lg outline-none focus-visible:ring-[3px]"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>

                <div className="bg-muted mx-auto my-2 h-1 w-10 shrink-0 rounded-full" aria-hidden />

                <div className="flex min-h-0 flex-1 flex-col">{panel}</div>
              </div>
            </div>,
            document.body,
          )
        : open && (
            <div className="bg-card border-border absolute z-50 mt-1 w-full overflow-hidden rounded-lg border shadow-lg">
              {panel}
            </div>
          )}
    </div>
  )
}
