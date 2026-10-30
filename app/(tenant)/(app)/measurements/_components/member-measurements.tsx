'use client'

import { LineChart, Plus, Trash2 } from 'lucide-react'
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
import { toast } from '@/lib/toast'

const fa = (value: number) => value.toLocaleString('fa-IR')

const todayIso = () => new Date().toISOString().slice(0, 10)

const GROUPS: Array<{ key: 'composition' | 'circumference' | 'vitals'; label: string }> = [
  { key: 'composition', label: 'ترکیب بدن' },
  { key: 'circumference', label: 'دورها (سانتی‌متر)' },
  { key: 'vitals', label: 'ریکاوری' },
]

const METRICS = [
  { key: 'weightKg', label: 'وزن', unit: 'kg' },
  { key: 'waistCm', label: 'دور کمر', unit: 'cm' },
  { key: 'bodyFatPercent', label: 'چربی بدن', unit: '٪' },
] as const

type MetricKey = (typeof METRICS)[number]['key']

const TREND_FOR_METRIC: Record<
  MetricKey,
  keyof Pick<MeasurementSummary, 'weightKg' | 'waistCm' | 'bodyFatPercent'>
> = {
  weightKg: 'weightKg',
  waistCm: 'waistCm',
  bodyFatPercent: 'bodyFatPercent',
}

export function MemberMeasurements() {
  const [history, setHistory] = useState<BodyMeasurement[]>([])
  const [summary, setSummary] = useState<MeasurementSummary | null>(null)
  const [metric, setMetric] = useState<MetricKey>('weightKg')
  const [formOpen, setFormOpen] = useState(false)
  const [date, setDate] = useState(todayIso)
  const [values, setValues] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

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
      next[field.key] = value === null || value === undefined ? '' : String(value)
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

    const hasValue = MEASUREMENT_FIELDS.some((field) => payload[field.key] !== null)

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

  const metricMeta = METRICS.find((item) => item.key === metric)!
  const chartData = useMemo(
    () =>
      [...history]
        .reverse()
        .filter((entry) => entry[metric] !== null)
        .map((entry) => ({ date: entry.date, value: Number(entry[metric]) })),
    [history, metric],
  )

  const trend = summary?.[TREND_FOR_METRIC[metric]]
  const dateFmt = new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' })

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">اندازه‌گیری</h1>
          <p className="text-muted-foreground text-sm leading-6">
            وزن، دورها و ریکاوری؛ همان عددهایی که مربی برای نوشتن برنامه بعدی می‌خواند.
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
            <input
              type="date"
              value={date}
              max={todayIso()}
              onChange={(event) => setDate(event.target.value)}
              aria-label="تاریخ اندازه‌گیری"
              className="border-input bg-background h-9 rounded-lg border px-2 text-xs"
            />
          </div>

          {GROUPS.map((group) => (
            <fieldset key={group.key} className="space-y-2">
              <legend className="text-muted-foreground text-xs font-semibold">{group.label}</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {MEASUREMENT_FIELDS.filter((field) => field.group === group.key).map((field) => (
                  <label key={field.key} className="block">
                    <span className="text-muted-foreground text-[11px]">{field.label}</span>
                    <div className="mt-1 flex items-center gap-1">
                      <input
                        inputMode="decimal"
                        value={values[field.key] ?? ''}
                        min={field.min}
                        max={field.max}
                        step={field.step ?? 0.1}
                        onChange={(event) =>
                          setValues((current) => ({ ...current, [field.key]: event.target.value }))
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-bold">
            <LineChart className="text-primary size-4" />
            روند تغییر
          </h2>
          <select
            value={metric}
            onChange={(event) => setMetric(event.target.value as MetricKey)}
            aria-label="انتخاب شاخص"
            className="border-input bg-background h-8 rounded-lg border px-2 text-xs"
          >
            {METRICS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {trend?.first !== null && trend?.change !== null && trend?.change !== undefined && (
          <p className="text-muted-foreground mt-2 text-xs">
            از {trend.first !== null ? fa(Number(trend.first)) : '—'} تا{' '}
            {trend.latest !== null ? fa(Number(trend.latest)) : '—'} {metricMeta.unit}
            {' · '}
            <span className={trend.change === 0 ? '' : trend.change > 0 ? 'text-primary font-semibold' : 'text-emerald-600 font-semibold'}>
              {trend.change > 0 ? '+' : ''}
              {fa(Number(trend.change))} {metricMeta.unit}
            </span>
          </p>
        )}

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
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="measureFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 5" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  tickMargin={8}
                  tickFormatter={(value: string) => (value ? dateFmt.format(new Date(`${value}T12:00:00`)) : '')}
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
                  formatter={(value: number) => [`${fa(value)} ${metricMeta.unit}`, metricMeta.label]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--chart-1)"
                  fill="url(#measureFill)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="bg-card rounded-2xl border shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-bold">تاریخچه</h2>
          <span className="text-muted-foreground text-xs">{fa(history.length)} ثبت</span>
        </div>

        <ul className="divide-y">
          {history.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-2 px-4 py-3">
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
                    entry.weightKg !== null ? `${fa(Number(entry.weightKg))} kg` : null,
                    entry.bodyFatPercent !== null ? `${fa(Number(entry.bodyFatPercent))}٪ چربی` : null,
                    entry.waistCm !== null ? `کمر ${fa(Number(entry.waistCm))}` : null,
                    entry.restingHeartRateBpm !== null ? `${fa(entry.restingHeartRateBpm)} bpm` : null,
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
              هنوز اندازه‌گیری‌ای ثبت نکرده‌ای. با «ثبت امروز» شروع کن؛ حتی وزن تنها هم کافی است.
            </li>
          )}
        </ul>
      </section>
    </div>
  )
}
