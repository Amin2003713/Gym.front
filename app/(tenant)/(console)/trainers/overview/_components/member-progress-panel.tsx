'use client'

import { Download, Loader2 } from '@/components/icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  downloadMemberProgressReport,
  getMemberProgress,
  type MemberMuscleProgress,
  type MemberProgress,
} from '@/app/(tenant)/_api/member-progress-api'
import BodyMapPanel from '@/app/(tenant)/_components/progress/body-map-panel'
import { MUSCLE_LABEL } from '@/app/(tenant)/_model/muscle-labels'
import { useFigureGender } from '@/hooks/use-figure-gender'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'

const fa = (value: number) => value.toLocaleString('fa-IR')
const num = (value: number | null | undefined) =>
  value == null ? '—' : Number(value).toLocaleString('fa-IR', { maximumFractionDigits: 1 })

const dateFmt = new Intl.DateTimeFormat('fa-IR', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
})

const formatDate = (value: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFmt.format(date)
}

type MapMode = 'sets' | 'hardSets' | 'fatigue' | 'strength'
type Metric = 'weightKg' | 'bodyFatPercent' | 'waistCm'

const METRICS: Array<{ value: Metric; label: string; unit: string }> = [
  { value: 'weightKg', label: 'وزن', unit: 'kg' },
  { value: 'bodyFatPercent', label: 'چربی بدن', unit: '٪' },
  { value: 'waistCm', label: 'دور کمر', unit: 'cm' },
]

const MAP_MODES: Array<{ value: MapMode; label: string }> = [
  { value: 'sets', label: 'ست‌های کارکرد' },
  { value: 'hardSets', label: 'ست‌های سخت' },
  { value: 'fatigue', label: 'خستگی' },
  { value: 'strength', label: 'قدرت' },
]

/**
 * The former Progress page, merged into the coach overview: cards, 12-month activity, the four
 * body maps and the per-muscle panel. Everything comes from one server report, and the downloadable
 * PDF is that same report.
 */
export function MemberProgressPanel({
  memberId,
  memberName,
}: {
  memberId: string
  memberName: string
}) {
  const [data, setData] = useState<MemberProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [mapMode, setMapMode] = useState<MapMode>('sets')
  const [activityMode, setActivityMode] = useState<'sessions' | 'volume'>('sessions')
  const [metric, setMetric] = useState<Metric>('weightKg')
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const figureGender = useFigureGender(memberId)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await getMemberProgress(memberId))
    } catch (error) {
      toast.error('دریافت گزارش پیشرفت ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }, [memberId])

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0)
    return () => clearTimeout(timer)
  }, [load])

  const mapLoad = useMemo(() => {
    if (!data) return {}

    return Object.fromEntries(
      data.muscles.map((muscle) => {
        if (mapMode === 'sets') return [muscle.muscleCode, muscle.sets]
        if (mapMode === 'hardSets') return [muscle.muscleCode, muscle.hardSets]
        if (mapMode === 'fatigue')
          return [
            muscle.muscleCode,
            muscle.daysSinceTrained == null ? 4 : Math.min(muscle.daysSinceTrained, 4),
          ]
        return [muscle.muscleCode, muscle.bestEstimatedOneRmKg ?? 0]
      }),
    )
  }, [data, mapMode])

  if (loading) {
    return (
      <section className="bg-card flex min-h-48 items-center justify-center gap-2 rounded-2xl border">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
        <span className="text-muted-foreground text-sm">در حال محاسبه گزارش پیشرفت…</span>
      </section>
    )
  }

  if (!data) {
    return (
      <section className="bg-card rounded-2xl border p-6 text-center text-sm">
        <p className="font-bold">گزارش پیشرفت در دسترس نیست.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => void load()}>
          تلاش دوباره
        </Button>
      </section>
    )
  }

  const latest = data.summary.measurements[0]
  const metricLabel = METRICS.find((item) => item.value === metric)
  const muscle = selectedMuscle
    ? data.muscles.find((item) => item.muscleCode === selectedMuscle)
    : undefined
  const activityPoints = data.activity.map((point) => ({
    month: point.month,
    sessions: point.sessions,
    volume: Math.round(point.volumeKg),
  }))

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight">پیشرفت {data.memberName || memberName}</h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            آمار از ست‌های ثبت‌شده، اندازه‌گیری‌ها و تاریخچه واقعی باشگاه ساخته می‌شود.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            void downloadMemberProgressReport(data.memberId, data.memberName).catch((error: unknown) =>
              toast.error('دریافت گزارش PDF ناموفق بود', {
                description: error instanceof Error ? error.message : undefined,
              }),
            )
          }
        >
          <Download className="size-4" />
          گزارش PDF
        </Button>
      </section>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="کل جلسات" value={fa(data.summary.totalSessions)} />
        <Stat label="جلسات این ماه" value={fa(data.summary.sessionsThisMonth)} />
        <Stat label="جلسات این هفته" value={fa(data.summary.sessionsThisWeek)} />
        <Stat label="کل تکرارها" value={fa(data.summary.totalReps)} />
        <Stat label="کل رکوردها (PR)" value={fa(data.summary.totalRecords)} />
        <div className="rounded-xl border p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground text-xs">اندازه‌گیری</p>
            <select
              aria-label="شاخص اندازه‌گیری نمایش‌داده‌شده"
              className="bg-background rounded-md border px-2 py-1 text-xs"
              value={metric}
              onChange={(event) => setMetric(event.target.value as Metric)}
            >
              {METRICS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-lg font-extrabold tracking-tight">
            {latest ? num(latest[metric]) : '—'}{' '}
            <span className="text-xs font-normal">{metricLabel?.unit}</span>
          </p>
          <p className="text-muted-foreground mt-0.5 text-[11px]">
            {latest ? formatDate(latest.date) : 'اندازه‌گیری ثبت نشده'}
          </p>
        </div>
      </div>

      <section className="bg-card rounded-lg border p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-bold">فعالیت ۱۲ ماه گذشته</h4>
          <div className="flex gap-1">
            {(['sessions', 'volume'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={activityMode === mode}
                onClick={() => setActivityMode(mode)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  activityMode === mode ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                }`}
              >
                {mode === 'sessions' ? 'زمان' : 'حجم'}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityPoints}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey={activityMode === 'sessions' ? 'sessions' : 'volume'}
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-card rounded-lg border p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-bold">نقشه عضلات</h4>
          <div className="flex flex-wrap gap-1">
            {MAP_MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                aria-pressed={mapMode === mode.value}
                onClick={() => setMapMode(mode.value)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                  mapMode === mode.value ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-muted-foreground mt-2 text-xs leading-5">
          {mapMode === 'fatigue'
            ? 'قرمز یعنی تازه تمرین شده و هنوز ریکاوری کامل نشده؛ سبز یعنی آماده تمرین.'
            : mapMode === 'strength'
              ? 'قدرت بر پایه بهترین وزن استفاده‌شده در ست‌های تمرین محاسبه می‌شود.'
              : 'شدت رنگ با تعداد ست‌های ثبت‌شده در بازه کارکرد هم‌خوان است.'}
        </p>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <BodyMapPanel
            body={figureGender}
            palette={mapMode === 'fatigue' ? 'recovery' : 'load'}
            load={mapLoad}
            selected={selectedMuscle ?? undefined}
            onMuscle={setSelectedMuscle}
          />

          <div className="space-y-2">
            <h5 className="text-xs font-bold">
              {muscle ? MUSCLE_LABEL[muscle.muscleCode] ?? muscle.muscleCode : 'یک عضله را انتخاب کنید'}
            </h5>

            {muscle ? (
              <MuscleDetail muscle={muscle} />
            ) : (
              <p className="text-muted-foreground text-xs leading-6">
                روی نقشه یا فهرست زیر یک عضله را انتخاب کنید تا ست‌ها، زمان از آخرین تمرین و
                حرکات آن دیده شود.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="bg-card overflow-hidden rounded-lg border shadow-sm">
        <div className="border-b px-4 py-3">
          <h4 className="text-sm font-bold">جزئیات عضلات</h4>
          <p className="text-muted-foreground mt-0.5 text-xs">
            انتخاب عضله، پنل جزئیات و فهرست حرکات را به‌روزرسانی می‌کند.
          </p>
        </div>
        <ul className="divide-y">
          {data.muscles.map((item) => {
            const weeks = item.daysSinceTrained == null ? null : Math.floor(item.daysSinceTrained / 7)
            return (
              <li key={item.muscleCode}>
                <button
                  type="button"
                  onClick={() => setSelectedMuscle(item.muscleCode)}
                  aria-pressed={selectedMuscle === item.muscleCode}
                  className={`flex w-full flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-right text-sm transition ${
                    selectedMuscle === item.muscleCode ? 'bg-primary/10' : 'hover:bg-muted/50'
                  }`}
                >
                  <span className="font-semibold">{MUSCLE_LABEL[item.muscleCode] ?? item.muscleCode}</span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {item.sets > 0 ? `${fa(item.sets)} ست` : 'تمرین نشده'}
                    {weeks !== null ? ` · هفته از آخرین تمرین: ${fa(weeks)}` : ''}
                    {item.hardSets > 0 ? ` · ${fa(item.hardSets)} ست سخت` : ''}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {data.summary.measurements.length > 0 && (
        <section className="bg-card overflow-hidden rounded-lg border shadow-sm">
          <div className="border-b px-4 py-3">
            <h4 className="text-sm font-bold">اندازه‌گیری‌ها</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-right text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-xs">
                  <th className="px-4 py-2 font-medium">تاریخ</th>
                  <th className="px-4 py-2 font-medium">وزن (kg)</th>
                  <th className="px-4 py-2 font-medium">چربی (٪)</th>
                  <th className="px-4 py-2 font-medium">دور کمر (cm)</th>
                </tr>
              </thead>
              <tbody>
                {data.summary.measurements.slice(0, 8).map((row) => (
                  <tr key={row.date} className="border-b last:border-0">
                    <td className="px-4 py-2">{formatDate(row.date)}</td>
                    <td className="px-4 py-2 tabular-nums">{num(row.weightKg)}</td>
                    <td className="px-4 py-2 tabular-nums">{num(row.bodyFatPercent)}</td>
                    <td className="px-4 py-2 tabular-nums">{num(row.waistCm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-lg font-extrabold tracking-tight tabular-nums">{value}</p>
    </div>
  )
}

/** One muscle: sets, weeks since training and every exercise that trained it. */
function MuscleDetail({ muscle }: { muscle: MemberMuscleProgress }) {
  const weeks = muscle.daysSinceTrained == null ? null : Math.floor(muscle.daysSinceTrained / 7)

  return (
    <div className="space-y-2 rounded-xl border p-3">
      <p className="text-xs leading-5">
        <span className="font-bold">قدرت</span> نشان‌دهندهٔ قدرت حفظ‌شدهٔ عضله است. برای
        به‌روزرسانی، دوباره تمرین کنید.
      </p>
      <p className="text-muted-foreground text-xs">
        {muscle.sets > 0
          ? `${fa(muscle.sets)} ست · ${fa(muscle.hardSets)} ست سخت`
          : 'تمرین نشده'}
        {weeks !== null ? ` · هفته از آخرین تمرین: ${fa(weeks)}` : ''}
      </p>

      <h6 className="text-xs font-semibold">
        حرکات · {MUSCLE_LABEL[muscle.muscleCode] ?? muscle.muscleCode}
      </h6>
      {muscle.exercises.length === 0 ? (
        <p className="text-muted-foreground text-xs">حرکتی برای این عضله ثبت نشده است.</p>
      ) : (
        <ul className="space-y-1.5">
          {muscle.exercises.slice(0, 6).map((exercise) => (
            <li key={`${exercise.exerciseName}-${exercise.role}`} className="text-xs leading-5">
              <span className="font-medium">{exercise.exerciseName}</span>
              <span className="text-muted-foreground">
                {' '}· {exercise.role === 'primary' ? 'اصلی' : 'کمکی'}
                {exercise.estimatedOneRmKg != null && ` · Est. 1RM ${num(exercise.estimatedOneRmKg)} kg`}
                {` · ${formatDate(exercise.lastTrainedOn)}`}
                {exercise.lastWorkingWeightKg != null &&
                  ` · ${num(exercise.lastWorkingWeightKg)} kg`}
                {exercise.lastWorkingWeightPercentOfOneRm != null &&
                  ` · ${fa(exercise.lastWorkingWeightPercentOfOneRm)}٪`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
