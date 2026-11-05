'use client'

import { ChevronUp, LoaderCircle, RefreshCw, Search } from '@/components/icons'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useAppLocale } from '@/hooks/use-app-locale'

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
 */
export default function ExercisePicker({
  value,
  valueLabel,
  onSelect,
  placeholder = 'انتخاب حرکت…',
  muscleIds = [],
}: ExercisePickerProps) {
  const locale = useAppLocale()
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
    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-right text-sm transition hover:bg-muted/50 aria-selected:bg-muted'

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => (open ? close() : openPicker())}
        className="border-input bg-background flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          <ChevronUp className={`size-4 text-muted-foreground transition ${open ? '' : 'rotate-180'}`} />
        </span>
      </button>

      {open && (
        <div className="bg-card absolute z-50 mt-1 w-full overflow-hidden rounded-lg border shadow-lg">
          <div className="relative border-b p-2">
            <Search className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی نام حرکت…"
              aria-label="جستجوی حرکت"
              className="h-9 w-full rounded-lg border pr-9 pl-3 text-sm outline-none"
            />
          </div>

          <div
            ref={listRef}
            role="listbox"
            onScroll={handleScroll}
            className="max-h-80 overflow-y-auto p-1"
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoaderCircle className="size-5 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="space-y-2 p-4 text-center text-sm text-muted-foreground">
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
                    <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {[item.category, item.equipment, item.target].filter(Boolean).join(' · ') ||
                        item.exerciseType ||
                        ''}
                    </span>
                  </button>
                )
              })
            )}

            {loadingMore && (
              <div className="flex items-center justify-center py-3">
                <LoaderCircle className="size-4 animate-spin text-primary" />
              </div>
            )}
            {!loading && !loadingMore && items.length > 0 && page >= pageCount && (
              <p className="text-muted-foreground border-t py-2 text-center text-xs">
                همه حرکات نمایش داده شدند
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
