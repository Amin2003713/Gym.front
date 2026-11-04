'use client'

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

/**
 * Weight sparkline for the member dashboard. It lives in its own module so recharts stays out of
 * the dashboard's initial bundle and is fetched only when the chart is actually shown.
 */
export default function WeightTrendChart({
  data,
}: {
  data: Array<{ date: string; weightKg: number | string }>
}) {
  return (
    <div className="mt-2 h-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              color: 'var(--popover-foreground)',
              fontSize: 12,
            }}
            formatter={(value) => [`${fa(Number(value))} kg`, 'وزن']}
          />
          <Line
            type="monotone"
            dataKey="weightKg"
            stroke="var(--primary)"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
