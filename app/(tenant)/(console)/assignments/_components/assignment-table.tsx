'use client'


import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import type {
  AssignmentListItem,
  CoachAssignmentItem,
  PlanAssignmentStatus,
} from '@/app/(tenant)/_model/assignment.types'
import { PlanAssignmentStatus as AssignmentStatus } from '@/app/(tenant)/_model/assignment.types'

const statusLabel: Record<PlanAssignmentStatus, string> = {
  [0]: 'فعال',
  [1]: 'متوقف',
  [2]: 'تکمیل‌شده',
  [3]: 'لغوشده',
}
const normalizeStatus = (value: PlanAssignmentStatus | string): PlanAssignmentStatus => {
  if (typeof value === 'number') return value
  const names: Record<string, PlanAssignmentStatus> = { Active: 0, Paused: 1, Completed: 2, Cancelled: 3 }
  return names[value] ?? (Number(value) as PlanAssignmentStatus)
}
const statusVariant = (s: PlanAssignmentStatus) =>
  s === AssignmentStatus.Active ? 'default' : s === AssignmentStatus.Cancelled ? 'destructive' : 'secondary'

type AssignmentRow = CoachAssignmentItem | AssignmentListItem

interface AssignmentTableProps {
  items: AssignmentRow[]
  loading: boolean
  coachView: boolean
  onChangeStatus: (item: AssignmentRow, next: PlanAssignmentStatus) => void
}

export function AssignmentTable({
  items,
  loading,
  coachView,
  onChangeStatus,
}: AssignmentTableProps) {
  const [selected, setSelected] = useState<AssignmentRow | null>(null)
  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">در حال دریافت تخصیص‌ها…</div>
  }
  if (!items.length) {
    return <div className="py-12 text-center text-muted-foreground">تخصیصی برای نمایش نیست.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] text-sm">
        <thead>
          <tr className="border-b text-right text-muted-foreground">
            {['برنامه', 'شاگرد', 'وضعیت', 'جلسات', 'شروع', 'پایان', 'عملیات'].map((header) => (
              <th key={header} className="p-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const coach = item as CoachAssignmentItem
            const nextStatus = normalizeStatus(item.status)
            const id = ('assignmentId' in item && item.assignmentId) || item.id
            return (
              <tr key={`${id}-${index}`} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3 font-medium">
                  {coach.planTitle ?? item.planTitle ?? coach.plan?.plan.title ?? item.planId ?? 'برنامه'}
                </td>
                <td className="p-3">
                  {coach.member ? `${coach.member.firstName ?? ''} ${coach.member.lastName ?? ''}`.trim() || coach.member.email : coach.memberId ?? 'من'}
                </td>
                <td className="p-3">
                  <Badge variant={statusVariant(nextStatus)}>
                    {statusLabel[nextStatus] ?? String(nextStatus)}
                  </Badge>
                </td>
                <td className="p-3">
                  {item.completedSessions} / {item.totalSessions}
                </td>
                <td className="p-3" dir="ltr">
                  {item.startDate}
                </td>
                <td className="p-3" dir="ltr">
                  {item.endDate ?? '—'}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setSelected(item)}>
                      جزئیات
                    </Button>
                    {nextStatus === AssignmentStatus.Active && (
                      <Button size="sm" variant="outline" onClick={() => onChangeStatus(item, AssignmentStatus.Paused)}>
                        توقف
                      </Button>
                    )}
                    {nextStatus === AssignmentStatus.Paused && (
                      <Button size="sm" variant="outline" onClick={() => onChangeStatus(item, AssignmentStatus.Active)}>
                        ادامه
                      </Button>
                    )}
                    {coachView && (nextStatus === AssignmentStatus.Active || nextStatus === AssignmentStatus.Paused) && (
                      <Button size="sm" variant="ghost" onClick={() => onChangeStatus(item, AssignmentStatus.Cancelled)}>
                        لغو
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {selected && (
        <section className="mt-4 rounded-xl border bg-muted/20 p-4" aria-label="جزئیات تخصیص">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{selected.planTitle ?? ('plan' in selected ? selected.plan?.plan.title : undefined) ?? 'برنامه تمرینی'}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {('member' in selected && selected.member ? `${selected.member.firstName ?? ''} ${selected.member.lastName ?? ''}`.trim() || selected.member.email : undefined) || 'تخصیص شخصی'}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setSelected(null)}>بستن</Button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-background p-3">
              <p className="text-xs text-muted-foreground">پیشرفت جلسات</p>
              <p className="mt-1 font-semibold tabular-nums">{selected.completedSessions} از {selected.totalSessions}</p>
            </div>
            <div className="rounded-lg bg-background p-3">
              <p className="text-xs text-muted-foreground">تاریخ شروع</p>
              <p className="mt-1 font-semibold" dir="ltr">{selected.startDate}</p>
            </div>
            <div className="rounded-lg bg-background p-3">
              <p className="text-xs text-muted-foreground">تاریخ پایان</p>
              <p className="mt-1 font-semibold" dir="ltr">{selected.endDate ?? '—'}</p>
            </div>
          </div>
          {('plan' in selected && selected.plan?.days?.length) ? (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold">روزهای برنامه</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {('plan' in selected ? selected.plan?.days ?? [] : []).map((day) => (
                  <div key={day.id} className="rounded-lg border bg-background p-3">
                    <p className="text-sm font-medium">{day.name || `روز ${day.dayNumber}`}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{day.exercises.length} حرکت</p>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {day.exercises.slice(0, 5).map((exercise) => (
                        <li key={exercise.slot.id}>{exercise.exerciseName ?? 'حرکت'} · {exercise.slot.targetSets} ست</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      )}
    </div>
  )
}
