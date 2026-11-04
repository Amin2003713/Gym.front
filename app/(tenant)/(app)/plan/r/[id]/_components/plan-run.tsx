'use client'

import { ArrowRight, CalendarDays, CirclePlay, Timer, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { listMyAssignments } from '@/app/(tenant)/_api/assignment-api'
import { startWorkout } from '@/app/(tenant)/_api/workout-api'
import BodyMapPanel from '@/app/(tenant)/_components/progress/body-map-panel'
import type {
  AssignmentListItem,
  AssignmentPlanDay,
} from '@/app/(tenant)/_model/assignment.types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { muscleLoad } from '@/lib/muscle-mapping'
import { toast } from '@/lib/toast'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

const repsLabel = (min: number | null, max: number | null) => {
  if (min && max && min !== max) return `${fa(min)}–${fa(max)}`
  return min ? fa(min) : max ? fa(max) : '—'
}

type PlanSlotExercise = AssignmentPlanDay['exercises'][number]

/** One line of the day: a single movement, or a superset shown as the two movements it joins. */
type PlanRow = {
  key: string
  names: string[]
  /** The slot whose prescription the row prints (the superset's first movement). */
  slot: PlanSlotExercise['slot']
  isSuperset: boolean
}

/**
 * A superset is stored as two slots sharing a group number; the member reads it as one entry that
 * names both movements back to back, never as two unrelated rows tagged with the same reference.
 */
const foldSupersets = (exercises: PlanSlotExercise[]): PlanRow[] => {
  const rows: PlanRow[] = []
  const groups = new Map<number, PlanRow>()

  for (const exercise of exercises) {
    const name = exercise.exerciseName ?? 'حرکت'
    const group = exercise.slot.supersetGroup

    if (group == null) {
      rows.push({ key: exercise.slot.id, names: [name], slot: exercise.slot, isSuperset: false })
      continue
    }

    const paired = groups.get(group)

    if (paired) {
      paired.names.push(name)
      continue
    }

    const row: PlanRow = {
      key: exercise.slot.id,
      names: [name],
      slot: exercise.slot,
      isSuperset: true,
    }
    groups.set(group, row)
    rows.push(row)
  }

  return rows
}

/**
 * The plan run page (`/plan/r/[id]`): every day of the assignment with its targets, and a start
 * button per day. Starting a specific day passes `planDayId`, which the API validates against the
 * plan version this assignment is pinned to.
 */
export function PlanRun({ assignmentId }: { assignmentId: string }) {
  const router = useRouter()
  const [assignment, setAssignment] = useState<AssignmentListItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [startingDay, setStartingDay] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void listMyAssignments()
      .then((rows) => {
        if (!cancelled) setAssignment(rows.find((row) => row.id === assignmentId) ?? null)
      })
      .catch((error: unknown) => {
        if (!cancelled)
          toast.error('دریافت برنامه ناموفق بود', {
            description: error instanceof Error ? error.message : undefined,
          })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [assignmentId])

  const startDay = async (day: AssignmentPlanDay) => {
    setStartingDay(day.id)

    try {
      const session = await startWorkout({
        mode: 'planned',
        assignmentId,
        planDayId: day.id,
      })

      const id = session.sessionId ?? session.id
      if (!id) throw new Error('پاسخ API شناسه جلسه را برنگرداند.')

      router.push(`/workout?session=${encodeURIComponent(id)}`)
    } catch (error) {
      toast.error('شروع این روز ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
      setStartingDay(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="space-y-3">
        <BackLink />
        <div className="bg-card flex flex-col items-center gap-2 rounded-2xl border border-dashed p-8 text-center">
          <CalendarDays className="text-muted-foreground size-7" />
          <p className="text-sm font-bold">این برنامه پیدا نشد</p>
          <p className="text-muted-foreground max-w-sm text-xs leading-6">
            ممکن است لغو شده باشد یا مال حساب دیگری باشد.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href="/plan">بازگشت به برنامه‌ها</Link>
          </Button>
        </div>
      </div>
    )
  }

  const days = assignment.plan?.days ?? []
  const title = assignment.plan?.plan.title ?? assignment.planTitle ?? 'برنامه تمرینی'
  const percent = Math.round(
    (assignment.completedSessions / Math.max(1, assignment.totalSessions)) * 100,
  )
  const active = assignment.status === 0

  return (
    <div className="space-y-4">
      <BackLink />

      <header className="bg-card rounded-2xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-xs">برنامه در حال اجرا</p>
        <h1 className="mt-1 text-xl font-extrabold">{title}</h1>

        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1">
            <Trophy className="size-3.5" />
            {fa(assignment.completedSessions)} از {fa(assignment.totalSessions)} جلسه
          </span>
          <span>شروع {assignment.startDate}</span>
        </div>

        <div className="bg-muted mt-3 h-1.5 w-full overflow-hidden rounded-full">
          <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
        </div>

        {!active && (
          <p className="mt-3 rounded-xl bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400">
            این برنامه در حال اجرا نیست؛ برای شروع دوباره از صفحه برنامه‌ها فعالش کن.
          </p>
        )}
      </header>

      {days.length === 0 ? (
        <p className="text-muted-foreground rounded-2xl border border-dashed p-6 text-center text-xs leading-6">
          روزهای این برنامه در دسترس نیست.
        </p>
      ) : (
        <ol className="space-y-3">
          {days.map((day) => (
            <li key={day.id} className="bg-card rounded-2xl border p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-primary">روز {fa(day.dayNumber)}</p>
                  <h2 className="text-base font-bold">{day.name}</h2>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {fa(day.exercises.length)} حرکت
                  </p>
                </div>

                <Button
                  size="sm"
                  disabled={!active || startingDay === day.id}
                  onClick={() => void startDay(day)}
                >
                  <CirclePlay className="size-4" />
                  {startingDay === day.id ? 'در حال شروع…' : 'شروع این روز'}
                </Button>
              </div>

              {(() => {
                const load = muscleLoad(day.exercises)
                return Object.keys(load).length > 0 ? (
                  <div className="mt-3 rounded-xl border bg-muted/20 p-3">
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">عضلات هدف این روز</p>
                    <BodyMapPanel palette="load" load={load} className="mx-auto max-w-[260px]"/>
                  </div>
                ) : null
              })()}
              <ul className="mt-3 space-y-1.5">
                {foldSupersets(day.exercises).map((row) => (
                  <li
                    key={row.key}
                    className="bg-muted/40 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{row.names.join(' + ')}</span>
                      {row.isSuperset && (
                        <span className="text-primary text-[10px]">
                          سوپرست · پشت سر هم، با استراحت مشترک
                        </span>
                      )}
                    </span>
                    <span className="text-muted-foreground flex shrink-0 items-center gap-2 tabular-nums">
                      <span>
                        {fa(row.slot.targetSets)} ×{' '}
                        {repsLabel(row.slot.targetRepsMin, row.slot.targetRepsMax)}
                      </span>
                      {row.slot.targetRir !== null && (
                        <span className="text-[10px]">RIR {row.slot.targetRir}</span>
                      )}
                      <span className="inline-flex items-center gap-0.5 text-[10px]">
                        <Timer className="size-3" />
                        {fa(row.slot.restSeconds)}s
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/plan"
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-semibold"
    >
      <ArrowRight className="size-3.5" />
      برنامه‌های من
    </Link>
  )
}
