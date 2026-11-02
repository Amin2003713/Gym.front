'use client'

import { Box, LineChart, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  deleteMeasurement,
  getMeasurementSummary,
  listMyMeasurements,
  upsertMeasurement,
} from '@/app/(tenant)/_api/training-api'
import {
  MEASUREMENT_FIELDS,
  type BodyMeasurement,
  type MeasurementSummary,
  type UpsertMeasurementInput,
} from '@/app/(tenant)/_model/training.types'
import { Button } from '@/components/ui/button'
import { PersianDateInput } from '@/components/ui/persian-date-input'
import {
  MEASUREMENT_REGION,
  REGION_LABEL,
  type BodyRegion,
} from '@/lib/body-regions'
import { toast } from '@/lib/toast'



const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

const todayIso = () => new Date().toISOString().slice(0, 10)

const GROUPS: Array<{
  key: 'composition' | 'circumference' | 'vitals'
  label: string
}> = [
  { key: 'composition', label: 'ترکیب بدن' },
  { key: 'circumference', label: 'دورها (سانتی‌متر)' },
  { key: 'vitals', label: 'ریکاوری' },
]

const METRICS = [
  { key: 'weightKg', label: 'وزن', unit: 'kg', color: '#FB9A3C' },
  { key: 'bodyFatPercent', label: 'چربی بدن', unit: '٪', color: '#8B5CF6' },
  { key: 'neckCm', label: 'گردن', unit: 'cm', color: '#0EA5E9' },
  { key: 'shoulderCm', label: 'شانه', unit: 'cm', color: '#14B8A6' },
  { key: 'chestCm', label: 'سینه', unit: 'cm', color: '#F43F5E' },
  { key: 'waistCm', label: 'دور کمر', unit: 'cm', color: '#22C55E' },
  { key: 'hipsCm', label: 'باسن', unit: 'cm', color: '#EAB308' },
  { key: 'armLeftCm', label: 'بازوی چپ', unit: 'cm', color: '#6366F1' },
  { key: 'armRightCm', label: 'بازوی راست', unit: 'cm', color: '#A855F7' },
  { key: 'forearmLeftCm', label: 'ساعد چپ', unit: 'cm', color: '#06B6D4' },
  { key: 'forearmRightCm', label: 'ساعد راست', unit: 'cm', color: '#10B981' },
  { key: 'thighLeftCm', label: 'ران چپ', unit: 'cm', color: '#F97316' },
  { key: 'thighRightCm', label: 'ران راست', unit: 'cm', color: '#EF4444' },
  { key: 'calfLeftCm', label: 'ساق چپ', unit: 'cm', color: '#84CC16' },
  { key: 'calfRightCm', label: 'ساق راست', unit: 'cm', color: '#D946EF' },
] as const

type MetricKey = (typeof METRICS)[number]['key']

const TREND_FOR_METRIC: Partial<
  Record<
    MetricKey,
    keyof Pick<
      MeasurementSummary,
      | 'weightKg'
      | 'waistCm'
      | 'bodyFatPercent'
      | 'chestCm'
      | 'armLeftCm'
      | 'armRightCm'
      | 'thighLeftCm'
      | 'thighRightCm'
    >
  >
> = {
  weightKg: 'weightKg',
  waistCm: 'waistCm',
  bodyFatPercent: 'bodyFatPercent',
  chestCm: 'chestCm',
  armLeftCm: 'armLeftCm',
  armRightCm: 'armRightCm',
  thighLeftCm: 'thighLeftCm',
  thighRightCm: 'thighRightCm',
}

export function MemberMeasurements() {
  const [history, setHistory] = useState<BodyMeasurement[]>([])
  const [summary, setSummary] = useState<MeasurementSummary | null>(null)
  const [selected, setSelected] = useState<MetricKey[]>(['weightKg', 'waistCm'])
  const [formOpen, setFormOpen] = useState(false)
  const [date, setDate] = useState(todayIso)
  const [values, setValues] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)
  const [view, setView] = useState<'chart'>('chart')
  const [selectedRegion, setSelectedRegion] = useState<BodyRegion | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const [entries, trend] = await Promise.all([
          listMyMeasurements(1, 365),
          getMeasurementSummary(),
        ])

        if (cancelled) return

        setHistory(entries)
        setSummary(trend)
      } catch (error) {
        if (!cancelled)
          toast.error('دریافت اندازه‌گیری‌ها ناموفق بود', {
            description: error instanceof Error ? error.message : undefined,
          })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [version])

  const reload = useCallback(() => {
    setLoading(true)
    setVersion((current) => current + 1)
  }, [])

  /** Opens the form pre-filled from an existing day, so a second weigh-in edits instead of duplicating. */
  const openForm = (entry?: BodyMeasurement) => {
    const source = entry ?? null
    const next: Record<string, string> = {}

    MEASUREMENT_FIELDS.forEach((field) => {
      const value = source?.[field.key as keyof BodyMeasurement]
      next[field.key] =
        value === null || value === undefined ? '' : String(value)
    })

    setValues(next)
    setNote(source?.note ?? '')
    setDate(source?.date ?? todayIso())
    setFormOpen(true)
  }

  const submit = async () => {
    const payload: UpsertMeasurementInput = { date }

    MEASUREMENT_FIELDS.forEach((field) => {
      const raw = values[field.key]?.replace(',', '.').trim()
      payload[field.key] = raw ? Number(raw) : null
    })

    payload.note = note.trim() || null

    const hasValue = MEASUREMENT_FIELDS.some(
      (field) => payload[field.key] !== null,
    )

    if (!hasValue) {
      toast.error('حداقل یک مقدار را وارد کن')
      return
    }

    setSaving(true)

    try {
      await upsertMeasurement(payload)
      toast.success('اندازه‌گیری ذخیره شد')
      setFormOpen(false)
      reload()
    } catch (error) {
      toast.error('ذخیره اندازه‌گیری ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    try {
      await deleteMeasurement(id)
      toast.success('اندازه‌گیری حذف شد')
      reload()
    } catch (error) {
      toast.error('حذف ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const activeMetrics = METRICS.filter((item) => selected.includes(item.key))

  /** One row per day, one key per selected metric — recharts draws one line per key. */
  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>()

    for (const entry of [...history].reverse()) {
      const row: Record<string, number | string> = { date: entry.date }
      let hasValue = false

      for (const item of METRICS) {
        if (!selected.includes(item.key)) continue

        const value = entry[item.key]

        if (value === null || value === undefined) continue

        row[item.key] = Number(value)
        hasValue = true
      }

      if (hasValue) byDate.set(entry.date, row)
    }

    return [...byDate.values()]
  }, [history, selected])

  /** Latest value of every mapped site, plus its normalised shade for the 3D figure. */
  const zoneStats = useMemo(() => {
    const latest = history[0]
    const stats: Partial<Record<BodyRegion, { value: number; label: string; unit: string }>> = {}
    const shades: Partial<Record<BodyRegion, number>> = {}

    if (!latest) return { stats, shades }

    for (const [key, region] of Object.entries(MEASUREMENT_REGION)) {
      const value = latest[key as keyof BodyMeasurement]

      if (typeof value !== 'number') continue

      const field = MEASUREMENT_FIELDS.find((item) => item.key === key)
      const series = history
        .map((entry) => entry[key as keyof BodyMeasurement])
        .filter((item): item is number => typeof item === 'number')

      stats[region] = {
        value,
        label: field?.label ?? REGION_LABEL[region],
        unit: field?.unit ?? 'cm',
      }

      const min = Math.min(...series)
      const max = Math.max(...series)

      shades[region] = max > min ? (value - min) / (max - min) : 0.5
    }

    return { stats, shades }
  }, [history])

  const toggleMetric = (key: MetricKey) => {
    setSelected((current) => {
      if (current.includes(key))
        return current.length === 1
          ? current
          : current.filter((item) => item !== key)

      return [...current, key]
    })
  }
  const dateFmt = new Intl.DateTimeFormat('fa-IR', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">
            اندازه‌گیری
          </h1>
          <p className="text-muted-foreground text-sm leading-6">
            وزن، دورها و ریکاوری؛ همان عددهایی که مربی برای نوشتن برنامه بعدی
            می‌خواند.
          </p>
        </div>
        <Button onClick={() => openForm()} size="sm">
          <Plus className="size-4" />
          ثبت امروز
        </Button>
      </header>

      {formOpen && (
        <section className="bg-card space-y-4 rounded-2xl border p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold">ثبت اندازه‌گیری</h2>
            <div className="w-40" aria-label="تاریخ اندازه‌گیری">
              <PersianDateInput value={date} max={todayIso()} onValueChange={setDate} />
            </div>
          </div>

          {GROUPS.map((group) => (
            <fieldset key={group.key} className="space-y-2">
              <legend className="text-muted-foreground text-xs font-semibold">
                {group.label}
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {MEASUREMENT_FIELDS.filter(
                  (field) => field.group === group.key,
                ).map((field) => (
                  <label key={field.key} className="block">
                    <span className="text-muted-foreground text-[11px]">
                      {field.label}
                    </span>
                    <div className="mt-1 flex items-center gap-1">
                      <input
                        inputMode="decimal"
                        value={values[field.key] ?? ''}
                        min={field.min}
                        max={field.max}
                        step={field.step ?? 0.1}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            [field.key]: event.target.value,
                          }))
                        }
                        placeholder="—"
                        className="border-input bg-background h-9 w-full rounded-lg border px-2 text-sm tabular-nums"
                      />
                      {field.unit && (
                        <span className="text-muted-foreground w-8 shrink-0 text-[10px]">
                          {field.unit}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <label className="block">
            <span className="text-muted-foreground text-[11px]">یادداشت</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              placeholder="مثلاً اندازه‌گیری صبح، ناشتا"
              className="border-input bg-background mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <div className="flex gap-2">
            <Button onClick={() => void submit()} disabled={saving}>
              {saving ? 'در حال ذخیره…' : 'ذخیره'}
            </Button>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              انصراف
            </Button>
          </div>
        </section>
      )}

      <section className="bg-card rounded-2xl border p-4 shadow-sm">
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="انتخاب شاخص‌ها">
          {METRICS.map((item) => {
            const active = selected.includes(item.key)
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={active}
                onClick={() => toggleMetric(item.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  active
                    ? 'border-transparent text-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
                style={active ? { backgroundColor: `${item.color}22` } : undefined}
              >
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </button>
            )
          })}
        </div>

        <ul className="mt-3 space-y-1">
          {activeMetrics.map((item) => {
            const trendKey = TREND_FOR_METRIC[item.key]
            const trend = trendKey ? summary?.[trendKey] : undefined

            return (
              <li
                key={item.key}
                className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-[11px]"
              >
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-foreground font-semibold">{item.label}:</span>
                {trend?.first != null && trend?.latest != null ? (
                  <>
                    <span className="tabular-nums">
                      {fa(Number(trend.first))} → {fa(Number(trend.latest))}{' '}
                      {item.unit}
                    </span>
                    {trend.change != null && (
                      <span
                        className={
                          trend.change === 0
                            ? ''
                            : trend.change > 0
                              ? 'text-primary font-semibold'
                              : 'font-semibold text-emerald-600'
                        }
                      >
                        ({trend.change > 0 ? '+' : ''}
                        {fa(Number(trend.change))} {item.unit})
                      </span>
                    )}
                  </>
                ) : (
                  <span>هنوز دو اندازه‌گیری ثبت نشده</span>
                )}
              </li>
            )
          })}
        </ul>

        {view === 'chart' ? (
        <div className="mt-3 h-48">
          {loading ? (
            <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
              در حال بارگیری…
            </div>
          ) : chartData.length < 2 ? (
            <div className="text-muted-foreground flex h-full items-center justify-center rounded-xl border border-dashed text-center text-xs leading-6">
              برای دیدن روند، حداقل دو اندازه‌گیری در دو روز مختلف ثبت کن.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
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
                  tickMargin={8}
                  tickFormatter={(value: string) =>
                    value ? dateFmt.format(new Date(`${value}T12:00:00`)) : ''
                  }
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    color: 'var(--popover-foreground)',
                    fontSize: 12,
                  }}
                  formatter={(value, name) => {
                    const meta = METRICS.find((item) => item.key === name)

                    return [
                      `${fa(Number(value))} ${meta?.unit ?? ''}`,
                      meta?.label ?? String(name),
                    ]
                  }}
                />

                {activeMetrics.map((item) => (
                  <Line
                    key={item.key}
                    type="monotone"
                    dataKey={item.key}
                    name={item.key}
                    stroke={item.color}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                    connectNulls
                  />
                ))}
              </RechartsLineChart>
            </ResponsiveContainer>
          )}
        </div>
        ) : (
          <div className="mt-3 space-y-2">


            {selectedRegion && zoneStats.stats[selectedRegion] ? (
              <p className="text-muted-foreground text-center text-[11px] tabular-nums">
                <span className="text-foreground font-semibold">
                  {zoneStats.stats[selectedRegion]!.label}
                </span>{' '}
                · {fa(zoneStats.stats[selectedRegion]!.value)}{' '}
                {zoneStats.stats[selectedRegion]!.unit}
                {history.length > 1 ? ' · آخرین ثبت' : ''}
              </p>
            ) : (
              <p className="text-muted-foreground text-center text-[11px] leading-5">
                روی یک ناحیه از بدن بزن تا مقدار ثبت‌شده همان محل را ببینی.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="bg-card rounded-2xl border shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-bold">تاریخچه</h2>
          <span className="text-muted-foreground text-xs">
            {fa(history.length)} ثبت
          </span>
        </div>

        <ul className="divide-y">
          {history.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-2 px-4 py-3"
            >
              <button
                type="button"
                onClick={() => openForm(entry)}
                className="min-w-0 flex-1 text-right"
              >
                <p className="text-sm font-semibold">
                  {dateFmt.format(new Date(`${entry.date}T12:00:00`))}
                </p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  {[
                    entry.weightKg !== null
                      ? `${fa(Number(entry.weightKg))} kg`
                      : null,
                    entry.bodyFatPercent !== null
                      ? `${fa(Number(entry.bodyFatPercent))}٪ چربی`
                      : null,
                    entry.waistCm !== null
                      ? `کمر ${fa(Number(entry.waistCm))}`
                      : null,
                    entry.restingHeartRateBpm !== null
                      ? `${fa(entry.restingHeartRateBpm)} bpm`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </p>
              </button>
              <button
                type="button"
                onClick={() => void remove(entry.id)}
                aria-label="حذف اندازه‌گیری"
                className="text-muted-foreground hover:text-destructive p-2 transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}

          {!history.length && !loading && (
            <li className="text-muted-foreground p-6 text-center text-xs leading-6">
              هنوز اندازه‌گیری‌ای ثبت نکرده‌ای. با «ثبت امروز» شروع کن؛ حتی وزن
              تنها هم کافی است.
            </li>
          )}
        </ul>
      </section>
    </div>
  )
}
