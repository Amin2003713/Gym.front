'use client'

import { Dumbbell, History, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  listRecentExercises,
  searchExercises,
} from '@/app/(tenant)/_api/workout-api'
import type {
  ExerciseSearchItem,
  RecentExerciseItem,
} from '@/app/(tenant)/_model/workout.types'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/toast'

const PAGE_SIZE = 20

const lastPerformedLabel = (iso?: string | null) =>
  iso
    ? `آخرین اجرا ${new Intl.DateTimeFormat('fa-IR', {
        day: 'numeric',
        month: 'short',
      }).format(new Date(iso))}`
    : 'هنوز اجرا نشده'

export function MemberLibrary() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<ExerciseSearchItem[]>([])
  const [recent, setRecent] = useState<RecentExerciseItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listRecentExercises()
      .then(setRecent)
      .catch(() => setRecent([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    const handle = window.setTimeout(async () => {
      setLoading(true)

      try {
        const page = await searchExercises({
          query,
          page: 1,
          pageSize: PAGE_SIZE,
        })

        if (cancelled) return
        setItems(page.items ?? [])
        setTotal(page.total ?? 0)
      } catch (error) {
        if (cancelled) return
        toast.error('جست‌وجوی حرکات ناموفق بود', {
          description: error instanceof Error ? error.message : undefined,
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [query])

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">کتابخانه حرکات</h1>
        <p className="text-muted-foreground text-sm">
          حرکت را جست‌وجو کن و ببین چه تجهیزاتی می‌خواهد.
        </p>
      </header>

      <label className="relative block">
        <Search className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="نام حرکت، عضله یا تجهیزات"
          aria-label="جست‌وجوی حرکت"
          className="border-input bg-card focus-visible:ring-ring h-11 w-full rounded-xl border pr-9 text-sm outline-none focus-visible:ring-2"
        />
      </label>

      {recent.length > 0 && !query && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <History className="text-muted-foreground size-4" />
            اخیراً اجرا شده
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recent.slice(0, 10).map((item) => (
              <button
                key={item.exerciseId}
                onClick={() => setQuery(item.name ?? '')}
                className="bg-card hover:border-primary/40 shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold"
              >
                {item.name ?? 'حرکت'}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>{loading ? 'در حال جست‌وجو…' : `${total.toLocaleString('fa-IR')} حرکت`}</span>
        </div>

        {loading && items.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-card flex flex-col items-center gap-2 rounded-2xl border border-dashed p-8 text-center">
            <Dumbbell className="text-muted-foreground size-6" />
            <p className="text-sm font-semibold">حرکتی پیدا نشد</p>
            <p className="text-muted-foreground text-xs">
              عبارتی کوتاه‌تر امتحان کن، مثلاً «پرس» یا «اسکوات».
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="bg-card flex items-start gap-3 rounded-xl border p-3 shadow-sm"
              >
                <span className="bg-primary/12 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <Dumbbell className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{item.name}</p>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {[item.bodyPart, item.equipment, item.level]
                      .filter(Boolean)
                      .join(' · ') || 'بدون دسته‌بندی'}
                  </p>
                  <p className="text-muted-foreground/80 mt-1 text-[11px]">
                    {lastPerformedLabel(item.lastPerformedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
