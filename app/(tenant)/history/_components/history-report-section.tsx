'use client'

import { Activity, CalendarCheck, Dumbbell, Timer } from 'lucide-react'
import { useMemo, useState } from 'react'


import { normalizeSessionType, type WorkoutListItem } from '../../workouts/_model/workout.types'

interface Props {
  sessions: WorkoutListItem[]
  loading: boolean
}

const numFmt = new Intl.NumberFormat('fa-IR')

/**
 * Report/summary section for the workout history page, computed from the
 * sessions returned by the workout API (no separate report endpoint exists).
 */
export default function HistoryReportSection({ sessions, loading }: Props) {
  // Captured once so the memo stays pure; "today" shifting mid-session is irrelevant here.
  const [now] = useState(() => Date.now())
  const report = useMemo(() => {
    let totalVolume = 0
    let totalSets = 0
    let totalMinutes = 0
    let totalExercises = 0
    let thisWeek = 0
    const weekStart = now - 7 * 24 * 60 * 60 * 1000

    const perExercise = new Map<string, number>()
    for (const item of sessions) {
      totalVolume += item.totalVolumeKg ?? 0
      totalSets += item.totalSets ?? 0
      totalExercises += item.distinctExercises ?? 0
      const start = item.startedAt ? new Date(item.startedAt).getTime() : undefined
      const end = item.completedAt ? new Date(item.completedAt).getTime() : undefined
      if (start && end && end > start) totalMinutes += (end - start) / 60000
      if (start && start >= weekStart) thisWeek += 1
      const key = item.title || (normalizeSessionType(item.type) === 1 ? 'جلسه آزاد' : 'جلسه برنامه‌ای')
      perExercise.set(key, (perExercise.get(key) ?? 0) + 1)
    }
    const favourite = [...perExercise.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
    return {
      sessions: sessions.length,
      totalVolume: Math.round(totalVolume),
      totalSets,
      totalMinutes: Math.round(totalMinutes),
      avgExercises: sessions.length ? Math.round((totalExercises / sessions.length) * 10) / 10 : 0,
      thisWeek,
      favourite,
    }
  }, [sessions, now])

  const cards = [
    { label: 'جلسات ثبت‌شده', value: numFmt.format(report.sessions), hint: `${numFmt.format(report.thisWeek)} جلسه در ۷ روز اخیر`, icon: CalendarCheck },
    { label: 'حجم کل تمرین', value: `${numFmt.format(report.totalVolume)} kg`, hint: `${numFmt.format(report.totalSets)} ست ثبت‌شده`, icon: Activity },
    { label: 'زمان تمرین', value: `${numFmt.format(report.totalMinutes)} دقیقه`, hint: `میانگین ${numFmt.format(report.avgExercises)} حرکت در جلسه`, icon: Timer },
    { label: 'بیشترین تکرار', value: report.favourite, hint: 'بر اساس عنوان جلسات اخیر', icon: Dumbbell },
  ]

  return (
    <section aria-busy={loading} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, hint, icon: Icon }) => (
        <div key={label} className="bg-card rounded-lg border p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs font-medium">{label}</span>
            <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
              <Icon className="size-4" />
            </span>
          </div>
          <p className="mt-2 truncate text-lg font-bold" title={value}>
            {loading ? '…' : value}
          </p>
          <p className="text-muted-foreground mt-1 truncate text-xs">{hint}</p>
        </div>
      ))}
    </section>
  )
}
