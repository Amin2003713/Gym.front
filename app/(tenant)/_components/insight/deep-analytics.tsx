'use client'

import { Timer, TrendingUp, Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { InsightEmpty, InsightSection } from '@/app/(tenant)/_components/insight/insight-shell'
import { buildDeepAnalytics } from '@/app/(tenant)/_model/deep-analytics'
import type {
  SessionResponse,
  WorkoutListItem,
} from '@/app/(tenant)/_model/workout.types'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

const tooltipStyle = {
  backgroundColor: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  color: 'var(--popover-foreground)',
  fontSize: 12,
}

const dateLabel = (iso: string) =>
  iso
    ? new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(
        new Date(`${iso}T12:00:00`),
      )
    : ''

/**
 * Volume, rest behaviour, PRs and per-exercise progress, all derived from the sessions the stats
 * page already loaded. No fabricated numbers: an empty range renders empty states.
 */
export function DeepAnalytics({
  sessions,
  listItems,
}: {
  sessions: SessionResponse[]
  listItems: WorkoutListItem[]
}) {
  const data = useMemo(
    () => buildDeepAnalytics(sessions, listItems),
    [sessions, listItems],
  )
  const [exerciseId, setExerciseId] = useState<string | null>(null)

  const exercise =
    data.exercises.find((row) => row.exerciseId === exerciseId) ?? data.exercises[0] ?? null

  const restMax = Math.max(1, ...data.rest.buckets.map((bucket) => bucket.count))

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'جلسه‌ها', value: fa(data.totals.sessions), icon: Trophy },
          { label: 'کل ست‌ها', value: fa(data.totals.sets), icon: Timer },
          { label: 'حجم کل', value: `${fa(data.totals.volumeKg)} kg`, icon: TrendingUp },
          { label: 'رکوردها', value: fa(data.totals.prs), icon: Trophy },
        ].map((item) => (
          <div key={item.label} className="bg-card rounded-2xl border p-3 shadow-sm">
            <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold">
              <item.icon className="size-3.5" aria-hidden />
              {item.label}
            </p>
            <p className="mt-1 text-xl font-extrabold tabular-nums">{item.value}</p>
          </div>
        ))}
      </section>

      <InsightSection
        title="حجم هفتگی"
        description="مجموع وزنه × تکرار در هفته‌های اخیر (هفته از شنبه)."
      >
        {data.weekly.length === 0 ? (
          <InsightEmpty message="در این بازه جلسه‌ای ثبت نشده است." />
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weekly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="weeklyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 5" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  width={44}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [
                    name === 'volumeKg' ? `${fa(Number(value))} kg` : fa(Number(value)),
                    name === 'volumeKg' ? 'حجم' : 'ست',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="volumeKg"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fill="url(#weeklyFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </InsightSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightSection
          title="الگوی استراحت"
          description="استراحت اندازه‌گیری‌شده بین ست‌ها؛ تایمر رد‌شده جدا شمرده می‌شود."
        >
          {data.rest.measuredSets === 0 ? (
            <InsightEmpty message="هنوز استراحتی با تایمر اندازه‌گیری نشده است." />
          ) : (
            <>
              <p className="text-muted-foreground mb-2 text-xs tabular-nums">
                میانگین {fa(data.rest.averageSeconds)} ثانیه ·{' '}
                {fa(data.rest.measuredSets)} ست اندازه‌گیری‌شده ·{' '}
                {fa(data.rest.skippedShare)}٪ رد‌شده
              </p>
              <ul className="space-y-2">
                {data.rest.buckets.map((bucket) => (
                  <li key={bucket.label}>
                    <div className="mb-1 flex justify-between text-[11px]">
                      <span>{bucket.label}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {fa(bucket.count)}
                      </span>
                    </div>
                    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${(bucket.count / restMax) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </InsightSection>

        <InsightSection
          title="روند مدت جلسه"
          description="از شروع تا پایان هر جلسه ثبت‌شده (دقیقه)."
        >
          {data.duration.length < 2 ? (
            <InsightEmpty message="برای دیدن روند، حداقل دو جلسه لازم است." />
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.duration} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="4 5" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    tickFormatter={dateLabel}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [`${fa(Number(value))} دقیقه`, 'مدت']}
                    labelFormatter={(label) => dateLabel(String(label))}
                  />
                  <Line
                    type="monotone"
                    dataKey="minutes"
                    stroke="#0EA5E9"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </InsightSection>
      </div>

      <InsightSection
        title="پیشرفت هر حرکت"
        description="بهترین تخمین ۱RM هر جلسه؛ روی نمودار، روند قدرت آن حرکت است."
      >
        {data.exercises.length === 0 ? (
          <InsightEmpty message="هنوز حرکتی با ست ثبت‌شده وجود ندارد." />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {data.exercises.map((row) => (
                <button
                  key={row.exerciseId}
                  type="button"
                  aria-pressed={exercise?.exerciseId === row.exerciseId}
                  onClick={() => setExerciseId(row.exerciseId)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    exercise?.exerciseId === row.exerciseId
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {row.name}
                </button>
              ))}
            </div>

            {exercise && (
              <>
                <p className="text-muted-foreground mb-2 text-[11px] tabular-nums">
                  {fa(exercise.sets)} ست · {fa(exercise.volumeKg)} kg حجم · بهترین e1RM{' '}
                  {fa(exercise.bestE1Rm)} kg
                </p>

                {exercise.points.length < 2 ? (
                  <InsightEmpty message="برای این حرکت فقط یک جلسه ثبت شده؛ بعد از جلسه بعد روند دیده می‌شود." />
                ) : (
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={exercise.points}
                        margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
                      >
                        <CartesianGrid
                          stroke="var(--border)"
                          strokeDasharray="4 5"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                          tickFormatter={dateLabel}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                          width={44}
                          domain={['auto', 'auto']}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value) => [`${fa(Number(value))} kg`, 'e1RM']}
                          labelFormatter={(label) => dateLabel(String(label))}
                        />
                        <Line
                          type="monotone"
                          dataKey="e1Rm"
                          stroke="var(--primary)"
                          strokeWidth={2.5}
                          dot
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </InsightSection>

      <InsightSection title="رکوردها" description="بهترین e1RM هر حرکت در بازه انتخابی.">
        {data.prTimeline.length === 0 ? (
          <InsightEmpty message="هنوز رکوردی ثبت نشده است." />
        ) : (
          <ul className="divide-y text-xs">
            {data.prTimeline.slice(0, 8).map((row) => (
              <li
                key={`${row.date}-${row.e1Rm}`}
                className="flex items-center justify-between gap-2 py-2"
              >
                <span className="text-muted-foreground">{dateLabel(row.date)}</span>
                <span className="tabular-nums">
                  {fa(row.weightKg)} kg · e1RM {fa(row.e1Rm)} kg
                </span>
              </li>
            ))}
          </ul>
        )}
      </InsightSection>

    </div>
  )
}
