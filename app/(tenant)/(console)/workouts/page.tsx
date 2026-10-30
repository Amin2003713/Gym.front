'use client'

import { Play, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUserRoles } from '@/hooks/use-user-roles'
import { toast } from '@/lib/toast'

import { listMyAssignments } from '@/app/(tenant)/_api/assignment-api'
import {
  AssignmentListItem,
  PlanAssignmentStatus,
} from '@/app/(tenant)/_model/assignment.types'

import {
  getNextSession,
  listMyWorkouts,
  type NextSessionResponse,
  startWorkout,
} from '@/app/(tenant)/_api/workout-api'
import { MyWorkoutsTable } from './_components/my-workouts-table'
import { WorkoutSessionPanel } from '@/app/(tenant)/_components/workout/workout-session-panel'
import type {
  WorkoutListItem,
  WorkoutSessionType,
} from '@/app/(tenant)/_model/workout.types'

export default function WorkoutsPage() {
  const { isTraineeOnly, isAdmin, isTrainer } = useUserRoles()

  const [items, setItems] = useState<WorkoutListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('')
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [plannedOpen, setPlannedOpen] = useState(false)
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // type arrives as the numeric enum value (''/0/1) from the filter select.
      const result = await listMyWorkouts(
        type === '' ? '' : (Number(type) as WorkoutSessionType),
      )
      setItems(
        Array.isArray(result)
          ? result
          : [...(result.items ?? []), ...(result.results ?? [])],
      )
    } catch (e) {
      toast.error('دریافت سوابق تمرین ناموفق بود', {
        description: e instanceof Error ? e.message : 'خطای ناشناخته',
      })
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    void load()
  }, [load])

  const loadAssignments = useCallback(async () => {
    try {
      const rows = await listMyAssignments(PlanAssignmentStatus.Active)
      setAssignments(rows)
    } catch {
      toast.error('دریافت برنامه‌های فعال ناموفق بود')
    }
  }, [])

  const openPlannedFlow = () => {
    setPlannedOpen(true)
    void loadAssignments()
  }

  const startFree = async () => {
    setStarting(true)
    try {
      const result = await startWorkout({
        mode: 'free',
        assignmentId: null,
        planDayId: null,
      })
      const id = result.sessionId ?? result.id
      if (!id) throw new Error('پاسخ API شناسه جلسه را برنگرداند.')
      setActiveSessionId(id)
      if (result.resumed) toast.success('تمرین در حال اجرا بازیابی شد')
    } catch (e) {
      toast.error('شروع تمرین ناموفق بود', {
        description: e instanceof Error ? e.message : 'خطای ناشناخته',
      })
    } finally {
      setStarting(false)
    }
  }

  const startFromAssignment = async (
    assignmentId: string,
    planDayId: string | null,
  ) => {
    setStarting(true)
    try {
      // Ask the API which day/session comes next for this assignment when the
      // plan day is not known yet.
      if (!planDayId) {
        const next = (await getNextSession(assignmentId)) as NextSessionResponse
        planDayId = typeof next?.planDayId === 'string' ? next.planDayId : null
      }
      const result = await startWorkout({
        mode: 'planned',
        assignmentId,
        planDayId,
      })
      const id = result.sessionId ?? result.id
      if (!id) throw new Error('پاسخ API شناسه جلسه را برنگرداند.')
      setActiveSessionId(id)
      setPlannedOpen(false)
    } catch (e) {
      toast.error('شروع تمرین برنامه‌ریزی‌شده ناموفق بود', {
        description: e instanceof Error ? e.message : 'خطای ناشناخته',
      })
    } finally {
      setStarting(false)
    }
  }

  if (activeSessionId) {
    return (
      <div className="space-y-4" dir="rtl">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">جلسه تمرین</h1>
          <Button
            variant="outline"
            onClick={() => {
              setActiveSessionId(null)
              void load()
            }}
          >
            بازگشت به سوابق
          </Button>
        </div>
        <WorkoutSessionPanel
          sessionId={activeSessionId}
          onClosed={() => {
            setActiveSessionId(null)
            void load()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">تمرین‌ها</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isTraineeOnly
              ? 'شروع جلسه بعدی برنامه مربی یا تمرین آزاد'
              : 'شروع تمرین آزاد یا برنامه‌ریزی‌شده، ثبت ست‌ها و مشاهده سوابق'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw
              className={`ml-2 size-4 ${loading ? 'animate-spin' : ''}`}
            />
            بروزرسانی
          </Button>
          <Button
            onClick={openPlannedFlow}
            disabled={starting}
            variant="outline"
          >
            <Play className="ml-2 size-4" />
            شروع جلسه برنامه‌ریزی‌شده
          </Button>
          <Button onClick={() => void startFree()} disabled={starting}>
            <Play className="ml-2 size-4" />
            {starting ? 'در حال شروع…' : 'شروع تمرین آزاد'}
          </Button>
        </div>
      </div>

      {plannedOpen && (
        <Card>
          <CardHeader>
            <CardTitle>جلسه بعدی برنامه</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {assignments.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                برنامه فعالی برای شروع جلسه بعدی ندارید. از بخش برنامه‌های من
                ثبت‌نام یا تخصیص را بررسی کنید.
              </p>
            ) : (
              assignments.map((assignment) => {
                const id: string =
                  ('assignmentId' in assignment &&
                  typeof assignment.assignmentId === 'string' &&
                  assignment.assignmentId
                    ? assignment.assignmentId
                    : assignment.id) || assignment.id
                return (
                  <div
                    key={id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {assignment.planTitle ?? 'برنامه تمرینی'}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {assignment.completedSessions} از{' '}
                        {assignment.totalSessions} جلسه تکمیل شده
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        void startFromAssignment(
                          id,
                          assignment.planDayId ?? null,
                        )
                      }
                      disabled={
                        starting ||
                        assignment.status !== PlanAssignmentStatus.Active
                      }
                    >
                      شروع جلسه بعد
                    </Button>
                  </div>
                )
              })
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPlannedOpen(false)}>
                بستن
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>سوابق تمرین</CardTitle>
          <select
            className="bg-background h-10 rounded-md border px-3"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">همه انواع</option>
            <option value="0">برنامه‌ریزی‌شده</option>
            <option value="1">آزاد</option>
          </select>
        </CardHeader>
        <CardContent>
          <MyWorkoutsTable
            items={items}
            loading={loading}
            onResume={(id) => setActiveSessionId(id)}
          />
        </CardContent>
      </Card>

      {(isAdmin || isTrainer) && (
        <p className="text-muted-foreground text-xs">
          نقش شما: {isTrainer ? 'مربی' : 'مالک گروه'} · جلسه‌های فعال قابل
          بازیابی و تکمیل هستند.
        </p>
      )}
    </div>
  )
}
