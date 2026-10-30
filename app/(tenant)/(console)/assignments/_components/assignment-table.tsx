'use client'


import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import type {
  AssignmentListItem,
  CoachAssignmentItem,
  PlanAssignmentStatus,
} from '@/app/(tenant)/_model/assignment.types'

const statusLabel: Record<PlanAssignmentStatus, string> = {
  Active: 'فعال',
  Paused: 'متوقف',
  Completed: 'تکمیل‌شده',
  Cancelled: 'لغوشده',
}
const statusVariant = (s: PlanAssignmentStatus) =>
  s === 'Active' ? 'default' : s === 'Cancelled' ? 'destructive' : 'secondary'

type AssignmentRow = CoachAssignmentItem | AssignmentListItem

interface AssignmentTableProps {
  items: AssignmentRow[]
  loading: boolean
  coachView: boolean
  onChangeStatus: (item: AssignmentRow, next: 'Active' | 'Paused' | 'Cancelled') => void
}

export function AssignmentTable({
  items,
  loading,
  coachView,
  onChangeStatus,
}: AssignmentTableProps) {
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
            const nextStatus = item.status
            const id = ('assignmentId' in item && item.assignmentId) || item.id
            return (
              <tr key={`${id}-${index}`} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3 font-medium">
                  {coach.planTitle ?? item.planTitle ?? item.planId ?? 'برنامه'}
                </td>
                <td className="p-3">
                  {coach.memberName ?? coach.memberEmail ?? coach.memberId ?? 'من'}
                </td>
                <td className="p-3">
                  <Badge variant={statusVariant(nextStatus)}>
                    {statusLabel[nextStatus] ?? nextStatus}
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
                  <div className="flex gap-1">
                    {nextStatus === 'Active' && (
                      <Button size="sm" variant="outline" onClick={() => onChangeStatus(item, 'Paused')}>
                        توقف
                      </Button>
                    )}
                    {nextStatus === 'Paused' && (
                      <Button size="sm" variant="outline" onClick={() => onChangeStatus(item, 'Active')}>
                        ادامه
                      </Button>
                    )}
                    {coachView && (nextStatus === 'Active' || nextStatus === 'Paused') && (
                      <Button size="sm" variant="ghost" onClick={() => onChangeStatus(item, 'Cancelled')}>
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
    </div>
  )
}
