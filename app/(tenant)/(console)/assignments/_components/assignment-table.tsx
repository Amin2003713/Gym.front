'use client'

import { useState } from 'react'

import BodyMapPanel from '@/app/(tenant)/_components/progress/body-map-panel'
import {
  PlanAssignmentStatus as AssignmentStatus,
  type AssignmentListItem,
  type CoachAssignmentItem,
  type PlanAssignmentStatus,
} from '@/app/(tenant)/_model/assignment.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { muscleLoad } from '@/lib/muscle-mapping'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

const statusLabel: Record<PlanAssignmentStatus, string> = {
  [0]: 'فعال',
  [1]: 'متوقف',
  [2]: 'تکمیل‌شده',
  [3]: 'لغوشده',
}

const normalizeStatus = (value: PlanAssignmentStatus | string): PlanAssignmentStatus => {
  if (typeof value === 'number') return value
  const names: Record<string, PlanAssignmentStatus> = {
    Active: 0,
    Paused: 1,
    Completed: 2,
    Cancelled: 3,
  }
  return names[value] ?? (Number(value) as PlanAssignmentStatus)
}

const statusVariant = (status: PlanAssignmentStatus) =>
  status === AssignmentStatus.Active
    ? 'default'
    : status === AssignmentStatus.Cancelled
      ? 'destructive'
      : 'secondary'

type AssignmentRow = CoachAssignmentItem | AssignmentListItem

const memberName = (row: AssignmentRow) => {
  const member = 'member' in row ? row.member : undefined
  return (
    `${member?.firstName ?? ''} ${member?.lastName ?? ''}`.trim() ||
    member?.email ||
    'من'
  )
}

const planTitle = (row: AssignmentRow) =>
  row.planTitle ?? row.plan?.plan.title ?? 'برنامه تمرینی'

interface AssignmentTableProps {
  items: AssignmentRow[]
  loading: boolean
  coachView: boolean
  onChangeStatus: (item: AssignmentRow, next: PlanAssignmentStatus) => void
}

/**
 * Assignments table plus one detail panel. The panel carries the plan's days and a body map of
 * the muscles that plan actually trains, so a coach can judge a plan's coverage without leaving
 * the page.
 */
export function AssignmentTable({
  items,
  loading,
  coachView,
  onChangeStatus,
}: AssignmentTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected =
    items.find((item) => (('assignmentId' in item && item.assignmentId) || item.id) === selectedId) ??
    null

  if (loading && items.length === 0) {
    return (
      <div className="space-y-2" aria-busy="true">
        {[0, 1, 2].map((key) => (
          <div key={key} className="bg-muted/50 h-12 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">
        تخصیصی برای نمایش نیست. با «تخصیص گروهی» اولین برنامه را به اعضا بدهید.
      </div>
    )
  }

  const days = selected?.plan?.days ?? []
  const load = muscleLoad(
    days.flatMap((day) =>
      day.exercises.map((exercise) => ({
        bodyPart: exercise.bodyPart,
        target: exercise.target,
      })),
    ),
  )

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <caption className="sr-only">فهرست تخصیص برنامه‌ها</caption>
          <thead>
            <tr className="text-muted-foreground border-b text-right">
              {['برنامه', 'شاگرد', 'وضعیت', 'پیشرفت', 'شروع', 'پایان', 'عملیات'].map(
                (header) => (
                  <th key={header} scope="col" className="p-3 font-medium">
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const id = ('assignmentId' in item && item.assignmentId) || item.id
              const status = normalizeStatus(item.status)
              const percent = Math.round(
                (item.completedSessions / Math.max(1, item.totalSessions)) * 100,
              )

              return (
                <tr
                  key={`${id}-${index}`}
                  className={`hover:bg-muted/30 border-b last:border-0 ${
                    selectedId === id ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className="p-3 font-medium">{planTitle(item)}</td>
                  <td className="p-3">{memberName(item)}</td>
                  <td className="p-3">
                    <Badge variant={statusVariant(status)}>
                      {statusLabel[status] ?? String(status)}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-muted h-1.5 w-24 overflow-hidden rounded-full">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {fa(item.completedSessions)} / {fa(item.totalSessions)}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 tabular-nums" dir="ltr">
                    {item.startDate}
                  </td>
                  <td className="p-3 tabular-nums" dir="ltr">
                    {item.endDate ?? '—'}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        variant={selectedId === id ? 'secondary' : 'ghost'}
                        aria-expanded={selectedId === id}
                        aria-label={`جزئیات ${planTitle(item)} برای ${memberName(item)}`}
                        onClick={() => setSelectedId(selectedId === id ? null : id)}
                      >
                        جزئیات
                      </Button>
                      {status === AssignmentStatus.Active && (
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`توقف ${planTitle(item)}`}
                          onClick={() => onChangeStatus(item, AssignmentStatus.Paused)}
                        >
                          توقف
                        </Button>
                      )}
                      {status === AssignmentStatus.Paused && (
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`ادامه ${planTitle(item)}`}
                          onClick={() => onChangeStatus(item, AssignmentStatus.Active)}
                        >
                          ادامه
                        </Button>
                      )}
                      {coachView &&
                        (status === AssignmentStatus.Active ||
                          status === AssignmentStatus.Paused) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            aria-label={`لغو ${planTitle(item)}`}
                            onClick={() => onChangeStatus(item, AssignmentStatus.Cancelled)}
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
      </div>

      {selected && (
        <section
          className="bg-muted/20 rounded-2xl border p-4"
          aria-label="جزئیات تخصیص"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-semibold">{planTitle(selected)}</h3>
              <p className="text-muted-foreground mt-1 text-xs">
                {memberName(selected)} ·{' '}
                {statusLabel[normalizeStatus(selected.status)]}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setSelectedId(null)}>
              بستن
            </Button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <DetailStat
              label="پیشرفت"
              value={`${fa(selected.completedSessions)} از ${fa(selected.totalSessions)}`}
              detail={`${fa(Math.round((selected.completedSessions / Math.max(1, selected.totalSessions)) * 100))}٪`}
            />
            <DetailStat label="شروع" value={selected.startDate} ltr />
            <DetailStat label="پایان" value={selected.endDate ?? '—'} ltr />
            <DetailStat label="روزهای برنامه" value={fa(days.length)} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
            {days.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {days.map((day) => (
                  <div key={day.id} className="bg-background rounded-xl border p-3">
                    <p className="text-sm font-medium">
                      {day.name || `روز ${fa(day.dayNumber)}`}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {fa(day.exercises.length)} حرکت
                    </p>
                    <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
                      {day.exercises.slice(0, 6).map((exercise) => (
                        <li key={exercise.slot.id} className="flex justify-between gap-2">
                          <span className="truncate">
                            {exercise.exerciseName ?? 'حرکت'}
                          </span>
                          <span className="shrink-0 tabular-nums">
                            {fa(exercise.slot.targetSets)} ست
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {Object.keys(load).length > 0 ? (
              <div className="bg-background rounded-xl border p-3">
                <p className="text-xs font-semibold">عضلات تحت پوشش برنامه</p>
                <BodyMapPanel palette="load" load={load} />
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                جزئیات روزهای این برنامه در دسترس نیست.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

function DetailStat({
  label,
  value,
  detail,
  ltr = false,
}: {
  label: string
  value: string
  detail?: string
  ltr?: boolean
}) {
  return (
    <div className="bg-background rounded-lg border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-semibold tabular-nums" dir={ltr ? 'ltr' : undefined}>
        {value}
      </p>
      {detail && <p className="text-muted-foreground mt-0.5 text-[11px]">{detail}</p>}
    </div>
  )
}
