'use client'


import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import type { WorkoutListItem } from '../_model/workout.types'

interface MyWorkoutsTableProps {
  items: WorkoutListItem[]
  loading: boolean
  onResume: (sessionId: string) => void
}

export function MyWorkoutsTable({ items, loading, onResume }: MyWorkoutsTableProps) {
  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">در حال دریافت سوابق…</div>
  }
  if (!items.length) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        هنوز جلسه تمرینی ثبت نشده است.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b text-right text-muted-foreground">
            {['عنوان', 'نوع', 'وضعیت', 'شروع', 'تکمیل', 'ست‌ها', 'حجم کل', 'عملیات'].map((header) => (
              <th key={header} className="p-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.id}-${index}`} className="border-b last:border-0 hover:bg-muted/30">
              <td className="p-3 font-medium">{item.title || 'جلسه تمرین'}</td>
              <td className="p-3">
                <Badge variant="secondary">{item.type === 1 ? 'آزاد' : item.type === 0 ? 'برنامه‌ریزی‌شده' : '—'}</Badge>
              </td>
              <td className="p-3">
                <Badge
                  variant={
                    item.status === 1 /* Completed (numeric enum) */
                      ? 'default'
                      : item.status === 2 /* Abandoned */
                        ? 'destructive'
                        : 'outline'
                  }
                >
                  {item.status === 1 ? 'تکمیل‌شده' : item.status === 2 ? 'لغوشده' : item.status === 0 ? 'در جریان' : '—'}
                </Badge>
              </td>
              <td className="p-3" dir="ltr">
                {item.startedAt ? new Date(item.startedAt).toLocaleString() : '—'}
              </td>
              <td className="p-3" dir="ltr">
                {item.completedAt ? new Date(item.completedAt).toLocaleString() : '—'}
              </td>
              <td className="p-3">{item.totalSets ?? '—'}</td>
              <td className="p-3">
                {item.totalVolumeKg != null
                  ? `${item.totalVolumeKg.toLocaleString('fa-IR')} کیلوگرم`
                  : '—'}
              </td>
              <td className="p-3">
                {item.status === 0 /* InProgress */ && (
                  <Button size="sm" onClick={() => onResume(item.sessionId ?? item.id)}>
                    ادامه تمرین
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
