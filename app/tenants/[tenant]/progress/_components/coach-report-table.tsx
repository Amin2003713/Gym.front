'use client'

import { MUSCLE_LABEL } from './progress-stats-page'
import type { CoachRow } from '../_model/muscle-balance'

const fa = (n: number) => n.toLocaleString('fa-IR')

const dateFmt = new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' })

const suggestions: Record<CoachRow['suggestion'], { label: string; className: string }> = {
  ok: { label: 'تعادل مناسب', className: 'text-emerald-600 dark:text-emerald-400' },
  'add-here': { label: 'افزودن کارکرد', className: 'text-amber-600 dark:text-amber-400' },
  'ease-off': { label: 'کاهش تدریجی', className: 'text-orange-600 dark:text-orange-400' },
  'needs-rest': { label: 'استراحت لازم', className: 'text-red-600 dark:text-red-400' },
}

export default function CoachReportTable({ rows }: { rows: CoachRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-right text-sm">
        <thead>
        <tr className="border-b text-xs text-muted-foreground">
          <th className="pb-3 font-medium">عضله</th>
          <th className="pb-3 font-medium">ست اصلی</th>
          <th className="pb-3 font-medium">ست کمکی</th>
          <th className="pb-3 font-medium">حجم (kg)</th>
          <th className="pb-3 font-medium">آخرین تمرین</th>
          <th className="pb-3 font-medium">ریکاوری</th>
          <th className="pb-3 font-medium">پیشنهاد</th>
        </tr>
        </thead>
        <tbody>
        {rows.map((row) => {
          const suggestion = suggestions[row.suggestion]
          return (
            <tr key={row.slug} className="border-b last:border-0">
              <td className="py-3 font-semibold">{MUSCLE_LABEL[row.slug] ?? row.slug}</td>
              <td className="py-3">{fa(row.primarySets)}</td>
              <td className="py-3">{fa(row.secondarySets)}</td>
              <td className="py-3">{row.volumeKg ? fa(Math.round(row.volumeKg)) : '—'}</td>
              <td className="text-muted-foreground py-3 text-xs">
                {row.lastWorkedAt ? dateFmt.format(new Date(row.lastWorkedAt)) : '—'}
              </td>
              <td className="py-3">{row.primarySets + row.secondarySets === 0 ? '—' : `${fa(Math.round(row.recoveryPct))}٪`}</td>
              <td className={`py-3 text-xs font-semibold ${suggestion.className}`}>{suggestion.label}</td>
            </tr>
          )
        })}
        </tbody>
      </table>
    </div>
  )
}
