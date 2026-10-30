'use client'

import { Award, Dumbbell, Target, Timer } from 'lucide-react'
import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { WorkoutMuscleStats } from '@/app/(tenant)/_model/muscle-balance'
import type { SessionResponse } from '@/app/(tenant)/_model/workout.types'

const fa = (n: number) => n.toLocaleString('fa-IR')
const dateFmt = new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

const tooltipStyle = {
  backgroundColor: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  color: 'var(--popover-foreground)',
  boxShadow: '0 12px 32px rgb(0 0 0 / 12%)',
  fontSize: 12,
}

const duration = (session: SessionResponse) => {
  const start = session.startedAt ? new Date(session.startedAt).getTime() : undefined
  const end = session.completedAt ? new Date(session.completedAt).getTime() : undefined
  if (!start || !end || end <= start) return null
  return Math.round((end - start) / 60000)
}

export default function OverviewTab({
  sessions,
  stats,
  loading,
}: {
  sessions: SessionResponse[]
  stats: WorkoutMuscleStats
  loading: boolean
}) {
  const chartData = useMemo(
    () =>
      sessions
        .map((session) => ({
          name: session.title || 'جلسه',
          date: session.completedAt ?? session.startedAt ?? '',
          volume: session.exercises.reduce(
            (sum, exercise) =>
              sum + exercise.sets.reduce((s, set) => s + (set.reps || 0) * (set.weightKg || 0), 0),
            0,
          ),
        }))
        .filter((point) => point.date)
        .reverse(),
    [sessions],
  )

  const minutes = useMemo(
    () =>
      sessions.reduce((sum, session) => {
        const d = duration(session)
        return sum + (d ?? 0)
      }, 0),
    [sessions],
  )

  const metals = [
    { title: 'جلسات تمرین', value: fa(stats.totals.sessions), detail: 'در بازه انتخاب‌شده از API واقعی', icon: Dumbbell },
    { title: 'زمان تمرین', value: `${fa(Math.round(minutes))} دقیقه`, detail: 'شروع تا پایان جلسه', icon: Timer },
    { title: 'ست‌های مؤثر', value: fa(stats.totals.sets), detail: 'مجموع ست‌های ثبت‌شده', icon: Target },
    { title: 'حجم تمرین', value: `${fa(Math.round(stats.totals.volumeKg))} kg`, detail: 'وزنه × تکرار همه ست‌ها', icon: Award },
  ]

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metals.map(({ title, value, detail, icon: Icon }) => (
          <div key={title} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-sm">{title}</p>
                <p className="mt-2 text-2xl font-extrabold tracking-tight">{loading ? '…' : value}</p>
              </div>
              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <Icon className="size-5"/>
              </span>
            </div>
            <p className="text-muted-foreground mt-3 text-xs">{detail}</p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="border-b p-4 sm:p-5">
          <h2 className="font-bold">حجم تمرین</h2>
          <p className="text-muted-foreground mt-1 text-sm">مجموع وزنه × تکرار در جلسات بازه</p>
        </div>
        <div className="p-4 sm:p-5">
          <div className="h-60 min-w-0 sm:h-72">
            {chartData.length === 0 ? (
              <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                {loading ? 'در حال بارگیری…' : 'هنوز جلسه‌ای ثبت نشده است.'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volumeFillReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.32}/>
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="4 5" vertical={false}/>
                  <XAxis dataKey="date" tickLine={false} axisLine={false}
                         tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickMargin={10}
                         tickFormatter={(value: string) => (value ? dateFmt.format(new Date(value)) : '')}/>
                  <YAxis tickLine={false} axisLine={false}
                         tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickMargin={8}/>
                  <Tooltip contentStyle={tooltipStyle}
                           labelStyle={{ color: 'var(--popover-foreground)', fontWeight: 700, marginBottom: 6 }}
                           itemStyle={{ color: 'var(--primary)' }}/>
                  <Area type="monotone" dataKey="volume" name="حجم تمرین" stroke="var(--chart-1)"
                        fill="url(#volumeFillReal)" strokeWidth={2.75}/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="border-b p-4 sm:p-5">
          <h2 className="font-bold">آخرین جلسات</h2>
          <p className="text-muted-foreground mt-1 text-sm">آخرین جلسات ثبت‌شده از API تمرین</p>
        </div>
        <div className="overflow-x-auto p-4 sm:p-5">
          <table className="w-full min-w-[520px] text-right text-sm">
            <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="pb-3 font-medium">جلسه</th>
              <th className="pb-3 font-medium">تاریخ</th>
              <th className="pb-3 font-medium">مدت</th>
              <th className="pb-3 font-medium">حرکات</th>
            </tr>
            </thead>
            <tbody>
            {sessions.slice(0, 5).map((session) => (
              <tr key={session.id} className="border-b last:border-0">
                <td className="py-3.5 font-semibold">{session.title || 'جلسه تمرین'}</td>
                <td className="text-muted-foreground py-3.5">
                  {session.startedAt ? dateFmt.format(new Date(session.startedAt)) : '—'}
                </td>
                <td className="py-3.5">{duration(session) ? `${fa(duration(session)!)} دقیقه` : '—'}</td>
                <td className="py-3.5">{fa(session.exercises?.length ?? 0)}</td>
              </tr>
            ))}
            {!sessions.length && (
              <tr>
                <td colSpan={4} className="text-muted-foreground py-6 text-center text-sm">
                  جلسه‌ای ثبت نشده است.
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
