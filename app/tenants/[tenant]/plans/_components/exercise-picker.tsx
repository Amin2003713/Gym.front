'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronUp, LoaderCircle, RefreshCw, Search } from 'lucide-react'

import { exerciseApi } from '../../exercises/_api/exercise-api'
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
}

/**
 * Dropdown that lists exercises from the real exercise API with a search box,
 * equipment filter and infinite scroll; picking an item selects it instead of
 * asking the user to paste an exercise GUID.
 */
export default function ExercisePicker({
  value,
  valueLabel,
  onSelect,
  placeholder = 'انتخاب حرکت…',
}: ExercisePickerProps) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<ExerciseListItem[]>([])
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef<HTMLDivElement | null>(null)
  const requestIdRef = useRef(0)

  // Debounce the search box inside the dropdown.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  const load = useCallback(
    async (pageNumber: number) => {
      const requestId = ++requestIdRef.current
      if (pageNumber === 1) setLoading(true)
      else setLoadingMore(true)
      setError('')
      try {
        const result = await exerciseApi.list({
          pageNumber,
          pageSize: PAGE_SIZE,
          search: debouncedQuery.trim() || undefined,
          languageCode: 'fa',
        })
        if (requestId !== requestIdRef.current) return
        setPageCount(result.pageCount ?? 0)
        setItems((previous) =>
          pageNumber === 1 ? (result.results ?? []) : [...previous, ...(result.results ?? [])],
        )
        setPage(pageNumber)
      } catch (e) {
        if (requestId !== requestIdRef.current) return
        setError((e as { message?: string }).message || 'دریافت حرکات ناموفق بود.')
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [debouncedQuery],
  )

  useEffect(() => {
    if (!open) return
    void load(1)
  }, [open, load])

  // Infinite scroll: near the bottom, load the next page.
  const handleScroll = useCallback(() => {
    const node = listRef.current
    if (!node || loadingMore || loading) return
    if (page >= pageCount) return
    if (node.scrollTop + node.clientHeight >= node.scrollHeight - SCROLL_THRESHOLD_PX) {
      void load(page + 1)
    }
  }, [load, loading, loadingMore, page, pageCount])

  const selected = value
    ? {
        name: items.find((x) => x.id === value)?.name ?? valueLabel ?? value,
      }
    : null

  const close = () => {
    setOpen(false)
    setQuery('')
    setDebouncedQuery('')
    setItems([])
    setPage(1)
    setPageCount(0)
    setError('')
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
        onClick={() => (open ? close() : setOpen(true))}
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
        <div className="bg-card absolute z-50 mt-1 w-full overflow-hidden rounded-xl border shadow-lg">
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
            className="max-h-72 overflow-y-auto p-1"
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
                  onClick={() => void load(1)}
                  className="text-primary inline-flex items-center gap-1 text-xs"
                >
                  <RefreshCw className="size-3" /> تلاش دوباره
                </button>
              </div>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">حرکتی پیدا نشد.</p>
            ) : (
              items.map((item) => (
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
                  <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {[item.category, item.equipment, item.target].filter(Boolean).join(' · ') || item.exerciseType || ''}
                  </span>
                </button>
              ))
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
