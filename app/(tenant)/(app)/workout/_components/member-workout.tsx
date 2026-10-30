'use client'

import { Dumbbell, Play, RotateCcw, Timer } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { listMyAssignments } from '@/app/(tenant)/_api/assignment-api'
import { getNextSession, startWorkout } from '@/app/(tenant)/_api/workout-api'
import { WorkoutSessionPanel } from '@/app/(tenant)/_components/workout/workout-session-panel'
import {
  PlanAssignmentStatus,
  type AssignmentListItem,
} from '@/app/(tenant)/_model/assignment.types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/toast'

const fa = (value: number) => value.toLocaleString('fa-IR')

type NextSession = Awaited<ReturnType<typeof getNextSession>>

export function MemberWorkout() {
  const router = useRouter()
  const params = useSearchParams()
  const sessionId = params.get('session')
  const requestedAssignment = params.get('assignment')

  const [assignments, setAssignments] = useState<AssignmentListItem[]>([])
  const [next, setNext] = useState<NextSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (sessionId) return

    let cancelled = false

    void (async () => {
      try {
        const rows = await listMyAssignments(PlanAssignmentStatus.Active)
        const active =
          rows.find((row) => row.id === requestedAssignment) ?? rows[0] ?? null
        const planned = active
          ? await getNextSession(active.id).catch(() => null)
          : null

        if (cancelled) return

        setAssignments(rows)
        setNext(planned)
      } catch (error) {
        if (!cancelled)
          toast.error('دریافت جلسه بعدی ناموفق بود', {
            description: error instanceof Error ? error.message : undefined,
          })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [requestedAssignment, sessionId, version])

  const reload = () => {
    setLoading(true)
    setVersion((current) => current + 1)
  }

  const openSession = (id: string) => {
    router.replace(`/workout?session=${encodeURIComponent(id)}`)
  }

  const startPlanned = async (assignment: AssignmentListItem) => {
    setStarting(true)

    try {
      const planned = await getNextSession(assignment.id).catch(() => null)
      const planDayId =
        typeof planned?.planDayId === 'string' ? planned.planDayId : null

      const session = await startWorkout({
        mode: 'planned',
        assignmentId: assignment.id,
        planDayId,
      })

      const id = session.sessionId ?? session.id
      if (!id) throw new Error('پاسخ API شناسه جلسه را برنگرداند.')

      if (session.resumed) toast.success('جلسه در حال اجرا بازیابی شد')
      openSession(id)
    } catch (error) {
      toast.error('شروع جلسه برنامه ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setStarting(false)
    }
  }

  const startFree = async () => {
    setStarting(true)

    try {
      const session = await startWorkout({
        mode: 'free',
        assignmentId: null,
        planDayId: null,
      })

      const id = session.sessionId ?? session.id
      if (!id) throw new Error('پاسخ API شناسه جلسه را برنگرداند.')

      if (session.resumed) toast.success('جلسه در حال اجرا بازیابی شد')
      openSession(id)
    } catch (error) {
      toast.error('شروع تمرین آزاد ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setStarting(false)
    }
  }

  if (sessionId) {
    return (
      <WorkoutSessionPanel
        sessionId={sessionId}
        onClosed={() => {
          router.replace('/workout')
          reload()
        }}
      />
    )
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    )
  }

  const assignment = assignments[0] ?? null
  const exercises = next?.exercises ?? []

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">تمرین</h1>
        <p className="text-muted-foreground text-sm">
          جلسه بعدی برنامه یا یک تمرین آزاد را شروع کن.
        </p>
      </header>

      {assignment ? (
        <section className="bg-card rounded-2xl border p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="bg-primary/12 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
              <Dumbbell className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs">
                {assignment.plan?.plan.title ?? assignment.planTitle ?? 'برنامه فعال'}
              </p>
              <p className="truncate text-base font-bold">
                {next?.dayName ?? 'جلسه بعدی'}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {fa(assignment.completedSessions)} از {fa(assignment.totalSessions)} جلسه تکمیل شده
              </p>
            </div>
          </div>

          {exercises.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {exercises.slice(0, 6).map((exercise) => (
                <li
                  key={exercise.exerciseId}
                  className="bg-muted/40 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs"
                >
                  <span className="truncate">{exercise.exerciseName ?? 'حرکت'}</span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    {fa(exercise.targetSets ?? 0)} ×{' '}
                    {exercise.targetRepsMin ?? exercise.targetRepsMax ?? 0}
                  </span>
                </li>
              ))}
              {exercises.length > 6 && (
                <li className="text-muted-foreground px-3 text-[11px]">
                  و {fa(exercises.length - 6)} حرکت دیگر
                </li>
              )}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => void startPlanned(assignment)} disabled={starting}>
              <Play className="size-4" />
              شروع جلسه برنامه
            </Button>
            <Button variant="outline" onClick={() => void startFree()} disabled={starting}>
              <Timer className="size-4" />
              تمرین آزاد
            </Button>
          </div>
        </section>
      ) : (
        <section className="bg-card flex flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center">
          <Dumbbell className="text-muted-foreground size-7" />
          <p className="text-sm font-bold">برنامه فعالی نداری</p>
          <p className="text-muted-foreground max-w-sm text-xs leading-6">
            یک تمرین آزاد شروع کن؛ هر ستی که ثبت کنی در تاریخچه و پیشرفتت می‌ماند.
          </p>
          <Button onClick={() => void startFree()} disabled={starting}>
            <Play className="size-4" />
            شروع تمرین آزاد
          </Button>
        </section>
      )}

      <button
        onClick={reload}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
      >
        <RotateCcw className="size-3.5" />
        بروزرسانی
      </button>
    </div>
  )
}
