'use client'

import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  MEASUREMENT_FIELDS,
  type MeasurementEntry,
  type MeasurementField,
} from '../_model/health.types'

const fa = (n: number) => n.toLocaleString('fa-IR')

const tooltipStyle = {
  backgroundColor: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  color: 'var(--popover-foreground)',
  fontSize: 12,
}

/** Chart panel: pick a tracked measurement, see its trend line over time. */
export function MeasurementTrendChart({
  entries,
}: {
  entries: MeasurementEntry[]
}) {
  const [fieldKey, setFieldKey] = useState<MeasurementField['key']>('weightKg')
  const field = MEASUREMENT_FIELDS.find((f) => f.key === fieldKey)!

  const data = useMemo(
    () =>
      entries
        .filter((entry) => entry[fieldKey] != null)
        .map((entry) => ({
          date: entry.measuredAt,
          value: Number(entry[fieldKey]),
        })),
    [entries, fieldKey],
  )

  const first = data[0]?.value
  const last = data[data.length - 1]?.value
  const diff = first != null && last != null ? last - first : null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm">
          <span className="sr-only">فیلد نمودار</span>
          <select
            className="h-10 rounded-lg border bg-background px-3 text-sm"
            value={fieldKey}
            onChange={(e) => setFieldKey(e.target.value as MeasurementField['key'])}
          >
            {MEASUREMENT_FIELDS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label} ({f.unit})
              </option>
            ))}
          </select>
        </label>
        {diff != null && (
          <div className="text-xs" dir="ltr">
            <span className="text-muted-foreground font-medium">Δ = </span>
            <span
              className={
                diff <= 0
                  ? 'font-bold text-emerald-600 dark:text-emerald-400'
                  : 'text-sky-600 font-bold dark:text-sky-400'
              }
            >
              {diff > 0 ? '+' : ''}
              {fa(Math.round(diff * 10) / 10)} {field.unit}
            </span>
            <span className="text-muted-foreground font-medium"> (first→latest)</span>
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed py-10 text-center text-sm">
          برای این فیلد هنوز داده‌ای ثبت نشده؛ یک اندازه‌گیری افزوده شود.
        </p>
      ) : (
        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickFormatter={(value: string) => value.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                domain={['auto', 'auto']}
                width={48}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(label: string) => label}
                formatter={(value: number) => [`${fa(value)} ${field.unit}`, field.label]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
