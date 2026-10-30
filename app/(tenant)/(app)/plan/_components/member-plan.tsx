'use client'

import { CalendarDays, ChevronDown, CirclePlay, Target } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { listMyAssignments } from '@/app/(tenant)/_api/assignment-api'
import {
  PlanAssignmentStatus,
  type AssignmentListItem,
  type AssignmentPlanDay,
} from '@/app/(tenant)/_model/assignment.types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/toast'

const fa = (value: number) => value.toLocaleString('fa-IR')

const repsLabel = (min: number | null, max: number | null) => {
  if (min && max && min !== max) return `${fa(min)}-${fa(max)}`
  return min ? fa(min) : max ? fa(max) : '—'
}

export function MemberPlan() {
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void listMyAssignments(PlanAssignmentStatus.Active)
      .then((rows) => {
        if (cancelled) return

        setAssignments(rows)
        setOpenId((current) => current ?? rows[0]?.id ?? null)
      })
      .catch((error: unknown) => {
        if (!cancelled)
          toast.error('دریافت برنامه‌ها ناموفق بود', {
            description: error instanceof Error ? error.message : undefined,
          })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">برنامه من</h1>
        <p className="text-muted-foreground text-sm">
          برنامه‌هایی که مربی برایت گذاشته یا خودت شروع کرده‌ای.
        </p>
      </header>

      {assignments.length === 0 ? (
        <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center">
          <CalendarDays className="text-muted-foreground size-7" />
          <p className="text-sm font-bold">برنامه فعالی نداری</p>
          <p className="text-muted-foreground max-w-sm text-xs leading-6">
            می‌توانی تمرین آزاد شروع کنی یا از مربی‌ات بخواه برنامه بگذارد. برنامه‌های عمومی باشگاه هم
            از بخش برنامه‌ها در دسترس‌اند.
          </p>
          <Button asChild>
            <Link href="/workout">شروع تمرین</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const title = assignment.plan?.plan.title ?? assignment.planTitle ?? 'برنامه تمرینی'
            const days = assignment.plan?.days ?? []
            const open = openId === assignment.id
            const percent = Math.round(
              (assignment.completedSessions / Math.max(1, assignment.totalSessions)) * 100,
            )

            return (
              <section
                key={assignment.id}
                className="bg-card overflow-hidden rounded-2xl border shadow-sm"
              >
                <button
                  onClick={() => setOpenId(open ? null : assignment.id)}
                  aria-expanded={open}
                  className="flex w-full items-start gap-3 p-4 text-right"
                >
                  <span className="bg-primary/12 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <Target className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{title}</span>
                    <span className="text-muted-foreground mt-1 block text-xs">
                      {fa(assignment.completedSessions)} از {fa(assignment.totalSessions)} جلسه ·{' '}
                      {fa(percent)}٪
                    </span>
                    <span className="bg-muted mt-2 block h-1.5 w-full overflow-hidden rounded-full">
                      <span
                        className="bg-primary block h-full rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                  </span>
                  <ChevronDown
                    className={`text-muted-foreground size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>

                {open && (
                  <div className="space-y-3 border-t p-4">
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm">
                        <Link href={`/workout?assignment=${encodeURIComponent(assignment.id)}`}>
                          <CirclePlay className="size-4" />
                          شروع جلسه بعد
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/plan/r/${encodeURIComponent(assignment.id)}`}>
                          <CalendarDays className="size-4" />
                          روزهای برنامه
                        </Link>
                      </Button>
                      <span className="text-muted-foreground self-center text-xs">
                        شروع {assignment.startDate}
                      </span>
                    </div>

                    {days.length === 0 ? (
                      <p className="text-muted-foreground text-xs">
                        جزئیات روزهای این برنامه در دسترس نیست.
                      </p>
                    ) : (
                      <ol className="space-y-2">
                        {days.map((day) => (
                          <PlanDayRow key={day.dayNumber} day={day} />
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PlanDayRow({ day }: { day: AssignmentPlanDay }) {
  return (
    <li className="bg-muted/40 rounded-xl p-3">
      <p className="text-xs font-bold">
        روز {fa(day.dayNumber)} · {day.name}
      </p>
      <ul className="mt-2 space-y-1">
        {day.exercises.map((exercise) => (
          <li
            key={exercise.slot.id}
            className="flex items-center justify-between gap-2 text-xs"
          >
            <span className="truncate">{exercise.exerciseName ?? 'حرکت'}</span>
            <span className="text-muted-foreground shrink-0 tabular-nums">
              {fa(exercise.slot.targetSets)} ×{' '}
              {repsLabel(exercise.slot.targetRepsMin, exercise.slot.targetRepsMax)}
            </span>
          </li>
        ))}
      </ul>
    </li>
  )
}
