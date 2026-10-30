'use client'

import {
  AssignmentListItem,
  CoachAssignmentItem,
  PlanAssignmentStatus,
} from '@/app/(tenant)/_model/assignment.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const statusLabel: Record<PlanAssignmentStatus, string> = {
  0: 'فعال',
  1: 'متوقف',
  2: 'تکمیل‌شده',
  3: 'لغوشده',
}
const statusVariant = (s: PlanAssignmentStatus) =>
  s === PlanAssignmentStatus.Active
    ? 'default'
    : s === PlanAssignmentStatus.Completed
      ? 'destructive'
      : 'secondary'

type AssignmentRow = CoachAssignmentItem | AssignmentListItem

interface AssignmentTableProps {
  items: AssignmentRow[]
  loading: boolean
  coachView: boolean
  onChangeStatus: (
    item: AssignmentRow,
    next: 'Active' | 'Paused' | 'Cancelled',
  ) => void
}

export function AssignmentTable({
  items,
  loading,
  coachView,
  onChangeStatus,
}: AssignmentTableProps) {
  if (loading) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        در حال دریافت تخصیص‌ها…
      </div>
    )
  }
  if (!items.length) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        تخصیصی برای نمایش نیست.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] text-sm">
        <thead>
          <tr className="text-muted-foreground border-b text-right">
            {[
              'برنامه',
              'شاگرد',
              'وضعیت',
              'جلسات',
              'شروع',
              'پایان',
              'عملیات',
            ].map((header) => (
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
              <tr
                key={`${id}-${index}`}
                className="hover:bg-muted/30 border-b last:border-0"
              >
                <td className="p-3 font-medium">
                  {coach.planTitle ?? item.planTitle ?? item.planId ?? 'برنامه'}
                </td>
                <td className="p-3">
                  {coach.memberName ??
                    coach.memberEmail ??
                    coach.memberId ??
                    'من'}
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
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelected(item)}
                    >
                      جزئیات
                    </Button>
                    {nextStatus === PlanAssignmentStatus.Active && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onChangeStatus(item, 'Paused')}
                      >
                        توقف
                      </Button>
                    )}
                    {nextStatus === PlanAssignmentStatus.Paused && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onChangeStatus(item, 'Active')}
                      >
                        ادامه
                      </Button>
                    )}
                    {coachView &&
                      (nextStatus === PlanAssignmentStatus.Active ||
                        nextStatus === PlanAssignmentStatus.Paused) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onChangeStatus(item, 'Cancelled')}
                        >
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
        <section
          className="bg-muted/20 mt-4 rounded-xl border p-4"
          aria-label="جزئیات تخصیص"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">
                {selected.planTitle ??
                  ('plan' in selected
                    ? selected.plan?.plan.title
                    : undefined) ??
                  'برنامه تمرینی'}
              </h3>
              <p className="text-muted-foreground mt-1 text-xs">
                {('memberName' in selected && selected.memberName) ||
                  ('memberEmail' in selected && selected.memberEmail) ||
                  'تخصیص شخصی'}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelected(null)}
            >
              بستن
            </Button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="bg-background rounded-lg p-3">
              <p className="text-muted-foreground text-xs">پیشرفت جلسات</p>
              <p className="mt-1 font-semibold tabular-nums">
                {selected.completedSessions} از {selected.totalSessions}
              </p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-muted-foreground text-xs">تاریخ شروع</p>
              <p className="mt-1 font-semibold" dir="ltr">
                {selected.startDate}
              </p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-muted-foreground text-xs">تاریخ پایان</p>
              <p className="mt-1 font-semibold" dir="ltr">
                {selected.endDate ?? '—'}
              </p>
            </div>
          </div>
          {'plan' in selected && selected.plan?.days?.length ? (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold">روزهای برنامه</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {('plan' in selected ? (selected.plan?.days ?? []) : []).map(
                  (day) => (
                    <div
                      key={day.id}
                      className="bg-background rounded-lg border p-3"
                    >
                      <p className="text-sm font-medium">
                        {day.name || `روز ${day.dayNumber}`}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {day.exercises.length} حرکت
                      </p>
                      <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
                        {day.exercises.slice(0, 5).map((exercise) => (
                          <li key={exercise.slot.id}>
                            {exercise.exerciseName ?? 'حرکت'} ·{' '}
                            {exercise.slot.targetSets} ست
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
                )}
              </div>
            </div>
          ) : null}
        </section>
      )}
    </div>
  )
}
