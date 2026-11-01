'use client'

import {
  Activity,
  BatteryCharging,
  HeartPulse,
  Loader2,
  Moon,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { listCoachAssignments } from '@/app/(tenant)/_api/assignment-api'
import {
  getMeasurementSummary,
  listMemberMeasurements,
} from '@/app/(tenant)/_api/training-api'
import { getWorkout, listMyWorkouts } from '@/app/(tenant)/_api/workout-api'
import BodyMapPanel from '@/app/(tenant)/_components/progress/body-map-panel'
import {
  PlanAssignmentStatus,
  type CoachAssignmentItem,
} from '@/app/(tenant)/_model/assignment.types'
import type { BodyMeasurement, MeasurementSummary } from '@/app/(tenant)/_model/training.types'
import type { SessionResponse, WorkoutListItem } from '@/app/(tenant)/_model/workout.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { muscleSlugs } from '@/lib/muscle-mapping'
import { toast } from '@/lib/toast'

import { MemberProgressPanel } from './member-progress-panel'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

const dateFmt = new Intl.DateTimeFormat('fa-IR', {
  month: 'short',
  day: 'numeric',
})

/** Days between now and a stored timestamp; null when the value is missing. */
function daysSince(value?: string | null): number | null {
  if (!value) return null
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return null
  return Math.max(0, Math.floor((Date.now() - time) / 86_400_000))
}

type MemberRow = {
  id: string
  name: string
  assignments: CoachAssignmentItem[]
  active: number
  completed: number
  total: number
}

/**
 * Coach overview for one member: the same page serves admins and trainers. Selecting a member
 * loads only that member's plan progress, measurements and the last few sessions, then derives a
 * muscle-load map and a per-muscle recovery estimate — the two things a coach needs before
 * writing the next block.
 */
export function CoachMemberReport() {
  const [rows, setRows] = useState<CoachAssignmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [summary, setSummary] = useState<MeasurementSummary | null>(null)
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [sessions, setSessions] = useState<SessionResponse[]>([])
  const [loadingMember, setLoadingMember] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listCoachAssignments({ pageSize: 200 })
      setRows(result.results ?? [])
    } catch (error) {
      toast.error('دریافت شاگردان ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Deferred one tick so the first render is not re-entered by the load's own setState calls.
    const timer = setTimeout(() => void load(), 0)
    return () => clearTimeout(timer)
  }, [load])

  const members = useMemo(() => {
    const map = new Map<string, MemberRow>()

    for (const row of rows) {
      const id = row.memberId ?? row.member?.userId
      if (!id) continue

      const name =
        `${row.member?.firstName ?? ''} ${row.member?.lastName ?? ''}`.trim() ||
        'عضو باشگاه'
      const current = map.get(id) ?? {
        id,
        name,
        assignments: [],
        active: 0,
        completed: 0,
        total: 0,
      }

      current.assignments.push(row)
      current.completed += row.completedSessions ?? 0
      current.total += Math.max(row.completedSessions ?? 0, row.totalSessions ?? 0)
      if (row.status === PlanAssignmentStatus.Active) current.active += 1
      map.set(id, current)
    }

    return [...map.values()].sort((a, b) => b.completed - a.completed)
  }, [rows])

  const visible = useMemo(() => {
    const term = search.trim()
    if (!term) return members
    return members.filter((member) => member.name.includes(term))
  }, [members, search])

  const selected = members.find((member) => member.id === selectedId) ?? null

  useEffect(() => {
    if (!selectedId) return

    let cancelled = false
    const timer = setTimeout(() => {
      setLoadingMember(true)

      void (async () => {
      try {
        const [summaryResult, measurementRows, workoutPage] = await Promise.all([
          getMeasurementSummary(selectedId).catch(() => null),
          listMemberMeasurements(selectedId, 1, 30).catch(() => []),
          listMyWorkouts('', null, 12, selectedId).catch(() => [] as WorkoutListItem[]),
        ])

        if (cancelled) return

        const items = Array.isArray(workoutPage)
          ? workoutPage
          : (workoutPage.items ?? workoutPage.results ?? [])

        // The list only carries headers; the body map needs the exercises, so fetch a bounded set.
        const loaded = await Promise.all(
          items.slice(0, 6).map((item) =>
            getWorkout(item.id ?? '').catch(() => null),
          ),
        )

        if (cancelled) return

        setSummary(summaryResult)
        setMeasurements(measurementRows)
        setSessions(loaded.filter((session): session is SessionResponse => session !== null))
      } catch (error) {
        if (!cancelled)
          toast.error('دریافت گزارش شاگرد ناموفق بود', {
            description: error instanceof Error ? error.message : undefined,
          })
      } finally {
        if (!cancelled) setLoadingMember(false)
      }
      })()
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [selectedId])

  const report = useMemo(() => {
    const load: Record<string, number> = {}
    const days: Record<string, number> = {}

    for (const session of sessions) {
      const day = daysSince(session.completedAt ?? session.startedAt)
      if (day === null) continue

      const volume = session.exercises.reduce(
        (sum, exercise) =>
          sum +
          exercise.sets.reduce(
            (total, set) => total + (set.reps || 0) * (set.weightKg || 0),
            0,
          ),
        0,
      )

      const trained = new Set<string>()
      for (const exercise of session.exercises) {
        for (const slug of muscleSlugs(exercise.target, exercise.bodyPart)) {
          trained.add(slug)
          load[slug] = (load[slug] ?? 0) + Math.max(1, Math.round(volume / 500))
        }
      }

      for (const slug of trained) days[slug] = Math.min(days[slug] ?? 99, day)
    }

    // 0–1 day since trained = still recovering; 3+ days = ready.
    const recuperation: Record<string, number> = {}
    for (const [slug, day] of Object.entries(days))
      recuperation[slug] = day <= 0 ? 0 : day === 1 ? 1 : day === 2 ? 2 : 4

    const sleep = summary?.latestSleepHours ?? null
    const energy = summary?.latestEnergyLevel ?? null
    const heartRate = summary?.latestRestingHeartRateBpm ?? null
    const lastTraining = sessions[0]
      ? daysSince(sessions[0].completedAt ?? sessions[0].startedAt)
      : null

    let readiness = 70
    if (sleep !== null) readiness += sleep >= 7 ? 10 : sleep < 6 ? -15 : 0
    if (energy !== null) readiness += energy >= 4 ? 10 : energy <= 2 ? -10 : 0
    if (heartRate !== null) readiness += heartRate > 80 ? -10 : 0
    if (lastTraining !== null && lastTraining < 1) readiness -= 5
    readiness = Math.max(0, Math.min(100, readiness))

    return {
      load,
      recuperation,
      readyMuscles: Object.entries(days)
        .filter(([, day]) => day >= 2)
        .map(([slug]) => slug),
      recoveringMuscles: Object.entries(days)
        .filter(([, day]) => day < 2)
        .map(([slug]) => slug),
      readiness,
    }
  }, [sessions, summary])

  const weightTrend = summary?.weightKg ?? null
  const adherence = selected
    ? Math.round((selected.completed / Math.max(1, selected.total)) * 100)
    : 0

  return (
    <div className="space-y-5" dir="rtl">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">گزارش مربی</h1>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            یک شاگرد را انتخاب کنید تا برنامه، اندازه‌گیری‌ها، بار عضلانی و ریکاوری او را
            ببینید.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          بروزرسانی
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <section className="bg-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="border-b p-3">
            <label className="relative block">
              <span className="sr-only">جست‌وجوی شاگرد</span>
              <Search className="text-muted-foreground pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="نام شاگرد…"
                className="pe-9"
              />
            </label>
          </div>

          {loading ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2, 3].map((key) => (
                <Skeleton key={key} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <p className="text-muted-foreground p-6 text-center text-sm">
              شاگردی پیدا نشد.
            </p>
          ) : (
            <ul className="max-h-[32rem] divide-y overflow-y-auto">
              {visible.map((member) => (
                <li key={member.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(member.id)}
                    aria-current={selectedId === member.id}
                    className={`w-full px-3 py-3 text-right transition-colors ${
                      selectedId === member.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                    }`}
                  >
                    <span className="block truncate text-sm font-semibold">
                      {member.name}
                    </span>
                    <span className="text-muted-foreground mt-1 block text-xs">
                      {fa(member.completed)} از {fa(member.total)} جلسه ·{' '}
                      {fa(member.active)} برنامه فعال
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-4">
          {!selected ? (
            <section className="bg-card flex min-h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-8 text-center">
              <Users className="text-muted-foreground size-7" />
              <p className="text-sm font-bold">یک شاگرد انتخاب کنید</p>
              <p className="text-muted-foreground max-w-sm text-xs leading-6">
                اطلاعات برنامه، اندازه‌گیری و ریکاوری همان شاگرد در این بخش بارگذاری
                می‌شود.
              </p>
            </section>
          ) : loadingMember ? (
            <div className="bg-card flex h-64 items-center justify-center gap-2 rounded-2xl border">
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
              <span className="text-muted-foreground text-sm">در حال بارگذاری…</span>
            </div>
          ) : (
            <>
              <section className="bg-card rounded-2xl border p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight">{selected.name}</h2>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {fa(selected.active)} برنامه فعال ·{' '}
                      {summary?.lastMeasuredOn
                        ? `آخرین اندازه‌گیری ${dateFmt.format(new Date(summary.lastMeasuredOn))}`
                        : 'اندازه‌گیری ثبت نشده'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
                    <BatteryCharging
                      className={`size-5 ${
                        report.readiness >= 70
                          ? 'text-emerald-600'
                          : report.readiness >= 45
                            ? 'text-orange-500'
                            : 'text-destructive'
                      }`}
                    />
                    <div>
                      <p className="text-muted-foreground text-[10px]">آمادگی تخمینی</p>
                      <p className="text-sm font-bold">{fa(report.readiness)}٪</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <MiniStat
                    label="پیشرفت برنامه"
                    value={`${fa(adherence)}٪`}
                    detail={`${fa(selected.completed)} از ${fa(selected.total)} جلسه`}
                  />
                  <MiniStat
                    label="روند وزن"
                    value={
                      weightTrend
                        ? `${fa(Number(weightTrend.latest ?? 0))} kg`
                        : '—'
                    }
                    detail={
                      weightTrend?.change != null
                        ? `${weightTrend.change > 0 ? '+' : ''}${fa(Number(weightTrend.change))} kg`
                        : 'بدون داده مقایسه'
                    }
                    icon={
                      weightTrend?.change != null && weightTrend.change < 0
                        ? TrendingDown
                        : TrendingUp
                    }
                  />
                  <MiniStat
                    label="خواب / ضربان"
                    value={`${summary?.latestSleepHours != null ? fa(Number(summary.latestSleepHours)) : '—'} h`}
                    detail={
                      summary?.latestRestingHeartRateBpm != null
                        ? `RHR ${fa(Number(summary.latestRestingHeartRateBpm))}`
                        : 'RHR ثبت نشده'
                    }
                    icon={Moon}
                  />
                </div>
              </section>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
                <section className="bg-card rounded-2xl border p-4 shadow-sm sm:p-5">
                  <h3 className="text-sm font-bold">بار تمرینی اخیر</h3>
                  <p className="text-muted-foreground mt-1 text-xs">
                    بر اساس {fa(sessions.length)} جلسه آخر این شاگرد
                  </p>
                  {Object.keys(report.load).length > 0 ? (
                    <div className="mt-3">
                      <BodyMapPanel body="male" palette="load" load={report.load} />
                    </div>
                  ) : (
                    <p className="text-muted-foreground mt-3 text-xs">
                      جلسه‌ای برای تحلیل بار عضلانی پیدا نشد.
                    </p>
                  )}
                </section>

                <section className="bg-card rounded-2xl border p-4 shadow-sm sm:p-5">
                  <h3 className="flex items-center gap-1 text-sm font-bold">
                    <HeartPulse className="size-4" />
                    وضعیت ریکاوری
                  </h3>
                  {Object.keys(report.recuperation).length > 0 ? (
                    <div className="mt-3">
                      <BodyMapPanel
                        body="male"
                        palette="recovery"
                        load={report.recuperation}
                        thresholds={[
                          { at: 0, level: 0 },
                          { at: 1, level: 1, exclusive: true },
                          { at: 2, level: 2 },
                          { at: 3, level: 4 },
                        ]}
                      />
                      <p className="text-muted-foreground mt-3 text-[11px] leading-5">
                        {report.recoveringMuscles.length > 0
                          ? `${fa(report.recoveringMuscles.length)} گروه عضلانی هنوز در حال ریکاوری است؛ امروز روی آن‌ها فشار نگذارید.`
                          : 'همه گروه‌های تمرین‌شده ریکاوری شده‌اند.'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground mt-3 text-xs">
                      برای تخمین ریکاوری، حداقل یک جلسه لازم است.
                    </p>
                  )}
                </section>
              </div>

              <section className="bg-card overflow-hidden rounded-2xl border shadow-sm">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h3 className="text-sm font-bold">اندازه‌گیری‌های اخیر</h3>
                  <span className="text-muted-foreground text-xs">
                    {fa(measurements.length)} رکورد
                  </span>
                </div>
                {measurements.length === 0 ? (
                  <p className="text-muted-foreground p-6 text-center text-sm">
                    اندازه‌گیری‌ای ثبت نشده است.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-right text-sm">
                      <thead>
                        <tr className="text-muted-foreground border-b text-xs">
                          <th className="px-4 py-2 font-medium">تاریخ</th>
                          <th className="px-4 py-2 font-medium">وزن</th>
                          <th className="px-4 py-2 font-medium">چربی</th>
                          <th className="px-4 py-2 font-medium">دور کمر</th>
                          <th className="px-4 py-2 font-medium">خواب</th>
                          <th className="px-4 py-2 font-medium">انرژی</th>
                        </tr>
                      </thead>
                      <tbody>
                        {measurements.slice(0, 8).map((row) => (
                          <tr key={row.id} className="border-b last:border-0">
                            <td className="px-4 py-2.5">
                              {dateFmt.format(new Date(row.date))}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums">
                              {row.weightKg != null ? `${fa(row.weightKg)} kg` : '—'}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums">
                              {row.bodyFatPercent != null
                                ? `${fa(row.bodyFatPercent)}٪`
                                : '—'}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums">
                              {row.waistCm != null ? `${fa(row.waistCm)} cm` : '—'}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums">
                              {row.sleepHours != null ? `${fa(row.sleepHours)} h` : '—'}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums">
                              {row.energyLevel != null ? fa(row.energyLevel) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <MemberProgressPanel memberId={selected.id} memberName={selected.name} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MiniStat({
  label,
  value,
  detail,
  icon: Icon = Activity,
}: {
  label: string
  value: string
  detail: string
  icon?: typeof Activity
}) {
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">{label}</p>
        <Icon className="text-muted-foreground size-4" />
      </div>
      <p className="mt-1 text-lg font-extrabold tracking-tight">{value}</p>
      <p className="text-muted-foreground mt-0.5 text-[11px]">{detail}</p>
    </div>
  )
}
