'use client'

import { ChevronLeft, Timer } from 'lucide-react'

import { normalizeSessionType, type WorkoutListItem } from '@/app/(tenant)/_model/workout.types'

interface Props {
  sessions: WorkoutListItem[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  onOpen: (session: WorkoutListItem) => void
  onLoadMore: () => void
}

const dateFmt = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' })
const timeFmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' })
const numFmt = new Intl.NumberFormat('fa-IR')

const duration = (item: WorkoutListItem) => {
  const start = item.startedAt ? new Date(item.startedAt).getTime() : undefined
  const end = item.completedAt ? new Date(item.completedAt).getTime() : undefined
  if (!start || !end || end <= start) return null
  const minutes = Math.round((end - start) / 60000)
  if (minutes <= 0) return null
  return minutes
}

export default function WorkoutHistoryTable({ sessions, loading, loadingMore, hasMore, onOpen, onLoadMore }: Props) {
  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-lg border bg-card">
        <div className="animate-pulse text-sm text-muted-foreground">در حال دریافت جلسات…</div>
      </div>
    )
  }

  if (!sessions.length) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed bg-card text-center">
        <p className="text-sm font-semibold">هیچ جلسه ثبت‌شده‌ای نیست</p>
        <p className="text-muted-foreground mt-1 text-xs">اولین جلسه تمرین را در صفحه «تمرین امروز» ثبت کنید.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Mobile cards */}
      <ul className="space-y-2 lg:hidden">
        {sessions.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="bg-card hover:bg-muted/40 flex w-full flex-col gap-2 rounded-lg border p-4 text-right transition"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">{item.title || (normalizeSessionType(item.type) === 1 ? 'جلسه آزاد' : 'جلسه برنامه‌ای')}</span>
                <ChevronLeft className="text-muted-foreground size-4 shrink-0" />
              </div>
              <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span>{item.startedAt ? dateFmt.format(new Date(item.startedAt)) : '—'}</span>
                <span className="inline-flex items-center gap-1">
                  <Timer className="size-3" />
                  {duration(item) ? `${numFmt.format(duration(item)!)} دقیقه` : '—'}
                </span>
                <span>{numFmt.format(item.totalSets ?? 0)} ست</span>
                <span>{numFmt.format(item.distinctExercises ?? 0)} حرکت</span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="bg-card hidden overflow-hidden rounded-lg border lg:block">
        <table className="w-full text-right text-sm">
          <thead className="text-muted-foreground border-b text-xs">
            <tr>
              <th className="px-4 py-3 font-medium">عنوان</th>
              <th className="px-4 py-3 font-medium">تاریخ</th>
              <th className="px-4 py-3 font-medium">مدت</th>
              <th className="px-4 py-3 font-medium">ست‌ها</th>
              <th className="px-4 py-3 font-medium">حرکات</th>
              <th className="px-4 py-3 font-medium">حجم کل (کیلوگرم)</th>
              <th className="px-4 py-3" aria-label="جزئیات" />
            </tr>
          </thead>
          <tbody>
            {sessions.map((item) => (
              <tr
                key={item.id}
                onClick={() => onOpen(item)}
                className="hover:bg-muted/40 cursor-pointer border-b transition last:border-0"
              >
                <td className="max-w-[220px] truncate px-4 py-3 font-semibold">
                  {item.title || (normalizeSessionType(item.type) === 1 ? 'جلسه آزاد' : 'جلسه برنامه‌ای')}
                </td>
                <td className="text-muted-foreground px-4 py-3 text-xs">
                  {item.startedAt ? dateFmt.format(new Date(item.startedAt)) : '—'}
                  {item.startedAt ? ` · ${timeFmt.format(new Date(item.startedAt))}` : ''}
                </td>
                <td className="text-muted-foreground px-4 py-3 text-xs">
                  {duration(item) ? `${numFmt.format(duration(item)!)} دقیقه` : '—'}
                </td>
                <td className="px-4 py-3">{numFmt.format(item.totalSets ?? 0)}</td>
                <td className="px-4 py-3">{numFmt.format(item.distinctExercises ?? 0)}</td>
                <td className="px-4 py-3">{item.totalVolumeKg ? numFmt.format(Math.round(item.totalVolumeKg)) : '—'}</td>
                <td className="px-4 py-3">
                  <ChevronLeft className="text-muted-foreground size-4" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="text-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="border-input bg-background hover:bg-muted/60 inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-semibold disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <ChevronLeft className="size-4 animate-pulse" /> در حال بارگذاری…
              </>
            ) : (
              <>
                <ChevronLeft className="size-4" /> جلسات بیشتر
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
